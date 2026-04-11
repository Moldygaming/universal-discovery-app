import asyncio
import json
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.db_models import AwsAccountConfig, AzureTenantConfig, InventoryItem, ScanProfile, ScanRun
from app.secrets.provider import is_secret_ref, resolve_secrets
from app.services.aws_inventory import discover_aws_resources
from app.services.azure_inventory import discover_azure_resources
from app.services.icmp_scan import scan_icmp
from app.services.snmp_scan import scan_snmp

SENSITIVE_KEYS = {"password", "secret", "token", "key", "client_secret", "access_key_id", "secret_access_key"}


def _json_load(raw: str | None) -> dict[str, Any]:
    if not raw:
        return {}
    return json.loads(raw)


def _json_dump(data: Any) -> str:
    return json.dumps(data, default=str)


def mask_sensitive_config(config: dict[str, Any]) -> dict[str, Any]:
    def _mask(key: str, value: Any) -> Any:
        if is_secret_ref(value):
            return value
        if isinstance(value, dict):
            return {nested_key: _mask(nested_key, nested_value) for nested_key, nested_value in value.items()}
        if isinstance(value, list):
            return [_mask(key, item) for item in value]
        if any(token in key.lower() for token in SENSITIVE_KEYS):
            return "***"
        return value

    return {key: _mask(key, value) for key, value in config.items()}


async def run_profile_scan(db: Session, profile: ScanProfile) -> tuple[dict[str, Any], dict[str, Any]]:
    cfg = resolve_secrets(_json_load(profile.config_json))
    scan_type = profile.scan_type

    if scan_type == "icmp":
        results = await scan_icmp(
            target=cfg["target"],
            timeout_seconds=float(cfg.get("timeout_seconds", 1.0)),
            concurrency=int(cfg.get("concurrency", 100)),
            max_hosts=int(cfg.get("max_hosts", 1024)),
        )
        alive = sum(1 for item in results if item.get("alive"))
        summary = {"scan_type": "icmp", "targets": len(results), "alive": alive, "down": len(results) - alive}
        return summary, {"results": results}

    if scan_type == "snmp":
        results = await scan_snmp(
            target=cfg["target"],
            community=cfg.get("community", "public"),
            version=cfg.get("version", "2c"),
            oid=cfg.get("oid", "1.3.6.1.2.1.1.1.0"),
            port=int(cfg.get("port", 161)),
            timeout_seconds=float(cfg.get("timeout_seconds", 1.0)),
            concurrency=int(cfg.get("concurrency", 100)),
            max_hosts=int(cfg.get("max_hosts", 1024)),
        )
        reachable = sum(1 for item in results if item.get("reachable"))
        summary = {
            "scan_type": "snmp",
            "targets": len(results),
            "reachable": reachable,
            "unreachable": len(results) - reachable,
        }
        return summary, {"results": results}

    if scan_type == "azure":
        tenant_id = cfg.get("tenant_id")
        client_id = cfg.get("client_id")
        client_secret = cfg.get("client_secret")
        subscription_ids = cfg.get("subscription_ids")

        tenant_config_id = cfg.get("tenant_config_id")
        if tenant_config_id is not None:
            tenant_config = db.query(AzureTenantConfig).filter(AzureTenantConfig.id == int(tenant_config_id)).first()
            if not tenant_config or not tenant_config.is_active:
                raise ValueError(f"Azure tenant config not found or inactive: {tenant_config_id}")
            secret_reference = _json_load(tenant_config.client_secret_ref.reference_json)
            resolved_secret = resolve_secrets(secret_reference)
            tenant_id = tenant_config.tenant_id
            client_id = tenant_config.client_id
            client_secret = str(resolved_secret)
            subscription_ids = _json_load(tenant_config.subscription_ids_json) if tenant_config.subscription_ids_json else None

        if not tenant_id or not client_id or not client_secret:
            raise ValueError("Azure scan requires tenant_id, client_id, and client_secret or tenant_config_id")

        result = await asyncio.to_thread(
            discover_azure_resources,
            str(tenant_id),
            str(client_id),
            str(client_secret),
            subscription_ids,
            int(cfg.get("max_resources_per_subscription", 2000)),
        )
        summary = {
            "scan_type": "azure",
            "subscriptions_scanned": result.get("subscriptions_scanned", 0),
            "warnings": len(result.get("warnings", [])),
        }
        return summary, result

    if scan_type == "aws":
        access_key_id = cfg.get("access_key_id")
        secret_access_key = cfg.get("secret_access_key")
        session_token = cfg.get("session_token")
        regions = cfg.get("regions")

        aws_account_id = cfg.get("aws_account_id")
        if aws_account_id is not None:
            aws_account = db.query(AwsAccountConfig).filter(AwsAccountConfig.id == int(aws_account_id)).first()
            if not aws_account or not aws_account.is_active:
                raise ValueError(f"AWS account config not found or inactive: {aws_account_id}")

            access_key_id = str(resolve_secrets(_json_load(aws_account.access_key_ref.reference_json)))
            secret_access_key = str(resolve_secrets(_json_load(aws_account.secret_access_key_ref.reference_json)))

            if aws_account.session_token_ref_id and aws_account.session_token_ref is not None:
                session_token = str(resolve_secrets(_json_load(aws_account.session_token_ref.reference_json)))

            regions = _json_load(aws_account.regions_json) if aws_account.regions_json else None

        if not access_key_id or not secret_access_key:
            raise ValueError("AWS scan requires access_key_id and secret_access_key or aws_account_id")

        result = await asyncio.to_thread(
            discover_aws_resources,
            str(access_key_id),
            str(secret_access_key),
            str(session_token) if session_token else None,
            regions,
            int(cfg.get("max_resources_per_region", 2000)),
        )
        summary = {
            "scan_type": "aws",
            "regions_scanned": result.get("regions_scanned", 0),
            "warnings": len(result.get("warnings", [])),
        }
        return summary, result

    raise ValueError(f"Unsupported scan_type: {scan_type}")


def _inventory_items_from_scan(scan_type: str, result: dict[str, Any]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []

    if scan_type == "icmp":
        for host in result.get("results", []):
            if not host.get("alive"):
                continue
            ip = str(host.get("ip"))
            items.append(
                {
                    "provider": "network",
                    "item_key": f"host:{ip}",
                    "item_type": "network.host",
                    "name": ip,
                    "region": None,
                    "parent_key": None,
                    "attributes": host,
                }
            )

    elif scan_type == "snmp":
        for host in result.get("results", []):
            if not host.get("reachable"):
                continue
            ip = str(host.get("ip"))
            items.append(
                {
                    "provider": "network",
                    "item_key": f"snmp:{ip}",
                    "item_type": "network.snmp_device",
                    "name": ip,
                    "region": None,
                    "parent_key": None,
                    "attributes": host,
                }
            )

    elif scan_type == "azure":
        for subscription in result.get("subscriptions", []):
            sub_id = subscription.get("subscription_id")
            for resource in subscription.get("sample_resources", []):
                rg = resource.get("resource_group")
                items.append(
                    {
                        "provider": "azure",
                        "item_key": resource.get("id") or f"azure:{resource.get('name')}",
                        "item_type": resource.get("type") or "azure.unknown",
                        "name": resource.get("name") or "unknown",
                        "region": resource.get("location"),
                        "parent_key": f"azure-rg:{sub_id}:{rg}" if rg else None,
                        "attributes": resource,
                    }
                )

    elif scan_type == "aws":
        for bucket_name in result.get("s3_buckets", []):
            items.append(
                {
                    "provider": "aws",
                    "item_key": f"s3:{bucket_name}",
                    "item_type": "aws.s3.bucket",
                    "name": bucket_name,
                    "region": None,
                    "parent_key": None,
                    "attributes": {"name": bucket_name},
                }
            )

        for region_data in result.get("regions", []):
            region = region_data.get("region")
            for ec2 in region_data.get("ec2_instances", []):
                instance_id = ec2.get("instance_id") or "unknown"
                items.append(
                    {
                        "provider": "aws",
                        "item_key": f"ec2:{instance_id}",
                        "item_type": "aws.ec2.instance",
                        "name": instance_id,
                        "region": region,
                        "parent_key": f"vpc:{ec2.get('vpc_id')}" if ec2.get("vpc_id") else None,
                        "attributes": ec2,
                    }
                )
            for rds in region_data.get("rds_instances", []):
                db_id = rds.get("db_instance_identifier") or "unknown"
                items.append(
                    {
                        "provider": "aws",
                        "item_key": f"rds:{db_id}",
                        "item_type": "aws.rds.instance",
                        "name": db_id,
                        "region": region,
                        "parent_key": None,
                        "attributes": rds,
                    }
                )

    return items


async def execute_and_persist_scan(db: Session, profile: ScanProfile, triggered_by: str | None = None) -> ScanRun:
    run = ScanRun(profile_id=profile.id, status="running", triggered_by=triggered_by)
    db.add(run)
    db.commit()
    db.refresh(run)

    try:
        summary, result = await run_profile_scan(db, profile)

        run.status = "completed"
        run.summary_json = _json_dump(summary)
        run.result_json = _json_dump(result)
        run.finished_at = datetime.utcnow()
        profile.last_run_at = datetime.utcnow()

        for item in _inventory_items_from_scan(profile.scan_type, result):
            db.add(
                InventoryItem(
                    run_id=run.id,
                    provider=item["provider"],
                    item_key=item["item_key"],
                    item_type=item["item_type"],
                    name=item["name"],
                    region=item.get("region"),
                    parent_key=item.get("parent_key"),
                    attributes_json=_json_dump(item["attributes"]),
                )
            )

        db.commit()
        db.refresh(run)
        return run
    except Exception as exc:
        run.status = "failed"
        run.error_message = str(exc)
        run.finished_at = datetime.utcnow()
        db.commit()
        db.refresh(run)
        raise
