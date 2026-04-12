import importlib
import json
from typing import Any

import httpx


GCP_CLOUD_PLATFORM_READ_SCOPE = "https://www.googleapis.com/auth/cloud-platform.read-only"


def _to_project_id_list(raw_project_ids: list[str] | None) -> list[str]:
    if not raw_project_ids:
        return []
    return [project_id.strip() for project_id in raw_project_ids if str(project_id).strip()]


def _build_access_token(service_account_json: str) -> str:
    credentials_info = json.loads(service_account_json)
    google_requests = importlib.import_module("google.auth.transport.requests")
    request_cls = getattr(google_requests, "Request")
    google_service_account = importlib.import_module("google.oauth2.service_account")
    credentials_cls = getattr(google_service_account, "Credentials")

    credentials = credentials_cls.from_service_account_info(
        credentials_info,
        scopes=[GCP_CLOUD_PLATFORM_READ_SCOPE],
    )
    credentials.refresh(request_cls())
    if not credentials.token:
        raise RuntimeError("GCP access token acquisition returned an empty token")
    return credentials.token


def _authorized_get(client: httpx.Client, token: str, url: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    response = client.get(
        url,
        headers={"Authorization": f"Bearer {token}"},
        params=params,
    )
    response.raise_for_status()
    return response.json()


def _list_accessible_projects(client: httpx.Client, token: str) -> list[str]:
    project_ids: list[str] = []
    page_token: str | None = None

    while True:
        payload = _authorized_get(
            client,
            token,
            "https://cloudresourcemanager.googleapis.com/v1/projects",
            {
                "pageSize": 200,
                **({"pageToken": page_token} if page_token else {}),
            },
        )
        for project in payload.get("projects", []):
            if str(project.get("lifecycleState") or "").upper() != "ACTIVE":
                continue
            project_id = str(project.get("projectId") or "").strip()
            if project_id:
                project_ids.append(project_id)

        page_token = payload.get("nextPageToken")
        if not page_token:
            break

    return project_ids


def _list_compute_instances(client: httpx.Client, token: str, project_id: str, limit: int) -> list[dict[str, Any]]:
    instances: list[dict[str, Any]] = []
    page_token: str | None = None

    while len(instances) < limit:
        payload = _authorized_get(
            client,
            token,
            f"https://compute.googleapis.com/compute/v1/projects/{project_id}/aggregated/instances",
            {
                "maxResults": min(500, max(1, limit - len(instances))),
                **({"pageToken": page_token} if page_token else {}),
            },
        )

        items = payload.get("items") if isinstance(payload.get("items"), dict) else {}
        for zone_data in items.values():
            zone_instances = zone_data.get("instances") if isinstance(zone_data, dict) else None
            if not isinstance(zone_instances, list):
                continue

            for instance in zone_instances:
                if not isinstance(instance, dict):
                    continue
                instances.append(
                    {
                        "instance_id": instance.get("id"),
                        "name": instance.get("name"),
                        "machine_type": instance.get("machineType"),
                        "status": instance.get("status"),
                        "zone": instance.get("zone"),
                        "self_link": instance.get("selfLink"),
                        "network_interfaces": instance.get("networkInterfaces"),
                    }
                )
                if len(instances) >= limit:
                    break
            if len(instances) >= limit:
                break

        if len(instances) >= limit:
            break

        page_token = payload.get("nextPageToken")
        if not page_token:
            break

    return instances


def _list_cloud_sql_instances(client: httpx.Client, token: str, project_id: str, limit: int) -> list[dict[str, Any]]:
    payload = _authorized_get(
        client,
        token,
        f"https://sqladmin.googleapis.com/sql/v1beta4/projects/{project_id}/instances",
    )

    items = payload.get("items") if isinstance(payload.get("items"), list) else []
    instances: list[dict[str, Any]] = []
    for instance in items:
        if not isinstance(instance, dict):
            continue
        instances.append(
            {
                "name": instance.get("name"),
                "database_version": instance.get("databaseVersion"),
                "region": instance.get("region"),
                "state": instance.get("state"),
                "tier": (instance.get("settings") or {}).get("tier") if isinstance(instance.get("settings"), dict) else None,
                "self_link": instance.get("selfLink"),
            }
        )
        if len(instances) >= limit:
            break

    return instances


def _list_storage_buckets(client: httpx.Client, token: str, project_id: str, limit: int) -> list[dict[str, Any]]:
    buckets: list[dict[str, Any]] = []
    page_token: str | None = None

    while len(buckets) < limit:
        payload = _authorized_get(
            client,
            token,
            "https://storage.googleapis.com/storage/v1/b",
            {
                "project": project_id,
                "maxResults": min(500, max(1, limit - len(buckets))),
                **({"pageToken": page_token} if page_token else {}),
            },
        )

        items = payload.get("items") if isinstance(payload.get("items"), list) else []
        for bucket in items:
            if not isinstance(bucket, dict):
                continue
            buckets.append(
                {
                    "id": bucket.get("id"),
                    "name": bucket.get("name"),
                    "location": bucket.get("location"),
                    "storage_class": bucket.get("storageClass"),
                    "time_created": bucket.get("timeCreated"),
                    "updated": bucket.get("updated"),
                }
            )
            if len(buckets) >= limit:
                break

        if len(buckets) >= limit:
            break

        page_token = payload.get("nextPageToken")
        if not page_token:
            break

    return buckets


def discover_gcp_resources(
    service_account_json: str,
    project_ids: list[str] | None = None,
    max_resources_per_project: int = 2000,
) -> dict[str, object]:
    token = _build_access_token(service_account_json)
    selected_project_ids = _to_project_id_list(project_ids)

    warnings: list[str] = []
    projects: list[dict[str, Any]] = []

    with httpx.Client(timeout=45.0) as client:
        if not selected_project_ids:
            try:
                selected_project_ids = _list_accessible_projects(client, token)
            except Exception as exc:
                raise RuntimeError(f"Failed to enumerate accessible GCP projects: {exc}") from exc

        for project_id in selected_project_ids:
            compute_instances: list[dict[str, Any]] = []
            cloud_sql_instances: list[dict[str, Any]] = []
            storage_buckets: list[dict[str, Any]] = []

            per_category_limit = max(1, int(max_resources_per_project))

            try:
                compute_instances = _list_compute_instances(client, token, project_id, per_category_limit)
            except Exception as exc:
                warnings.append(f"Compute list failed in {project_id}: {exc}")

            try:
                cloud_sql_instances = _list_cloud_sql_instances(client, token, project_id, per_category_limit)
            except Exception as exc:
                warnings.append(f"Cloud SQL list failed in {project_id}: {exc}")

            try:
                storage_buckets = _list_storage_buckets(client, token, project_id, per_category_limit)
            except Exception as exc:
                warnings.append(f"Storage buckets list failed in {project_id}: {exc}")

            projects.append(
                {
                    "project_id": project_id,
                    "compute_instances": compute_instances,
                    "cloud_sql_instances": cloud_sql_instances,
                    "storage_buckets": storage_buckets,
                    "scanned_resources": len(compute_instances) + len(cloud_sql_instances) + len(storage_buckets),
                }
            )

    return {
        "projects_scanned": len(projects),
        "projects": projects,
        "warnings": warnings,
    }
