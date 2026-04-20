from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError


MAX_REGION_SCAN_WORKERS = 8


def _list_regions(session: boto3.Session) -> List[str]:
    ec2 = session.client("ec2", region_name="us-east-1")
    response = ec2.describe_regions(AllRegions=True)
    return [region["RegionName"] for region in response.get("Regions", [])]


def _session_kwargs_from_session(session: boto3.Session) -> Dict[str, str]:
    credentials = session.get_credentials()
    if not credentials:
        return {}

    frozen = credentials.get_frozen_credentials()
    session_kwargs = {
        "aws_access_key_id": frozen.access_key,
        "aws_secret_access_key": frozen.secret_key,
    }
    if frozen.token:
        session_kwargs["aws_session_token"] = frozen.token
    return session_kwargs


def _scan_region(
    session_kwargs: Dict[str, str],
    region: str,
    max_resources_per_region: int,
) -> tuple[Dict[str, object], List[str]]:
    session = boto3.Session(**session_kwargs)
    ec2_instances = []
    rds_instances = []
    warnings: List[str] = []

    try:
        ec2 = session.client("ec2", region_name=region)
        paginator = ec2.get_paginator("describe_instances")
        for page in paginator.paginate(PaginationConfig={"PageSize": 100}):
            for reservation in page.get("Reservations", []):
                for instance in reservation.get("Instances", []):
                    ec2_instances.append(
                        {
                            "instance_id": instance.get("InstanceId"),
                            "state": instance.get("State", {}).get("Name"),
                            "type": instance.get("InstanceType"),
                            "private_ip": instance.get("PrivateIpAddress"),
                            "vpc_id": instance.get("VpcId"),
                        }
                    )
                    if len(ec2_instances) >= max_resources_per_region:
                        break
                if len(ec2_instances) >= max_resources_per_region:
                    break
            if len(ec2_instances) >= max_resources_per_region:
                break
    except (BotoCoreError, ClientError) as exc:
        warnings.append(f"EC2 list failed in {region}: {exc}")

    try:
        rds = session.client("rds", region_name=region)
        paginator = rds.get_paginator("describe_db_instances")
        for page in paginator.paginate(PaginationConfig={"PageSize": 100}):
            for db in page.get("DBInstances", []):
                rds_instances.append(
                    {
                        "db_instance_identifier": db.get("DBInstanceIdentifier"),
                        "engine": db.get("Engine"),
                        "status": db.get("DBInstanceStatus"),
                        "class": db.get("DBInstanceClass"),
                        "endpoint": (db.get("Endpoint") or {}).get("Address"),
                    }
                )
                if len(rds_instances) >= max_resources_per_region:
                    break
            if len(rds_instances) >= max_resources_per_region:
                break
    except (BotoCoreError, ClientError) as exc:
        warnings.append(f"RDS list failed in {region}: {exc}")

    return {
        "region": region,
        "ec2_instances": ec2_instances,
        "rds_instances": rds_instances,
    }, warnings


def discover_aws_resources(
    access_key_id: str | None = None,
    secret_access_key: str | None = None,
    session_token: Optional[str] = None,
    regions: Optional[List[str]] = None,
    max_resources_per_region: int = 2000,
    role_arn: str | None = None,
    external_id: str | None = None,
) -> Dict[str, object]:
    base_session = boto3.Session(
        aws_access_key_id=access_key_id,
        aws_secret_access_key=secret_access_key,
        aws_session_token=session_token,
    )

    session = base_session
    if role_arn:
        sts = base_session.client("sts")
        assume_kwargs = {
            "RoleArn": role_arn,
            "RoleSessionName": "universal-discovery-app",
        }
        if external_id:
            assume_kwargs["ExternalId"] = external_id

        assumed = sts.assume_role(**assume_kwargs)
        creds = assumed.get("Credentials") or {}
        session = boto3.Session(
            aws_access_key_id=creds.get("AccessKeyId"),
            aws_secret_access_key=creds.get("SecretAccessKey"),
            aws_session_token=creds.get("SessionToken"),
        )

    selected_regions_raw = regions or _list_regions(session)
    selected_regions: List[str] = []
    seen_regions: set[str] = set()
    for region in selected_regions_raw:
        normalized = str(region).strip()
        if not normalized or normalized in seen_regions:
            continue
        seen_regions.add(normalized)
        selected_regions.append(normalized)

    inventory_regions = []
    warnings: List[str] = []

    s3_buckets = []
    try:
        s3 = session.client("s3")
        s3_response = s3.list_buckets()
        s3_buckets = [bucket.get("Name") for bucket in s3_response.get("Buckets", [])]
    except (BotoCoreError, ClientError) as exc:
        warnings.append(f"S3 list failed: {exc}")

    session_kwargs = _session_kwargs_from_session(session)

    if selected_regions:
        region_results: List[Optional[Dict[str, object]]] = [None] * len(selected_regions)
        max_workers = min(MAX_REGION_SCAN_WORKERS, len(selected_regions))

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(_scan_region, session_kwargs, region, max_resources_per_region): index
                for index, region in enumerate(selected_regions)
            }

            for future in as_completed(futures):
                index = futures[future]
                region_name = selected_regions[index]
                try:
                    region_payload, region_warnings = future.result()
                except Exception as exc:  # defensive catch to preserve scan continuity
                    region_payload = {
                        "region": region_name,
                        "ec2_instances": [],
                        "rds_instances": [],
                    }
                    region_warnings = [f"Region scan failed in {region_name}: {exc}"]

                region_results[index] = region_payload
                warnings.extend(region_warnings)

        inventory_regions = [region for region in region_results if region is not None]

    return {
        "regions_scanned": len(inventory_regions),
        "regions": inventory_regions,
        "s3_buckets": s3_buckets,
        "warnings": warnings,
    }
