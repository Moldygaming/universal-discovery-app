from typing import Any

from app.secrets.provider import is_secret_ref


class ScanProfileValidationError(ValueError):
    pass


_REQUIRED_FIELDS_BY_SCAN_TYPE: dict[str, tuple[str, ...]] = {
    "icmp": ("target",),
    "snmp": ("target",),
    "azure": ("tenant_id", "client_id"),
    "aws": ("access_key_id",),
}

# Fields in these keys should not be embedded inline for profile storage.
_SENSITIVE_FIELDS_BY_SCAN_TYPE: dict[str, tuple[str, ...]] = {
    "snmp": ("community",),
    "azure": ("client_secret",),
    "aws": ("secret_access_key", "session_token"),
}


def _is_blank(value: Any) -> bool:
    return value is None or (isinstance(value, str) and not value.strip())


def validate_scan_profile_config(scan_type: str, config: dict[str, Any]) -> None:
    required = _REQUIRED_FIELDS_BY_SCAN_TYPE.get(scan_type, ())
    for key in required:
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
