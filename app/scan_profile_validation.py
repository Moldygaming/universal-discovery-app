from typing import Any

from app.secrets.provider import is_secret_ref


class ScanProfileValidationError(ValueError):
    pass


_REQUIRED_FIELDS_BY_SCAN_TYPE: dict[str, tuple[str, ...]] = {
    "icmp": ("target",),
    "snmp": ("target",),
    "azure": (),
    "aws": ("access_key_id",),
    "gcp": (),
}

# Fields in these keys should not be embedded inline for profile storage.
_SENSITIVE_FIELDS_BY_SCAN_TYPE: dict[str, tuple[str, ...]] = {
    "snmp": ("community",),
    "azure": ("client_secret",),
    "aws": ("secret_access_key", "session_token"),
    "gcp": ("service_account_json",),
}


def _is_blank(value: Any) -> bool:
    return value is None or (isinstance(value, str) and not value.strip())


def validate_scan_profile_config(scan_type: str, config: dict[str, Any]) -> None:
    if scan_type == "azure":
        tenant_config_id = config.get("tenant_config_id")
        if tenant_config_id is None:
            for key in ("tenant_id", "client_id"):
                if _is_blank(config.get(key)):
                    raise ScanProfileValidationError(f"Missing required config field for azure: {key}")

    if scan_type == "aws":
        aws_account_id = config.get("aws_account_id")
        if aws_account_id is None and _is_blank(config.get("access_key_id")):
            raise ScanProfileValidationError("Missing required config field for aws: access_key_id or aws_account_id")

    if scan_type == "gcp":
        gcp_account_id = config.get("gcp_account_id")
        if gcp_account_id is None:
            if _is_blank(config.get("service_account_json")):
                raise ScanProfileValidationError(
                    "Missing required config field for gcp: service_account_json or gcp_account_id"
                )
            project_ids = config.get("project_ids")
            if not isinstance(project_ids, list) or not [item for item in project_ids if str(item).strip()]:
                raise ScanProfileValidationError(
                    "Missing required config field for gcp: project_ids when gcp_account_id is not provided"
                )

    required = _REQUIRED_FIELDS_BY_SCAN_TYPE.get(scan_type, ())
    for key in required:
        if scan_type == "aws" and key == "access_key_id" and config.get("aws_account_id") is not None:
            continue
        if _is_blank(config.get(key)):
            raise ScanProfileValidationError(f"Missing required config field for {scan_type}: {key}")

    sensitive_fields = _SENSITIVE_FIELDS_BY_SCAN_TYPE.get(scan_type, ())
    for key in sensitive_fields:
        if key not in config:
            continue
        value = config.get(key)
        if _is_blank(value):
            continue
        if is_secret_ref(value):
            continue

        raise ScanProfileValidationError(
            f"Field '{key}' for scan type '{scan_type}' must use a secret reference ($secret) "
            "instead of embedding secret values."
        )
