from collections import Counter
import importlib
from typing import Any, Dict, List, Optional

from azure.identity import ClientSecretCredential
from azure.mgmt.resource import ResourceManagementClient, SubscriptionClient


MAX_DEEP_FETCH_WARNINGS_PER_SUBSCRIPTION = 20


def _resource_group_from_id(resource_id: str | None) -> str | None:
    if not resource_id:
        return None
    parts = resource_id.split("/")
    if len(parts) > 4 and parts[3].lower() == "resourcegroups":
        return parts[4]
    return None


def _resource_name_from_id(resource_id: str | None) -> str | None:
    if not resource_id:
        return None
    parts = [segment for segment in resource_id.split("/") if segment]
    return parts[-1] if parts else None


def _replication_type_from_sku(sku_name: str | None) -> str | None:
    if not sku_name:
        return None
    value = str(sku_name)
    if "_" not in value:
        return value
    return value.split("_")[-1]


def _select_api_version(api_versions: list[str] | None) -> str | None:
    if not api_versions:
        return None

    stable = [version for version in api_versions if "preview" not in version.lower()]
    if stable:
        return stable[0]
    return api_versions[0]


def _parse_resource_type(resource_type: str | None) -> tuple[str | None, str | None]:
    if not resource_type or "/" not in resource_type:
        return None, None
    namespace, type_path = resource_type.split("/", 1)
    return namespace, type_path


class _ApiVersionResolver:
    def __init__(self, resource_client: ResourceManagementClient):
        self._resource_client = resource_client
        self._type_version_map_by_namespace: dict[str, dict[str, str]] = {}

    def _load_namespace_map(self, namespace: str) -> dict[str, str]:
        ns_key = namespace.lower()
        if ns_key in self._type_version_map_by_namespace:
            return self._type_version_map_by_namespace[ns_key]

        version_map: dict[str, str] = {}
        try:
            provider = self._resource_client.providers.get(namespace)
            for resource_type in provider.resource_types or []:
                if not resource_type.resource_type:
                    continue
                selected_version = _select_api_version(resource_type.api_versions)
                if not selected_version:
                    continue
                version_map[str(resource_type.resource_type).lower()] = selected_version
        except Exception:
            version_map = {}

        self._type_version_map_by_namespace[ns_key] = version_map
        return version_map

    def resolve(self, resource_type: str | None) -> str | None:
        namespace, type_path = _parse_resource_type(resource_type)
        if not namespace or not type_path:
            return None

        version_map = self._load_namespace_map(namespace)
        type_key = type_path.lower()

        if type_key in version_map:
            return version_map[type_key]

        # Child resources may not be listed explicitly; use nearest parent type.
        best_match_key = None
        for candidate in version_map:
            if type_key.startswith(f"{candidate}/"):
                if best_match_key is None or len(candidate) > len(best_match_key):
                    best_match_key = candidate
        if best_match_key:
            return version_map[best_match_key]

        return None


def _safe_as_dict(model: Any) -> Dict[str, Any]:
    if not model:
        return {}
    if isinstance(model, dict):
        return dict(model)
    as_dict = getattr(model, "as_dict", None)
    if callable(as_dict):
        try:
            payload = as_dict()
            if isinstance(payload, dict):
                return payload
        except Exception:
            return {}
    return {}


def _extract_resource_core_attributes(resource: Any, subscription_id: str) -> Dict[str, Any]:
    resource_id = str(resource.id) if getattr(resource, "id", None) else None
    resource_type = str(resource.type) if getattr(resource, "type", None) else None
    return {
        "id": resource_id,
        "name": resource.name,
        "type": resource_type,
        "location": resource.location,
        "resource_group": _resource_group_from_id(resource_id),
        "subscription_id": subscription_id,
        "resource_kind": resource.kind,
        "tags": dict(resource.tags) if getattr(resource, "tags", None) else None,
    }


def _extract_common_fields(full_resource_dict: Dict[str, Any]) -> Dict[str, Any]:
    fields: Dict[str, Any] = {}

    sku = full_resource_dict.get("sku")
    if isinstance(sku, dict):
        fields.update(
            {
                "sku_name": sku.get("name"),
                "sku_tier": sku.get("tier"),
                "sku_size": sku.get("size"),
                "sku_family": sku.get("family"),
                "sku_capacity": sku.get("capacity"),
            }
        )

    identity = full_resource_dict.get("identity")
    if isinstance(identity, dict):
        fields.update(
            {
                "identity_type": identity.get("type"),
                "principal_id": identity.get("principalId"),
                "tenant_id": identity.get("tenantId"),
                "user_assigned_identities": list((identity.get("userAssignedIdentities") or {}).keys()),
            }
        )

    plan = full_resource_dict.get("plan")
    if isinstance(plan, dict):
        fields.update(
            {
                "plan_name": plan.get("name"),
                "plan_product": plan.get("product"),
                "plan_publisher": plan.get("publisher"),
                "plan_version": plan.get("version"),
            }
        )

    properties = full_resource_dict.get("properties")
    if isinstance(properties, dict):
        fields["properties"] = properties
        for key, value in properties.items():
            fields[f"property_{key}"] = value

    fields["zones"] = full_resource_dict.get("zones")
    fields["managed_by"] = full_resource_dict.get("managedBy") or full_resource_dict.get("managed_by")
    fields["extended_location"] = full_resource_dict.get("extendedLocation") or full_resource_dict.get("extended_location")
    fields["kind"] = full_resource_dict.get("kind")

    return {key: value for key, value in fields.items() if value is not None}


def _build_resource_attributes(
    resource_client: ResourceManagementClient,
    resolver: _ApiVersionResolver,
    storage_client,
    resource: Any,
    subscription_id: str,
) -> tuple[Dict[str, Any], str | None]:
    resource_attributes = _extract_resource_core_attributes(resource, subscription_id)
    resource_id = resource_attributes.get("id")
    resource_type = resource_attributes.get("type")

    deep_warning = None
    api_version = resolver.resolve(resource_type)
    if api_version and resource_id:
        try:
            full_resource = resource_client.resources.get_by_id(resource_id, api_version)
            full_resource_dict = _safe_as_dict(full_resource)
            resource_attributes["api_version"] = api_version
            resource_attributes.update(_extract_common_fields(full_resource_dict))
        except Exception as exc:
            deep_warning = f"Deep fetch failed for {resource_id}: {exc}"

    if resource_type and str(resource_type).lower() == "microsoft.storage/storageaccounts":
        resource_attributes.update(_storage_account_attributes(storage_client, resource_id))

    return resource_attributes, deep_warning


def _storage_account_attributes(
    storage_client,
    resource_id: str | None,
) -> Dict[str, object]:
    if not storage_client:
        return {}

    resource_group = _resource_group_from_id(resource_id)
    account_name = _resource_name_from_id(resource_id)
    if not resource_group or not account_name:
        return {}

    try:
        account = storage_client.storage_accounts.get_properties(resource_group, account_name)
    except Exception:
        return {}

    sku_name = str(account.sku.name) if getattr(account, "sku", None) and account.sku.name else None
    sku_tier = str(account.sku.tier) if getattr(account, "sku", None) and account.sku.tier else None

    return {
        "resource_kind": account.kind,
        "storage_sku_name": sku_name,
        "storage_sku_tier": sku_tier,
        "replication_type": _replication_type_from_sku(sku_name),
        "access_tier": account.access_tier,
        "https_only": account.enable_https_traffic_only,
        "public_network_access": account.public_network_access,
        "allow_blob_public_access": account.allow_blob_public_access,
        "is_hns_enabled": account.is_hns_enabled,
        "minimum_tls_version": account.minimum_tls_version,
        "primary_location": account.primary_location,
        "secondary_location": account.secondary_location,
        "status_of_primary": account.status_of_primary,
        "status_of_secondary": account.status_of_secondary,
    }


def _build_storage_client(credential: ClientSecretCredential, subscription_id: str):
    try:
        module = importlib.import_module("azure.mgmt.storage")
        client_cls = getattr(module, "StorageManagementClient", None)
        if client_cls is None:
            return None
        return client_cls(credential, subscription_id)
    except Exception:
        return None


def discover_azure_resources(
    tenant_id: str,
    client_id: str,
    client_secret: str,
    subscription_ids: Optional[List[str]] = None,
    max_resources_per_subscription: int = 2000,
) -> Dict[str, object]:
    allowed_subscriptions = set(subscription_ids or [])
    credential = ClientSecretCredential(
        tenant_id=tenant_id,
        client_id=client_id,
        client_secret=client_secret,
    )

    subscriptions_client = SubscriptionClient(credential)
    subscriptions = list(subscriptions_client.subscriptions.list())
    if allowed_subscriptions:
        subscriptions = [s for s in subscriptions if s.subscription_id in allowed_subscriptions]

    result_subscriptions = []
    warnings = []

    for subscription in subscriptions:
        subscription_id = str(subscription.subscription_id)
        subscription_name = str(subscription.display_name)
        type_counter: Counter[str] = Counter()
        sample_resources = []
        scanned_count = 0
        deep_fetch_warning_count = 0

        try:
            resource_client = ResourceManagementClient(credential, subscription_id)
            api_version_resolver = _ApiVersionResolver(resource_client)
            storage_client = _build_storage_client(credential, subscription_id)
            for resource in resource_client.resources.list():
                scanned_count += 1
                if resource.type:
                    type_counter[str(resource.type)] += 1

                resource_attributes, deep_warning = _build_resource_attributes(
                    resource_client,
                    api_version_resolver,
                    storage_client,
                    resource,
                    subscription_id,
                )
                sample_resources.append(resource_attributes)

                if deep_warning:
                    deep_fetch_warning_count += 1
                    if deep_fetch_warning_count <= MAX_DEEP_FETCH_WARNINGS_PER_SUBSCRIPTION:
                        warnings.append(deep_warning)

                if scanned_count >= max_resources_per_subscription:
                    break

            result_subscriptions.append(
                {
                    "subscription_id": subscription_id,
                    "subscription_name": subscription_name,
                    "scanned_resources": scanned_count,
                    "deep_fetch_warning_count": deep_fetch_warning_count,
                    "resource_types": [{"type": kind, "count": count} for kind, count in type_counter.most_common()],
                    "sample_resources": sample_resources,
                }
            )
        except Exception as exc:
            warnings.append(f"Failed subscription {subscription_id}: {exc}")

    return {
        "subscriptions_scanned": len(result_subscriptions),
        "subscriptions": result_subscriptions,
        "warnings": warnings,
    }
