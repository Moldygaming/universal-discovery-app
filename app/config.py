import os
from dataclasses import dataclass
from pathlib import Path


def _as_bool(raw: str, default: bool = False) -> bool:
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("UDA_APP_NAME", "Universal Discovery Server")
    jwt_secret: str = os.getenv("UDA_JWT_SECRET", "change-me-in-production")
    jwt_algorithm: str = "HS256"
    jwt_expiry_minutes: int = int(os.getenv("UDA_JWT_EXP_MIN", "120"))
    db_url: str = os.getenv("UDA_DB_URL", "sqlite:///./data/discovery.db")
    bootstrap_admin_username: str = os.getenv("UDA_BOOTSTRAP_ADMIN", "admin")
    default_admin_password: str = os.getenv("UDA_DEFAULT_ADMIN_PASSWORD", "Admin123£")
    local_secret_encryption_key: str = os.getenv("UDA_LOCAL_SECRET_ENCRYPTION_KEY", "")

    entra_enabled: bool = _as_bool(os.getenv("ENTRA_ENABLED", "false"))
    entra_tenant_id: str = os.getenv("ENTRA_TENANT_ID", "")
    entra_client_id: str = os.getenv("ENTRA_CLIENT_ID", "")
    entra_client_secret: str = os.getenv("ENTRA_CLIENT_SECRET", "")
    entra_redirect_uri: str = os.getenv("ENTRA_REDIRECT_URI", "")
    entra_admin_emails: tuple[str, ...] = tuple(
        email.strip().lower() for email in os.getenv("ENTRA_ADMIN_EMAILS", "").split(",") if email.strip()
    )


settings = Settings()


def ensure_data_paths() -> None:
    if settings.db_url.startswith("sqlite:///"):
        relative_path = settings.db_url.replace("sqlite:///", "", 1)
        db_path = Path(relative_path)
        db_path.parent.mkdir(parents=True, exist_ok=True)
