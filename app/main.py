import json
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
import time
from typing import Any
from urllib.parse import quote_plus

from authlib.integrations.starlette_client import OAuth
from fastapi import Depends, FastAPI, HTTPException, Query, Request, status
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from sqlalchemy import desc
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware

from app.api_models import (
    AwsAccountCreateRequest,
    AwsAccountOut,
    AwsAccountUpdateRequest,
    GcpAccountCreateRequest,
    GcpAccountOut,
    GcpAccountUpdateRequest,
    AzureTenantCreateProfileRequest,
    AzureTenantCreateRequest,
    AzureTenantOut,
    AzureTenantUpdateRequest,
    BootstrapAdminRequest,
    ChangePasswordRequest,
    InventoryItemOut,
    LoginRequest,
    ScanProfileCreateRequest,
    ScanProfileOut,
    ScanProfileUpdateRequest,
    ScanRunOut,
    ServiceModelCreateRequest,
    ServiceModelDependencyCreateRequest,
    ServiceModelOut,
    ServiceModelResourceAttachRequest,
    ServiceModelResourceOut,
    ServiceModelDependencyOut,
    ServiceModelUpdateRequest,
    SsoConfigOut,
    SsoConfigUpdateRequest,
    SecretReferenceCreateRequest,
    SecretReferenceOut,
    SecretReferenceUpdateRequest,
    UserCreateRequest,
    UserOut,
)
from app.config import settings
from app.database import Base, SessionLocal, apply_runtime_schema_patches, engine, get_db_session
from app.db_models import AwsAccountConfig, AzureTenantConfig, GcpAccountConfig, InventoryItem, ScanProfile, ScanRun, SecretReference, ServiceModel, ServiceModelDependency, ServiceModelResource, SsoConfig, User
from app.discovery_runtime import execute_and_persist_scan, mask_sensitive_config
from app.scan_profile_validation import ScanProfileValidationError, validate_scan_profile_config
from app.scheduler_runtime import discovery_scheduler
from app.secrets.provider import SecretResolutionError, validate_secret_reference
from app.secrets.provider import build_local_encrypted_secret_reference, resolve_secrets
from app.security import AuthError, create_access_token, hash_password, verify_password, decode_access_token

Base.metadata.create_all(bind=engine)
apply_runtime_schema_patches()

security = HTTPBearer(auto_error=False)
INTERNAL_AZURE_SECRET_REF_PREFIX = "__internal_azure_"
INTERNAL_AWS_SECRET_REF_PREFIX = "__internal_aws_"
INTERNAL_AWS_INLINE_SECRET_REF_PREFIX = "__internal_aws_inline_"
INTERNAL_GCP_SECRET_REF_PREFIX = "__internal_gcp_"
INTERNAL_SSO_SECRET_REF_PREFIX = "__internal_sso_"


def _to_json(raw: str | None):
    if not raw:
        return {}
    return json.loads(raw)


def _user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        provider=user.provider,
        is_active=user.is_active,
        must_change_password=user.must_change_password,
    )


def _profile_out(profile: ScanProfile) -> ScanProfileOut:
    return ScanProfileOut(
        id=profile.id,
        name=profile.name,
        scan_type=profile.scan_type,
        schedule_minutes=profile.schedule_minutes,
        is_enabled=profile.is_enabled,
        config=mask_sensitive_config(_to_json(profile.config_json)),
        last_run_at=profile.last_run_at,
    )


def _run_out(run: ScanRun) -> ScanRunOut:
    profile_name = run.profile.name if run.profile else "unknown"
    return ScanRunOut(
        id=run.id,
        profile_id=run.profile_id,
        profile_name=profile_name,
        status=run.status,
        triggered_by=run.triggered_by,
        started_at=run.started_at,
        finished_at=run.finished_at,
        summary=_to_json(run.summary_json),
        error_message=run.error_message,
    )


def _inventory_out(item: InventoryItem) -> InventoryItemOut:
    return InventoryItemOut(
        id=item.id,
        run_id=item.run_id,
        provider=item.provider,
        item_key=item.item_key,
        item_type=item.item_type,
        name=item.name,
        region=item.region,
        parent_key=item.parent_key,
        attributes=_to_json(item.attributes_json),
        discovered_at=item.discovered_at,
    )


def _service_model_resource_out(resource: ServiceModelResource) -> ServiceModelResourceOut:
    return ServiceModelResourceOut(
        id=resource.id,
        inventory_item_key=resource.inventory_item_key,
        provider=resource.provider,
        item_type=resource.item_type,
        name=resource.name,
        region=resource.region,
        created_at=resource.created_at,
    )


def _service_model_dependency_out(
    dependency: ServiceModelDependency,
    depends_on_service_name: str,
) -> ServiceModelDependencyOut:
    return ServiceModelDependencyOut(
        id=dependency.id,
        depends_on_service_id=dependency.depends_on_service_id,
        depends_on_service_name=depends_on_service_name,
        relation=dependency.relation,
        created_at=dependency.created_at,
    )


def _service_model_out(service: ServiceModel, db: Session) -> ServiceModelOut:
    resources = (
        db.query(ServiceModelResource)
        .filter(ServiceModelResource.service_id == service.id)
        .order_by(ServiceModelResource.name.asc(), ServiceModelResource.id.asc())
        .all()
    )
    dependencies = (
        db.query(ServiceModelDependency)
        .filter(ServiceModelDependency.service_id == service.id)
        .order_by(ServiceModelDependency.created_at.asc(), ServiceModelDependency.id.asc())
        .all()
    )
    depends_on_ids = sorted({dependency.depends_on_service_id for dependency in dependencies})
    depends_on_names = {
        row.id: row.name
        for row in db.query(ServiceModel.id, ServiceModel.name).filter(ServiceModel.id.in_(depends_on_ids)).all()
    }

    resource_items = [_service_model_resource_out(resource) for resource in resources]
    dependency_items = [
        _service_model_dependency_out(
            dependency,
            depends_on_service_name=depends_on_names.get(dependency.depends_on_service_id, f"service:{dependency.depends_on_service_id}"),
        )
        for dependency in dependencies
    ]

    return ServiceModelOut(
        id=service.id,
        name=service.name,
        description=service.description,
        is_active=service.is_active,
        created_by_user_id=service.created_by_user_id,
        created_at=service.created_at,
        updated_at=service.updated_at,
        resource_count=len(resource_items),
        dependency_count=len(dependency_items),
        resources=resource_items,
        dependencies=dependency_items,
    )


def _secret_reference_out(secret_ref: SecretReference) -> SecretReferenceOut:
    return SecretReferenceOut(
        id=secret_ref.id,
        name=secret_ref.name,
        provider=secret_ref.provider,
        reference=_to_json(secret_ref.reference_json),
    )


def _azure_tenant_out(tenant: AzureTenantConfig) -> AzureTenantOut:
    subscriptions = _to_json(tenant.subscription_ids_json) if tenant.subscription_ids_json else None
    if subscriptions is not None and not isinstance(subscriptions, list):
        subscriptions = None

    secret_ref_name = tenant.client_secret_ref.name if tenant.client_secret_ref else None
    secret_source = "reference"
    if secret_ref_name and secret_ref_name.startswith(INTERNAL_AZURE_SECRET_REF_PREFIX):
        secret_ref_name = "Stored Encrypted (local)"
        secret_source = "encrypted"

    return AzureTenantOut(
        id=tenant.id,
        name=tenant.name,
        tenant_id=tenant.tenant_id,
        client_id=tenant.client_id,
        client_secret_ref_id=tenant.client_secret_ref_id,
        client_secret_ref_name=secret_ref_name,
        client_secret_source=secret_source,
        subscription_ids=subscriptions,
        is_active=tenant.is_active,
    )


def _is_internal_azure_secret_ref(secret_ref: SecretReference | None) -> bool:
    return bool(secret_ref and secret_ref.name.startswith(INTERNAL_AZURE_SECRET_REF_PREFIX))


def _is_internal_aws_secret_ref(secret_ref: SecretReference | None) -> bool:
    return bool(secret_ref and secret_ref.name.startswith(INTERNAL_AWS_SECRET_REF_PREFIX))


def _is_internal_aws_inline_secret_ref(secret_ref: SecretReference | None) -> bool:
    return bool(secret_ref and secret_ref.name.startswith(INTERNAL_AWS_INLINE_SECRET_REF_PREFIX))


def _is_internal_gcp_secret_ref(secret_ref: SecretReference | None) -> bool:
    return bool(secret_ref and secret_ref.name.startswith(INTERNAL_GCP_SECRET_REF_PREFIX))


def _is_internal_sso_secret_ref(secret_ref: SecretReference | None) -> bool:
    return bool(secret_ref and secret_ref.name.startswith(INTERNAL_SSO_SECRET_REF_PREFIX))


def _is_internal_secret_ref(secret_ref: SecretReference | None) -> bool:
    return (
        _is_internal_azure_secret_ref(secret_ref)
        or _is_internal_aws_secret_ref(secret_ref)
        or _is_internal_gcp_secret_ref(secret_ref)
        or _is_internal_sso_secret_ref(secret_ref)
    )


def _create_internal_azure_secret_ref(db: Session, tenant_name: str, client_secret: str) -> SecretReference:
    name = f"{INTERNAL_AZURE_SECRET_REF_PREFIX}{tenant_name}-{int(time.time() * 1000)}"
    reference = build_local_encrypted_secret_reference(client_secret)
    parsed = validate_secret_reference(reference)

    secret_ref = SecretReference(
        name=name,
        provider=parsed.provider,
        reference_json=json.dumps(reference),
    )
    db.add(secret_ref)
    db.flush()
    return secret_ref


def _cleanup_orphaned_internal_azure_secret_ref(db: Session, secret_ref_id: int | None) -> None:
    if not secret_ref_id:
        return

    secret_ref = db.query(SecretReference).filter(SecretReference.id == secret_ref_id).first()
    if not _is_internal_azure_secret_ref(secret_ref):
        return

    still_used = db.query(AzureTenantConfig).filter(AzureTenantConfig.client_secret_ref_id == secret_ref_id).first()
    if still_used is not None:
        return

    db.delete(secret_ref)


def _get_or_create_internal_aws_env_secret_ref(db: Session, env_key: str) -> SecretReference:
    name = f"{INTERNAL_AWS_SECRET_REF_PREFIX}{env_key.lower()}"
    existing = db.query(SecretReference).filter(SecretReference.name == name).first()
    if existing:
        return existing

    reference = {
        "$secret": {
            "provider": "env",
            "key": env_key,
        }
    }
    parsed = validate_secret_reference(reference)
    secret_ref = SecretReference(
        name=name,
        provider=parsed.provider,
        reference_json=json.dumps(reference),
    )
    db.add(secret_ref)
    db.flush()
    return secret_ref


def _ensure_internal_aws_source_secret_refs(db: Session) -> tuple[SecretReference, SecretReference]:
    access_ref = _get_or_create_internal_aws_env_secret_ref(db, "AWS_ACCESS_KEY_ID")
    secret_ref = _get_or_create_internal_aws_env_secret_ref(db, "AWS_SECRET_ACCESS_KEY")
    return access_ref, secret_ref


def _create_internal_aws_inline_secret_ref(db: Session, account_name: str, field: str, secret_value: str) -> SecretReference:
    safe_account_name = account_name.strip().replace(" ", "-").lower() or "aws-account"
    safe_field = field.strip().replace(" ", "-").lower() or "value"
    name = f"{INTERNAL_AWS_INLINE_SECRET_REF_PREFIX}{safe_account_name}-{safe_field}-{int(time.time() * 1000)}"

    reference = build_local_encrypted_secret_reference(secret_value)
    parsed = validate_secret_reference(reference)
    secret_ref = SecretReference(
        name=name,
        provider=parsed.provider,
        reference_json=json.dumps(reference),
    )
    db.add(secret_ref)
    db.flush()
    return secret_ref


def _cleanup_orphaned_internal_aws_inline_secret_ref(db: Session, secret_ref_id: int | None) -> None:
    if not secret_ref_id:
        return

    secret_ref = db.query(SecretReference).filter(SecretReference.id == secret_ref_id).first()
    if not _is_internal_aws_inline_secret_ref(secret_ref):
        return

    in_use = db.query(AwsAccountConfig).filter(AwsAccountConfig.access_key_ref_id == secret_ref_id).first()
    if in_use is None:
        in_use = db.query(AwsAccountConfig).filter(AwsAccountConfig.secret_access_key_ref_id == secret_ref_id).first()
    if in_use is None:
        in_use = db.query(AwsAccountConfig).filter(AwsAccountConfig.session_token_ref_id == secret_ref_id).first()
    if in_use is not None:
        return

    db.delete(secret_ref)


def _create_internal_gcp_secret_ref(db: Session, account_name: str, service_account_json: str) -> SecretReference:
    safe_account_name = account_name.strip().replace(" ", "-").lower() or "gcp-account"
    name = f"{INTERNAL_GCP_SECRET_REF_PREFIX}{safe_account_name}-{int(time.time() * 1000)}"
    reference = build_local_encrypted_secret_reference(service_account_json)
    parsed = validate_secret_reference(reference)

    secret_ref = SecretReference(
        name=name,
        provider=parsed.provider,
        reference_json=json.dumps(reference),
    )
    db.add(secret_ref)
    db.flush()
    return secret_ref


def _cleanup_orphaned_internal_gcp_secret_ref(db: Session, secret_ref_id: int | None) -> None:
    if not secret_ref_id:
        return

    secret_ref = db.query(SecretReference).filter(SecretReference.id == secret_ref_id).first()
    if not _is_internal_gcp_secret_ref(secret_ref):
        return

    in_use = db.query(GcpAccountConfig).filter(GcpAccountConfig.service_account_ref_id == secret_ref_id).first()
    if in_use is not None:
        return

    db.delete(secret_ref)


def _create_internal_sso_secret_ref(db: Session, tenant_id: str, client_id: str, client_secret: str) -> SecretReference:
    tenant_fragment = (tenant_id or "tenant").strip().replace(" ", "-").lower()
    client_fragment = (client_id or "client").strip().replace(" ", "-").lower()
    name = f"{INTERNAL_SSO_SECRET_REF_PREFIX}{tenant_fragment}-{client_fragment}-{int(time.time() * 1000)}"
    reference = build_local_encrypted_secret_reference(client_secret)
    parsed = validate_secret_reference(reference)

    secret_ref = SecretReference(
        name=name,
        provider=parsed.provider,
        reference_json=json.dumps(reference),
    )
    db.add(secret_ref)
    db.flush()
    return secret_ref


def _cleanup_orphaned_internal_sso_secret_ref(db: Session, secret_ref_id: int | None) -> None:
    if not secret_ref_id:
        return

    secret_ref = db.query(SecretReference).filter(SecretReference.id == secret_ref_id).first()
    if not _is_internal_sso_secret_ref(secret_ref):
        return

    in_use = db.query(SsoConfig).filter(SsoConfig.client_secret_ref_id == secret_ref_id).first()
    if in_use is not None:
        return

    db.delete(secret_ref)


def _aws_credential_source(account: AwsAccountConfig) -> str | None:
    if (account.auth_mode or "access_key") != "access_key":
        return None

    if _is_internal_aws_inline_secret_ref(account.access_key_ref) and _is_internal_aws_inline_secret_ref(account.secret_access_key_ref):
        return "inline_encrypted"
    return "reference"


def _aws_account_out(account: AwsAccountConfig) -> AwsAccountOut:
    regions = _to_json(account.regions_json) if account.regions_json else None
    if regions is not None and not isinstance(regions, list):
        regions = None

    credential_source = _aws_credential_source(account)
    access_key_ref_name = account.access_key_ref.name if account.access_key_ref else None
    secret_access_key_ref_name = account.secret_access_key_ref.name if account.secret_access_key_ref else None

    if credential_source == "inline_encrypted":
        access_key_ref_name = "Stored Encrypted (local)"
        secret_access_key_ref_name = "Stored Encrypted (local)"

    if (account.auth_mode or "access_key") == "assume_role":
        access_key_ref_name = None
        secret_access_key_ref_name = None

    return AwsAccountOut(
        id=account.id,
        name=account.name,
        auth_mode=account.auth_mode or "access_key",
        credential_source=credential_source,
        access_key_ref_id=account.access_key_ref_id,
        access_key_ref_name=access_key_ref_name,
        secret_access_key_ref_id=account.secret_access_key_ref_id,
        secret_access_key_ref_name=secret_access_key_ref_name,
        session_token_ref_id=account.session_token_ref_id,
        session_token_ref_name=account.session_token_ref.name if account.session_token_ref else None,
        role_arn=account.role_arn,
        external_id=account.external_id,
        regions=regions,
        is_active=account.is_active,
    )


def _gcp_account_out(account: GcpAccountConfig) -> GcpAccountOut:
    project_ids = _to_json(account.project_ids_json) if account.project_ids_json else None
    if project_ids is not None and not isinstance(project_ids, list):
        project_ids = None

    service_account_ref_name = account.service_account_ref.name if account.service_account_ref else None
    service_account_source = "reference"
    if _is_internal_gcp_secret_ref(account.service_account_ref):
        service_account_ref_name = "Stored Encrypted (local)"
        service_account_source = "encrypted"

    return GcpAccountOut(
        id=account.id,
        name=account.name,
        service_account_ref_id=account.service_account_ref_id,
        service_account_ref_name=service_account_ref_name,
        service_account_source=service_account_source,
        project_ids=project_ids,
        is_active=account.is_active,
    )


def _to_string_list(raw: Any) -> list[str]:
    if not isinstance(raw, list):
        return []
    values: list[str] = []
    for item in raw:
        value = str(item or "").strip()
        if value:
            values.append(value)
    return values


def _to_lower_email_list(raw: Any) -> list[str]:
    if not isinstance(raw, list):
        return []
    values: list[str] = []
    for item in raw:
        value = str(item or "").strip().lower()
        if value:
            values.append(value)
    return values


def _sso_config_out(config: SsoConfig | None) -> SsoConfigOut:
    if config is None:
        if settings.entra_enabled and settings.entra_tenant_id and settings.entra_client_id and settings.entra_client_secret:
            return SsoConfigOut(
                provider="entra",
                source="environment",
                is_enabled=True,
                tenant_id=settings.entra_tenant_id,
                client_id=settings.entra_client_id,
                client_secret_ref_id=None,
                client_secret_ref_name="From Environment",
                client_secret_source="none",
                redirect_uri=settings.entra_redirect_uri or None,
                default_role="user",
                role_claim_key="groups",
                admin_group_ids=[],
                user_group_ids=[],
                admin_emails=list(settings.entra_admin_emails),
            )

        return SsoConfigOut(
            provider="entra",
            source="disabled",
            is_enabled=False,
            tenant_id=None,
            client_id=None,
            client_secret_ref_id=None,
            client_secret_ref_name=None,
            client_secret_source="none",
            redirect_uri=None,
            default_role="user",
            role_claim_key="groups",
            admin_group_ids=[],
            user_group_ids=[],
            admin_emails=[],
        )

    admin_group_ids = _to_string_list(_to_json(config.admin_group_ids_json) if config.admin_group_ids_json else [])
    user_group_ids = _to_string_list(_to_json(config.user_group_ids_json) if config.user_group_ids_json else [])
    admin_emails = _to_lower_email_list(_to_json(config.admin_emails_json) if config.admin_emails_json else [])

    secret_name = config.client_secret_ref.name if config.client_secret_ref else None
    secret_source: str = "none"
    if config.client_secret_ref_id is not None:
        secret_source = "encrypted" if _is_internal_sso_secret_ref(config.client_secret_ref) else "reference"
        if secret_source == "encrypted":
            secret_name = "Stored Encrypted (local)"

    return SsoConfigOut(
        provider="entra",
        source="database",
        is_enabled=config.is_enabled,
        tenant_id=config.tenant_id,
        client_id=config.client_id,
        client_secret_ref_id=config.client_secret_ref_id,
        client_secret_ref_name=secret_name,
        client_secret_source=secret_source,
        redirect_uri=config.redirect_uri,
        default_role="admin" if (config.default_role or "user") == "admin" else "user",
        role_claim_key=config.role_claim_key or "groups",
        admin_group_ids=admin_group_ids,
        user_group_ids=user_group_ids,
        admin_emails=admin_emails,
    )


def _runtime_entra_config(db: Session) -> dict[str, Any] | None:
    config = db.query(SsoConfig).filter(SsoConfig.provider == "entra").first()
    if config is not None:
        if not config.is_enabled:
            return None
        if not config.tenant_id or not config.client_id or not config.client_secret_ref_id:
            return None

        if not config.client_secret_ref:
            return None

        secret_ref_payload = _to_json(config.client_secret_ref.reference_json)
        resolved_secret = str(resolve_secrets(secret_ref_payload))
        return {
            "tenant_id": config.tenant_id,
            "client_id": config.client_id,
            "client_secret": resolved_secret,
            "redirect_uri": config.redirect_uri,
            "default_role": "admin" if (config.default_role or "user") == "admin" else "user",
            "role_claim_key": config.role_claim_key or "groups",
            "admin_group_ids": set(_to_string_list(_to_json(config.admin_group_ids_json) if config.admin_group_ids_json else [])),
            "user_group_ids": set(_to_string_list(_to_json(config.user_group_ids_json) if config.user_group_ids_json else [])),
            "admin_emails": set(_to_lower_email_list(_to_json(config.admin_emails_json) if config.admin_emails_json else [])),
        }

    if settings.entra_enabled and settings.entra_tenant_id and settings.entra_client_id and settings.entra_client_secret:
        return {
            "tenant_id": settings.entra_tenant_id,
            "client_id": settings.entra_client_id,
            "client_secret": settings.entra_client_secret,
            "redirect_uri": settings.entra_redirect_uri or None,
            "default_role": "user",
            "role_claim_key": "groups",
            "admin_group_ids": set(),
            "user_group_ids": set(),
            "admin_emails": set(settings.entra_admin_emails),
        }

    return None


def _create_entra_oauth_client(tenant_id: str, client_id: str, client_secret: str):
    runtime_oauth = OAuth()
    runtime_oauth.register(
        name="entra",
        client_id=client_id,
        client_secret=client_secret,
        server_metadata_url=(
            f"https://login.microsoftonline.com/{tenant_id}/v2.0/.well-known/openid-configuration"
        ),
        client_kwargs={"scope": "openid profile email"},
    )
    return runtime_oauth.create_client("entra")


def _extract_claim_values(userinfo: dict[str, Any], claim_key: str) -> set[str]:
    raw = userinfo.get(claim_key)
    if raw is None:
        return set()

    if isinstance(raw, list):
        return {str(item).strip() for item in raw if str(item).strip()}

    value = str(raw).strip()
    if not value:
        return set()
    return {value}


def _resolve_entra_role(email: str | None, group_values: set[str], config: dict[str, Any]) -> str:
    admin_groups: set[str] = config.get("admin_group_ids", set())
    user_groups: set[str] = config.get("user_group_ids", set())
    admin_emails: set[str] = config.get("admin_emails", set())

    if group_values & admin_groups:
        return "admin"
    if group_values & user_groups:
        return "user"

    if email and email.lower() in admin_emails:
        return "admin"

    default_role = str(config.get("default_role") or "user").lower()
    return "admin" if default_role == "admin" else "user"


def _current_user(
    db: Session,
    credentials: HTTPAuthorizationCredentials | None,
) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    try:
        payload = decode_access_token(credentials.credentials)
    except AuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    user = db.query(User).filter(User.username == str(payload.get("sub"))).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is inactive or does not exist")
    return user


def get_current_user(
    request: Request,
    db: Session = Depends(get_db_session),
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> User:
    user = _current_user(db, credentials)
    allowed_paths = {"/api/auth/me", "/api/auth/change-password"}
    if user.must_change_password and request.url.path not in allowed_paths:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password change required before accessing other features",
        )
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access is required")
    return user


@asynccontextmanager
async def lifespan(_: FastAPI):
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            db.add(
                User(
                    username=settings.bootstrap_admin_username,
                    password_hash=hash_password(settings.default_admin_password),
                    role="admin",
                    provider="local",
                    is_active=True,
                    must_change_password=True,
                )
            )
            db.commit()
    finally:
        db.close()

    discovery_scheduler.start()
    discovery_scheduler.sync_jobs()
    try:
        yield
    finally:
        discovery_scheduler.shutdown()


app = FastAPI(title=settings.app_name, version="0.2.0", lifespan=lifespan)
app.add_middleware(SessionMiddleware, secret_key=settings.jwt_secret)

static_dir = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/")
async def index() -> FileResponse:
    return FileResponse(static_dir / "index.html")


@app.get("/guide")
async def guide() -> FileResponse:
    return FileResponse(static_dir / "user-guide.html")


@app.post("/api/auth/bootstrap-admin")
async def bootstrap_admin(payload: BootstrapAdminRequest, db: Session = Depends(get_db_session)):
    if db.query(User).count() > 0:
        raise HTTPException(status_code=400, detail="Bootstrap is only allowed when no users exist")

    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password.get_secret_value()),
        role="admin",
        provider="local",
        must_change_password=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "access_token": create_access_token(user.username, user.role),
        "user": _user_out(user),
        "must_change_password": user.must_change_password,
    }


@app.post("/api/auth/login")
async def login(payload: LoginRequest, db: Session = Depends(get_db_session)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or user.provider != "local" or not verify_password(payload.password.get_secret_value(), user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is inactive")

    return {
        "access_token": create_access_token(user.username, user.role),
        "user": _user_out(user),
        "must_change_password": user.must_change_password,
    }


@app.post("/api/auth/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user.provider != "local":
        raise HTTPException(status_code=400, detail="Password change is only supported for local users")

    current = payload.current_password.get_secret_value()
    new = payload.new_password.get_secret_value()
    if not verify_password(current, user.password_hash):
        raise HTTPException(status_code=401, detail="Current password is invalid")
    if current == new:
        raise HTTPException(status_code=400, detail="New password must be different from current password")

    user.password_hash = hash_password(new)
    user.must_change_password = False
    user.password_changed_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return {"message": "Password updated", "user": _user_out(user)}


@app.get("/api/auth/me")
async def me(user: User = Depends(get_current_user)):
    return _user_out(user)


@app.get("/api/auth/entra/login")
async def entra_login(request: Request, db: Session = Depends(get_db_session)):
    config = _runtime_entra_config(db)
    if config is None:
        raise HTTPException(status_code=400, detail="Entra SSO is not configured")

    client = _create_entra_oauth_client(
        str(config["tenant_id"]),
        str(config["client_id"]),
        str(config["client_secret"]),
    )
    if client is None:
        raise HTTPException(status_code=400, detail="Entra SSO is not configured")

    redirect_uri = config.get("redirect_uri") or request.url_for("entra_callback")
    return await client.authorize_redirect(request, str(redirect_uri))


@app.get("/api/auth/entra/callback", name="entra_callback")
async def entra_callback(request: Request, db: Session = Depends(get_db_session)):
    config = _runtime_entra_config(db)
    if config is None:
        raise HTTPException(status_code=400, detail="Entra SSO is not configured")

    client = _create_entra_oauth_client(
        str(config["tenant_id"]),
        str(config["client_id"]),
        str(config["client_secret"]),
    )
    if client is None:
        raise HTTPException(status_code=400, detail="Entra SSO is not configured")

    token = await client.authorize_access_token(request)
    userinfo = token.get("userinfo")
    if userinfo is None:
        userinfo = await client.parse_id_token(request, token)

    oid = str(userinfo.get("oid") or userinfo.get("sub") or "")
    email = str(userinfo.get("preferred_username") or userinfo.get("email") or "").lower() or None
    if not oid:
        raise HTTPException(status_code=400, detail="Entra token did not provide a stable user id")

    role_claim_key = str(config.get("role_claim_key") or "groups")
    group_values = _extract_claim_values(userinfo, role_claim_key)
    role = _resolve_entra_role(email, group_values, config)

    user = db.query(User).filter(User.entra_oid == oid).first()
    if not user and email:
        user = db.query(User).filter(User.email == email).first()

    if not user:
        username = email or f"entra-{oid[:8]}"
        user = User(
            username=username,
            email=email,
            role=role,
            provider="entra",
            entra_oid=oid,
            is_active=True,
            must_change_password=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        updated = False
        if email and user.email != email:
            user.email = email
            updated = True
        if user.role != role:
            user.role = role
            updated = True
        if not user.entra_oid:
            user.entra_oid = oid
            updated = True
        if user.provider != "entra":
            user.provider = "entra"
            updated = True
        if updated:
            db.commit()
            db.refresh(user)

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is inactive")

    access_token = create_access_token(user.username, user.role)
    return RedirectResponse(url=f"/?token={quote_plus(access_token)}")


@app.get("/api/admin/users")
async def list_users(_: User = Depends(require_admin), db: Session = Depends(get_db_session)):
    users = db.query(User).order_by(User.username.asc()).all()
    return [_user_out(user) for user in users]


@app.post("/api/admin/users")
async def create_user(payload: UserCreateRequest, _: User = Depends(require_admin), db: Session = Depends(get_db_session)):
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=409, detail="Username already exists")

    if payload.provider == "local" and not payload.password:
        raise HTTPException(status_code=400, detail="Local users require a password")

    user = User(
        username=payload.username,
        email=payload.email.lower() if payload.email else None,
        role=payload.role,
        provider=payload.provider,
        entra_oid=payload.entra_oid,
        password_hash=hash_password(payload.password.get_secret_value()) if payload.password else None,
        is_active=True,
        must_change_password=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _user_out(user)


@app.put("/api/admin/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    role: str = Query(..., pattern="^(admin|user)$"),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_admin.id == user.id and role != "admin":
        raise HTTPException(status_code=400, detail="You cannot remove your own admin role")

    if user.role == "admin" and role != "admin" and user.is_active:
        active_admin_count = db.query(User).filter(User.role == "admin", User.is_active == True).count()  # noqa: E712
        if active_admin_count <= 1:
            raise HTTPException(status_code=409, detail="At least one active admin is required")

    user.role = role
    db.commit()
    db.refresh(user)
    return _user_out(user)


@app.put("/api/admin/users/{user_id}/status")
async def update_user_status(
    user_id: int,
    is_active: bool = Query(...),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_admin.id == user.id and not is_active:
        raise HTTPException(status_code=400, detail="You cannot disable your own account")

    if user.role == "admin" and user.is_active and not is_active:
        active_admin_count = db.query(User).filter(User.role == "admin", User.is_active == True).count()  # noqa: E712
        if active_admin_count <= 1:
            raise HTTPException(status_code=409, detail="At least one active admin is required")

    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return _user_out(user)


@app.delete("/api/admin/users/{user_id}")
async def delete_user(
    user_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_admin.id == user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    if user.role == "admin" and user.is_active:
        active_admin_count = db.query(User).filter(User.role == "admin", User.is_active == True).count()  # noqa: E712
        if active_admin_count <= 1:
            raise HTTPException(status_code=409, detail="At least one active admin is required")

    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@app.get("/api/admin/sso-config")
async def get_sso_config(_: User = Depends(require_admin), db: Session = Depends(get_db_session)):
    config = db.query(SsoConfig).filter(SsoConfig.provider == "entra").first()
    return _sso_config_out(config)


@app.put("/api/admin/sso-config")
async def update_sso_config(
    payload: SsoConfigUpdateRequest,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    config = db.query(SsoConfig).filter(SsoConfig.provider == "entra").first()
    if config is None:
        config = SsoConfig(provider="entra")
        db.add(config)
        db.flush()

    old_secret_ref_id = config.client_secret_ref_id
    new_secret_ref_id: int | None = None

    inline_secret = payload.client_secret.get_secret_value().strip() if payload.client_secret else ""
    if payload.client_secret_ref_id is not None and inline_secret:
        raise HTTPException(status_code=400, detail="Provide either client_secret_ref_id or client_secret, not both")

    if payload.client_secret_ref_id is not None:
        if payload.client_secret_ref_id <= 0:
            raise HTTPException(status_code=400, detail="Invalid client_secret_ref_id")
        secret_ref = db.query(SecretReference).filter(SecretReference.id == payload.client_secret_ref_id).first()
        if not secret_ref:
            raise HTTPException(status_code=404, detail="Secret reference not found")
        new_secret_ref_id = payload.client_secret_ref_id

    if inline_secret:
        secret_ref = _create_internal_sso_secret_ref(
            db,
            str(payload.tenant_id or config.tenant_id or "tenant"),
            str(payload.client_id or config.client_id or "client"),
            inline_secret,
        )
        new_secret_ref_id = secret_ref.id

    if "client_secret_ref_id" in payload.model_fields_set and payload.client_secret_ref_id is None and not inline_secret:
        config.client_secret_ref_id = None
    elif new_secret_ref_id is not None:
        config.client_secret_ref_id = new_secret_ref_id

    config.is_enabled = payload.is_enabled
    config.tenant_id = payload.tenant_id.strip() if payload.tenant_id else None
    config.client_id = payload.client_id.strip() if payload.client_id else None
    config.redirect_uri = payload.redirect_uri.strip() if payload.redirect_uri else None
    config.default_role = payload.default_role
    config.role_claim_key = (payload.role_claim_key or "groups").strip() or "groups"
    config.admin_group_ids_json = json.dumps(_to_string_list(payload.admin_group_ids))
    config.user_group_ids_json = json.dumps(_to_string_list(payload.user_group_ids))
    config.admin_emails_json = json.dumps(_to_lower_email_list(payload.admin_emails))
    config.updated_at = datetime.utcnow()

    if config.is_enabled:
        if not config.tenant_id or not config.client_id:
            raise HTTPException(status_code=400, detail="SSO enabled mode requires tenant_id and client_id")
        if not config.client_secret_ref_id and not settings.entra_client_secret:
            raise HTTPException(
                status_code=400,
                detail="SSO enabled mode requires client_secret_ref_id or environment ENTRA_CLIENT_SECRET",
            )

    db.commit()

    if old_secret_ref_id != config.client_secret_ref_id:
        _cleanup_orphaned_internal_sso_secret_ref(db, old_secret_ref_id)
        db.commit()

    db.refresh(config)
    return _sso_config_out(config)


@app.get("/api/admin/secret-references")
async def list_secret_references(_: User = Depends(require_admin), db: Session = Depends(get_db_session)):
    refs = (
        db.query(SecretReference)
        .filter(~SecretReference.name.startswith(INTERNAL_AZURE_SECRET_REF_PREFIX))
        .filter(~SecretReference.name.startswith(INTERNAL_AWS_SECRET_REF_PREFIX))
        .filter(~SecretReference.name.startswith(INTERNAL_GCP_SECRET_REF_PREFIX))
        .filter(~SecretReference.name.startswith(INTERNAL_SSO_SECRET_REF_PREFIX))
        .order_by(SecretReference.name.asc())
        .all()
    )
    return [_secret_reference_out(secret_ref) for secret_ref in refs]


@app.post("/api/admin/secret-references")
async def create_secret_reference(
    payload: SecretReferenceCreateRequest,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    if (
        payload.name.startswith(INTERNAL_AZURE_SECRET_REF_PREFIX)
        or payload.name.startswith(INTERNAL_AWS_SECRET_REF_PREFIX)
        or payload.name.startswith(INTERNAL_GCP_SECRET_REF_PREFIX)
        or payload.name.startswith(INTERNAL_SSO_SECRET_REF_PREFIX)
    ):
        raise HTTPException(status_code=400, detail="Secret reference name prefix is reserved")

    if db.query(SecretReference).filter(SecretReference.name == payload.name).first():
        raise HTTPException(status_code=409, detail="Secret reference name already exists")

    try:
        parsed = validate_secret_reference(payload.reference)
    except SecretResolutionError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    secret_ref = SecretReference(
        name=payload.name,
        provider=parsed.provider,
        reference_json=json.dumps(payload.reference),
    )
    db.add(secret_ref)
    db.commit()
    db.refresh(secret_ref)
    return _secret_reference_out(secret_ref)


@app.put("/api/admin/secret-references/{reference_id}")
async def update_secret_reference(
    reference_id: int,
    payload: SecretReferenceUpdateRequest,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    secret_ref = db.query(SecretReference).filter(SecretReference.id == reference_id).first()
    if not secret_ref:
        raise HTTPException(status_code=404, detail="Secret reference not found")

    if _is_internal_secret_ref(secret_ref):
        raise HTTPException(status_code=403, detail="Internal secret references cannot be modified")

    if payload.name is not None and payload.name != secret_ref.name:
        if (
            payload.name.startswith(INTERNAL_AZURE_SECRET_REF_PREFIX)
            or payload.name.startswith(INTERNAL_AWS_SECRET_REF_PREFIX)
            or payload.name.startswith(INTERNAL_GCP_SECRET_REF_PREFIX)
            or payload.name.startswith(INTERNAL_SSO_SECRET_REF_PREFIX)
        ):
            raise HTTPException(status_code=400, detail="Secret reference name prefix is reserved")
        if db.query(SecretReference).filter(SecretReference.name == payload.name).first():
            raise HTTPException(status_code=409, detail="Secret reference name already exists")
        secret_ref.name = payload.name

    if payload.reference is not None:
        try:
            parsed = validate_secret_reference(payload.reference)
        except SecretResolutionError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        secret_ref.provider = parsed.provider
        secret_ref.reference_json = json.dumps(payload.reference)

    db.commit()
    db.refresh(secret_ref)
    return _secret_reference_out(secret_ref)


@app.delete("/api/admin/secret-references/{reference_id}")
async def delete_secret_reference(
    reference_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    secret_ref = db.query(SecretReference).filter(SecretReference.id == reference_id).first()
    if not secret_ref:
        raise HTTPException(status_code=404, detail="Secret reference not found")

    if _is_internal_secret_ref(secret_ref):
        raise HTTPException(status_code=403, detail="Internal secret references cannot be deleted directly")

    in_use = (
        db.query(AzureTenantConfig).filter(AzureTenantConfig.client_secret_ref_id == reference_id).first() is not None
        or db.query(AwsAccountConfig).filter(AwsAccountConfig.access_key_ref_id == reference_id).first() is not None
        or db.query(AwsAccountConfig).filter(AwsAccountConfig.secret_access_key_ref_id == reference_id).first() is not None
        or db.query(AwsAccountConfig).filter(AwsAccountConfig.session_token_ref_id == reference_id).first() is not None
        or db.query(GcpAccountConfig).filter(GcpAccountConfig.service_account_ref_id == reference_id).first() is not None
        or db.query(SsoConfig).filter(SsoConfig.client_secret_ref_id == reference_id).first() is not None
    )
    if in_use:
        raise HTTPException(status_code=409, detail="Secret reference is in use by cloud account configuration")

    db.delete(secret_ref)
    db.commit()
    return {"message": "Secret reference deleted"}


@app.get("/api/admin/azure-tenants")
async def list_azure_tenants(_: User = Depends(require_admin), db: Session = Depends(get_db_session)):
    tenants = db.query(AzureTenantConfig).order_by(AzureTenantConfig.name.asc()).all()
    return [_azure_tenant_out(tenant) for tenant in tenants]


@app.post("/api/admin/azure-tenants")
async def create_azure_tenant(
    payload: AzureTenantCreateRequest,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    if db.query(AzureTenantConfig).filter(AzureTenantConfig.name == payload.name).first():
        raise HTTPException(status_code=409, detail="Azure tenant name already exists")

    secret_ref_id = payload.client_secret_ref_id
    inline_secret = payload.client_secret.get_secret_value().strip() if payload.client_secret else ""
    if secret_ref_id is not None and inline_secret:
        raise HTTPException(status_code=400, detail="Provide either client_secret_ref_id or client_secret, not both")

    if secret_ref_id is not None:
        secret_ref = db.query(SecretReference).filter(SecretReference.id == secret_ref_id).first()
        if not secret_ref:
            raise HTTPException(status_code=404, detail="Secret reference not found")
    elif inline_secret:
        secret_ref = _create_internal_azure_secret_ref(db, payload.name, inline_secret)
        secret_ref_id = secret_ref.id
    else:
        raise HTTPException(status_code=400, detail="Either client_secret_ref_id or client_secret is required")

    tenant = AzureTenantConfig(
        name=payload.name,
        tenant_id=payload.tenant_id,
        client_id=payload.client_id,
        client_secret_ref_id=secret_ref_id,
        subscription_ids_json=json.dumps(payload.subscription_ids) if payload.subscription_ids is not None else None,
        is_active=payload.is_active,
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return _azure_tenant_out(tenant)


@app.put("/api/admin/azure-tenants/{tenant_id}")
async def update_azure_tenant(
    tenant_id: int,
    payload: AzureTenantUpdateRequest,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    tenant = db.query(AzureTenantConfig).filter(AzureTenantConfig.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Azure tenant not found")

    old_secret_ref_id = tenant.client_secret_ref_id
    new_secret_ref_id: int | None = None

    if payload.name is not None:
        tenant.name = payload.name
    if payload.tenant_id is not None:
        tenant.tenant_id = payload.tenant_id
    if payload.client_id is not None:
        tenant.client_id = payload.client_id
    inline_secret = payload.client_secret.get_secret_value().strip() if payload.client_secret else ""
    if payload.client_secret_ref_id is not None and inline_secret:
        raise HTTPException(status_code=400, detail="Provide either client_secret_ref_id or client_secret, not both")

    if payload.client_secret_ref_id is not None:
        secret_ref = db.query(SecretReference).filter(SecretReference.id == payload.client_secret_ref_id).first()
        if not secret_ref:
            raise HTTPException(status_code=404, detail="Secret reference not found")
        new_secret_ref_id = payload.client_secret_ref_id

    if inline_secret:
        secret_ref = _create_internal_azure_secret_ref(db, tenant.name, inline_secret)
        new_secret_ref_id = secret_ref.id

    if new_secret_ref_id is not None:
        tenant.client_secret_ref_id = new_secret_ref_id
    if "subscription_ids" in payload.model_fields_set:
        tenant.subscription_ids_json = json.dumps(payload.subscription_ids) if payload.subscription_ids is not None else None
    if payload.is_active is not None:
        tenant.is_active = payload.is_active

    db.commit()

    if new_secret_ref_id is not None and old_secret_ref_id != new_secret_ref_id:
        _cleanup_orphaned_internal_azure_secret_ref(db, old_secret_ref_id)
        db.commit()

    db.refresh(tenant)
    return _azure_tenant_out(tenant)


@app.delete("/api/admin/azure-tenants/{tenant_id}")
async def delete_azure_tenant(
    tenant_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    tenant = db.query(AzureTenantConfig).filter(AzureTenantConfig.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Azure tenant not found")

    if db.query(ScanProfile).filter(ScanProfile.scan_type == "azure", ScanProfile.config_json.like(f'%"tenant_config_id": {tenant_id}%')).first():
        raise HTTPException(status_code=409, detail="Azure tenant is in use by scan profiles")

    old_secret_ref_id = tenant.client_secret_ref_id
    db.delete(tenant)
    db.commit()
    _cleanup_orphaned_internal_azure_secret_ref(db, old_secret_ref_id)
    db.commit()
    return {"message": "Azure tenant deleted"}


@app.post("/api/admin/azure-tenants/{tenant_id}/create-profile")
async def create_profile_from_azure_tenant(
    tenant_id: int,
    payload: AzureTenantCreateProfileRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    tenant = db.query(AzureTenantConfig).filter(AzureTenantConfig.id == tenant_id).first()
    if not tenant or not tenant.is_active:
        raise HTTPException(status_code=404, detail="Azure tenant not found or inactive")

    base_name = payload.profile_name.strip() if payload.profile_name else f"azure-{tenant.name}-profile"
    candidate_name = base_name
    suffix = 2
    while db.query(ScanProfile).filter(ScanProfile.name == candidate_name).first():
        candidate_name = f"{base_name}-{suffix}"
        suffix += 1

    profile_config = {
        "tenant_config_id": tenant.id,
        "max_resources_per_subscription": payload.max_resources_per_subscription,
    }
    try:
        validate_scan_profile_config("azure", profile_config)
    except ScanProfileValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    profile = ScanProfile(
        name=candidate_name,
        scan_type="azure",
        schedule_minutes=payload.schedule_minutes,
        is_enabled=payload.is_enabled,
        config_json=json.dumps(profile_config),
        created_by_user_id=current_user.id,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    discovery_scheduler.sync_jobs()
    return _profile_out(profile)


@app.get("/api/admin/aws-accounts")
async def list_aws_accounts(_: User = Depends(require_admin), db: Session = Depends(get_db_session)):
    accounts = db.query(AwsAccountConfig).order_by(AwsAccountConfig.name.asc()).all()
    return [_aws_account_out(account) for account in accounts]


@app.post("/api/admin/aws-accounts")
async def create_aws_account(
    payload: AwsAccountCreateRequest,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    if db.query(AwsAccountConfig).filter(AwsAccountConfig.name == payload.name).first():
        raise HTTPException(status_code=409, detail="AWS account name already exists")

    auth_mode = payload.auth_mode
    credential_source = payload.credential_source
    access_key_ref_id = payload.access_key_ref_id
    secret_access_key_ref_id = payload.secret_access_key_ref_id

    if auth_mode == "access_key":
        if credential_source == "reference":
            if access_key_ref_id is None or secret_access_key_ref_id is None:
                raise HTTPException(status_code=400, detail="Access key mode with reference source requires access key and secret key references")

            access_key_ref = db.query(SecretReference).filter(SecretReference.id == access_key_ref_id).first()
            secret_access_key_ref = db.query(SecretReference).filter(SecretReference.id == secret_access_key_ref_id).first()
            if not access_key_ref or not secret_access_key_ref:
                raise HTTPException(status_code=404, detail="Referenced secret not found")
        else:
            raw_access_key_id = (payload.access_key_id or "").strip()
            raw_secret_access_key = payload.secret_access_key.get_secret_value().strip() if payload.secret_access_key else ""
            if not raw_access_key_id or not raw_secret_access_key:
                raise HTTPException(
                    status_code=400,
                    detail="Access key mode with inline encrypted source requires access_key_id and secret_access_key",
                )

            inline_access_ref = _create_internal_aws_inline_secret_ref(
                db,
                payload.name,
                "access-key-id",
                raw_access_key_id,
            )
            inline_secret_ref = _create_internal_aws_inline_secret_ref(
                db,
                payload.name,
                "secret-access-key",
                raw_secret_access_key,
            )
            access_key_ref_id = inline_access_ref.id
            secret_access_key_ref_id = inline_secret_ref.id
    else:
        if not payload.role_arn:
            raise HTTPException(status_code=400, detail="Assume role mode requires role_arn")

        source_access_ref, source_secret_ref = _ensure_internal_aws_source_secret_refs(db)
        access_key_ref_id = source_access_ref.id
        secret_access_key_ref_id = source_secret_ref.id

    session_token_ref = None
    if payload.session_token_ref_id is not None:
        session_token_ref = db.query(SecretReference).filter(SecretReference.id == payload.session_token_ref_id).first()
        if not session_token_ref:
            raise HTTPException(status_code=404, detail="Session token secret reference not found")

    account = AwsAccountConfig(
        name=payload.name,
        auth_mode=auth_mode,
        access_key_ref_id=access_key_ref_id,
        secret_access_key_ref_id=secret_access_key_ref_id,
        session_token_ref_id=payload.session_token_ref_id,
        role_arn=payload.role_arn if auth_mode == "assume_role" else None,
        external_id=payload.external_id if auth_mode == "assume_role" else None,
        regions_json=json.dumps(payload.regions) if payload.regions is not None else None,
        is_active=payload.is_active,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return _aws_account_out(account)


@app.put("/api/admin/aws-accounts/{account_id}")
async def update_aws_account(
    account_id: int,
    payload: AwsAccountUpdateRequest,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    account = db.query(AwsAccountConfig).filter(AwsAccountConfig.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="AWS account not found")

    if payload.name is not None:
        if payload.name != account.name and db.query(AwsAccountConfig).filter(AwsAccountConfig.name == payload.name).first():
            raise HTTPException(status_code=409, detail="AWS account name already exists")
        account.name = payload.name

    old_access_key_ref_id = account.access_key_ref_id
    old_secret_access_key_ref_id = account.secret_access_key_ref_id
    old_session_token_ref_id = account.session_token_ref_id

    previous_auth_mode = account.auth_mode or "access_key"
    effective_auth_mode = payload.auth_mode if payload.auth_mode is not None else (account.auth_mode or "access_key")
    if payload.auth_mode is not None:
        account.auth_mode = payload.auth_mode
    elif account.auth_mode is None:
        account.auth_mode = "access_key"

    if effective_auth_mode == "assume_role":
        effective_role_arn = payload.role_arn if payload.role_arn is not None else account.role_arn
        if not effective_role_arn:
            raise HTTPException(status_code=400, detail="Assume role mode requires role_arn")

        account.role_arn = effective_role_arn
        if "external_id" in payload.model_fields_set:
            account.external_id = payload.external_id

        source_access_ref, source_secret_ref = _ensure_internal_aws_source_secret_refs(db)
        account.access_key_ref_id = source_access_ref.id
        account.secret_access_key_ref_id = source_secret_ref.id
    else:
        current_credential_source = _aws_credential_source(account) or "reference"
        effective_credential_source = payload.credential_source or current_credential_source

        if effective_credential_source == "reference":
            has_existing_reference_credentials = bool(
                account.access_key_ref_id
                and account.secret_access_key_ref_id
                and not _is_internal_aws_secret_ref(account.access_key_ref)
                and not _is_internal_aws_secret_ref(account.secret_access_key_ref)
            )

            if payload.access_key_ref_id is not None:
                ref = db.query(SecretReference).filter(SecretReference.id == payload.access_key_ref_id).first()
                if not ref:
                    raise HTTPException(status_code=404, detail="Access key secret reference not found")
                account.access_key_ref_id = payload.access_key_ref_id

            if payload.secret_access_key_ref_id is not None:
                ref = db.query(SecretReference).filter(SecretReference.id == payload.secret_access_key_ref_id).first()
                if not ref:
                    raise HTTPException(status_code=404, detail="Secret access key reference not found")
                account.secret_access_key_ref_id = payload.secret_access_key_ref_id

            if payload.auth_mode == "access_key" and previous_auth_mode != "access_key":
                if payload.access_key_ref_id is None or payload.secret_access_key_ref_id is None:
                    raise HTTPException(
                        status_code=400,
                        detail="Switching to access key mode with reference source requires access key and secret key references",
                    )

            if not has_existing_reference_credentials and (
                payload.access_key_ref_id is None or payload.secret_access_key_ref_id is None
            ):
                raise HTTPException(
                    status_code=400,
                    detail="Reference credential source requires access key and secret key references",
                )
        else:
            raw_access_key_id = (payload.access_key_id or "").strip()
            raw_secret_access_key = payload.secret_access_key.get_secret_value().strip() if payload.secret_access_key else ""

            if raw_access_key_id:
                inline_access_ref = _create_internal_aws_inline_secret_ref(
                    db,
                    account.name,
                    "access-key-id",
                    raw_access_key_id,
                )
                account.access_key_ref_id = inline_access_ref.id
            elif current_credential_source != "inline_encrypted":
                raise HTTPException(
                    status_code=400,
                    detail="Inline encrypted credential source requires access_key_id when switching to inline mode",
                )

            if raw_secret_access_key:
                inline_secret_ref = _create_internal_aws_inline_secret_ref(
                    db,
                    account.name,
                    "secret-access-key",
                    raw_secret_access_key,
                )
                account.secret_access_key_ref_id = inline_secret_ref.id
            elif current_credential_source != "inline_encrypted":
                raise HTTPException(
                    status_code=400,
                    detail="Inline encrypted credential source requires secret_access_key when switching to inline mode",
                )

        account.role_arn = None
        account.external_id = None

    if "session_token_ref_id" in payload.model_fields_set:
        if payload.session_token_ref_id is None:
            account.session_token_ref_id = None
        else:
            ref = db.query(SecretReference).filter(SecretReference.id == payload.session_token_ref_id).first()
            if not ref:
                raise HTTPException(status_code=404, detail="Session token reference not found")
            account.session_token_ref_id = payload.session_token_ref_id

    if "regions" in payload.model_fields_set:
        account.regions_json = json.dumps(payload.regions) if payload.regions is not None else None
    if payload.is_active is not None:
        account.is_active = payload.is_active

    db.commit()
    db.refresh(account)

    if old_access_key_ref_id != account.access_key_ref_id:
        _cleanup_orphaned_internal_aws_inline_secret_ref(db, old_access_key_ref_id)
    if old_secret_access_key_ref_id != account.secret_access_key_ref_id:
        _cleanup_orphaned_internal_aws_inline_secret_ref(db, old_secret_access_key_ref_id)
    if old_session_token_ref_id != account.session_token_ref_id:
        _cleanup_orphaned_internal_aws_inline_secret_ref(db, old_session_token_ref_id)
    db.commit()

    return _aws_account_out(account)


@app.delete("/api/admin/aws-accounts/{account_id}")
async def delete_aws_account(
    account_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    account = db.query(AwsAccountConfig).filter(AwsAccountConfig.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="AWS account not found")

    if db.query(ScanProfile).filter(ScanProfile.scan_type == "aws", ScanProfile.config_json.like(f'%"aws_account_id": {account_id}%')).first():
        raise HTTPException(status_code=409, detail="AWS account is in use by scan profiles")

    old_access_key_ref_id = account.access_key_ref_id
    old_secret_access_key_ref_id = account.secret_access_key_ref_id
    old_session_token_ref_id = account.session_token_ref_id

    db.delete(account)
    db.commit()

    _cleanup_orphaned_internal_aws_inline_secret_ref(db, old_access_key_ref_id)
    _cleanup_orphaned_internal_aws_inline_secret_ref(db, old_secret_access_key_ref_id)
    _cleanup_orphaned_internal_aws_inline_secret_ref(db, old_session_token_ref_id)
    db.commit()

    return {"message": "AWS account deleted"}


@app.get("/api/admin/gcp-accounts")
async def list_gcp_accounts(_: User = Depends(require_admin), db: Session = Depends(get_db_session)):
    accounts = db.query(GcpAccountConfig).order_by(GcpAccountConfig.name.asc()).all()
    return [_gcp_account_out(account) for account in accounts]


@app.post("/api/admin/gcp-accounts")
async def create_gcp_account(
    payload: GcpAccountCreateRequest,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    if db.query(GcpAccountConfig).filter(GcpAccountConfig.name == payload.name).first():
        raise HTTPException(status_code=409, detail="GCP account name already exists")

    service_account_ref_id = payload.service_account_ref_id
    inline_service_account_json = payload.service_account_json.get_secret_value().strip() if payload.service_account_json else ""
    if service_account_ref_id is not None and inline_service_account_json:
        raise HTTPException(status_code=400, detail="Provide either service_account_ref_id or service_account_json, not both")

    if service_account_ref_id is not None:
        secret_ref = db.query(SecretReference).filter(SecretReference.id == service_account_ref_id).first()
        if not secret_ref:
            raise HTTPException(status_code=404, detail="Secret reference not found")
    elif inline_service_account_json:
        secret_ref = _create_internal_gcp_secret_ref(db, payload.name, inline_service_account_json)
        service_account_ref_id = secret_ref.id
    else:
        raise HTTPException(status_code=400, detail="Either service_account_ref_id or service_account_json is required")

    account = GcpAccountConfig(
        name=payload.name,
        service_account_ref_id=service_account_ref_id,
        project_ids_json=json.dumps(payload.project_ids) if payload.project_ids is not None else None,
        is_active=payload.is_active,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return _gcp_account_out(account)


@app.put("/api/admin/gcp-accounts/{account_id}")
async def update_gcp_account(
    account_id: int,
    payload: GcpAccountUpdateRequest,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    account = db.query(GcpAccountConfig).filter(GcpAccountConfig.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="GCP account not found")

    if payload.name is not None:
        if payload.name != account.name and db.query(GcpAccountConfig).filter(GcpAccountConfig.name == payload.name).first():
            raise HTTPException(status_code=409, detail="GCP account name already exists")
        account.name = payload.name

    old_service_account_ref_id = account.service_account_ref_id
    new_service_account_ref_id: int | None = None
    inline_service_account_json = payload.service_account_json.get_secret_value().strip() if payload.service_account_json else ""
    if payload.service_account_ref_id is not None and inline_service_account_json:
        raise HTTPException(status_code=400, detail="Provide either service_account_ref_id or service_account_json, not both")

    if payload.service_account_ref_id is not None:
        secret_ref = db.query(SecretReference).filter(SecretReference.id == payload.service_account_ref_id).first()
        if not secret_ref:
            raise HTTPException(status_code=404, detail="Secret reference not found")
        new_service_account_ref_id = payload.service_account_ref_id

    if inline_service_account_json:
        secret_ref = _create_internal_gcp_secret_ref(db, account.name, inline_service_account_json)
        new_service_account_ref_id = secret_ref.id

    if new_service_account_ref_id is not None:
        account.service_account_ref_id = new_service_account_ref_id

    if "project_ids" in payload.model_fields_set:
        account.project_ids_json = json.dumps(payload.project_ids) if payload.project_ids is not None else None
    if payload.is_active is not None:
        account.is_active = payload.is_active

    db.commit()

    if new_service_account_ref_id is not None and old_service_account_ref_id != new_service_account_ref_id:
        _cleanup_orphaned_internal_gcp_secret_ref(db, old_service_account_ref_id)
        db.commit()

    db.refresh(account)
    return _gcp_account_out(account)


@app.delete("/api/admin/gcp-accounts/{account_id}")
async def delete_gcp_account(
    account_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    account = db.query(GcpAccountConfig).filter(GcpAccountConfig.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="GCP account not found")

    if db.query(ScanProfile).filter(ScanProfile.scan_type == "gcp", ScanProfile.config_json.like(f'%"gcp_account_id": {account_id}%')).first():
        raise HTTPException(status_code=409, detail="GCP account is in use by scan profiles")

    old_service_account_ref_id = account.service_account_ref_id
    db.delete(account)
    db.commit()

    _cleanup_orphaned_internal_gcp_secret_ref(db, old_service_account_ref_id)
    db.commit()

    return {"message": "GCP account deleted"}


@app.get("/api/admin/scan-profiles")
async def list_scan_profiles(_: User = Depends(require_admin), db: Session = Depends(get_db_session)):
    profiles = db.query(ScanProfile).order_by(ScanProfile.name.asc()).all()
    return [_profile_out(profile) for profile in profiles]


@app.post("/api/admin/scan-profiles")
async def create_scan_profile(
    payload: ScanProfileCreateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    try:
        validate_scan_profile_config(payload.scan_type, payload.config)
    except ScanProfileValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if db.query(ScanProfile).filter(ScanProfile.name == payload.name).first():
        raise HTTPException(status_code=409, detail="Profile name already exists")

    profile = ScanProfile(
        name=payload.name,
        scan_type=payload.scan_type,
        schedule_minutes=payload.schedule_minutes,
        is_enabled=payload.is_enabled,
        config_json=json.dumps(payload.config),
        created_by_user_id=current_user.id,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    discovery_scheduler.sync_jobs()
    return _profile_out(profile)


@app.put("/api/admin/scan-profiles/{profile_id}")
async def update_scan_profile(
    profile_id: int,
    payload: ScanProfileUpdateRequest,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    profile = db.query(ScanProfile).filter(ScanProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if payload.name is not None:
        profile.name = payload.name
    if payload.schedule_minutes is not None:
        profile.schedule_minutes = payload.schedule_minutes
    if payload.is_enabled is not None:
        profile.is_enabled = payload.is_enabled
    if payload.config is not None:
        try:
            validate_scan_profile_config(profile.scan_type, payload.config)
        except ScanProfileValidationError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        profile.config_json = json.dumps(payload.config)

    db.commit()
    db.refresh(profile)
    discovery_scheduler.sync_jobs()
    return _profile_out(profile)


@app.delete("/api/admin/scan-profiles/{profile_id}")
async def delete_scan_profile(
    profile_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    profile = db.query(ScanProfile).filter(ScanProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    run_ids = [row[0] for row in db.query(ScanRun.id).filter(ScanRun.profile_id == profile_id).all()]
    if run_ids:
        db.query(InventoryItem).filter(InventoryItem.run_id.in_(run_ids)).delete(synchronize_session=False)

    db.query(ScanRun).filter(ScanRun.profile_id == profile_id).delete(synchronize_session=False)
    db.delete(profile)
    db.commit()

    discovery_scheduler.sync_jobs()
    return {"message": "Profile deleted"}


@app.post("/api/admin/scan-profiles/{profile_id}/run")
async def run_scan_profile_now(
    profile_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    profile = db.query(ScanProfile).filter(ScanProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    run = await execute_and_persist_scan(db, profile, triggered_by=current_user.username)
    return _run_out(run)


@app.get("/api/inventory/runs")
async def list_runs(
    limit: int = Query(default=100, ge=1, le=2000),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    runs = db.query(ScanRun).order_by(desc(ScanRun.started_at)).limit(limit).all()
    return [_run_out(run) for run in runs]


@app.get("/api/inventory/filter-options")
async def list_inventory_filter_options(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    rows = db.query(InventoryItem.provider, InventoryItem.item_type).all()

    providers = sorted({provider for provider, _ in rows if provider})
    item_types = sorted({item_type for _, item_type in rows if item_type})

    provider_item_types: dict[str, list[str]] = {}
    for provider in providers:
        provider_types = sorted(
            {
                item_type
                for row_provider, item_type in rows
                if row_provider == provider and item_type
            }
        )
        provider_item_types[provider] = provider_types

    return {
        "providers": providers,
        "item_types": item_types,
        "provider_item_types": provider_item_types,
    }


@app.get("/api/inventory/items")
async def list_inventory(
    provider: str | None = None,
    item_type: str | None = None,
    search: str | None = None,
    limit: int = Query(default=300, ge=1, le=5000),
    include_history: bool = Query(default=False),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    query = db.query(InventoryItem)
    if provider:
        query = query.filter(InventoryItem.provider == provider)
    if item_type:
        query = query.filter(InventoryItem.item_type == item_type)
    if search:
        like = f"%{search}%"
        query = query.filter((InventoryItem.name.ilike(like)) | (InventoryItem.item_key.ilike(like)))

    ordered_query = query.order_by(desc(InventoryItem.discovered_at), desc(InventoryItem.id))
    if include_history:
        items = ordered_query.limit(limit).all()
        return [_inventory_out(item) for item in items]

    # Default inventory behavior is a current-state view: one latest row per resource key.
    latest_items: list[InventoryItem] = []
    seen_keys: set[tuple[str, str]] = set()
    for item in ordered_query.all():
        dedupe_key = (item.provider, item.item_key)
        if dedupe_key in seen_keys:
            continue
        seen_keys.add(dedupe_key)
        latest_items.append(item)
        if len(latest_items) >= limit:
            break

    items = latest_items
    return [_inventory_out(item) for item in items]


@app.get("/api/service-models/catalog")
async def list_service_models(
    include_inactive: bool = Query(default=True),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    query = db.query(ServiceModel)
    if not include_inactive:
        query = query.filter(ServiceModel.is_active == True)  # noqa: E712
    services = query.order_by(ServiceModel.name.asc()).all()
    return [_service_model_out(service, db) for service in services]


@app.get("/api/service-models/catalog/{service_id}")
async def get_service_model(
    service_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    service = db.query(ServiceModel).filter(ServiceModel.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service model not found")
    return _service_model_out(service, db)


@app.post("/api/service-models/catalog")
async def create_service_model(
    payload: ServiceModelCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if db.query(ServiceModel).filter(ServiceModel.name == payload.name).first():
        raise HTTPException(status_code=409, detail="Service model name already exists")

    service = ServiceModel(
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        is_active=payload.is_active,
        created_by_user_id=current_user.id,
        updated_at=datetime.utcnow(),
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return _service_model_out(service, db)


@app.put("/api/service-models/catalog/{service_id}")
async def update_service_model(
    service_id: int,
    payload: ServiceModelUpdateRequest,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    service = db.query(ServiceModel).filter(ServiceModel.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service model not found")

    if payload.name is not None:
        updated_name = payload.name.strip()
        existing = db.query(ServiceModel).filter(ServiceModel.name == updated_name, ServiceModel.id != service_id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Service model name already exists")
        service.name = updated_name

    if "description" in payload.model_fields_set:
        service.description = payload.description.strip() if payload.description else None

    if payload.is_active is not None:
        service.is_active = payload.is_active

    service.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(service)
    return _service_model_out(service, db)


@app.delete("/api/service-models/catalog/{service_id}")
async def delete_service_model(
    service_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    service = db.query(ServiceModel).filter(ServiceModel.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service model not found")

    db.query(ServiceModelDependency).filter(
        (ServiceModelDependency.service_id == service_id) | (ServiceModelDependency.depends_on_service_id == service_id)
    ).delete(synchronize_session=False)
    db.query(ServiceModelResource).filter(ServiceModelResource.service_id == service_id).delete(synchronize_session=False)
    db.delete(service)
    db.commit()
    return {"message": "Service model deleted"}


@app.post("/api/service-models/catalog/{service_id}/resources")
async def attach_resources_to_service(
    service_id: int,
    payload: ServiceModelResourceAttachRequest,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    service = db.query(ServiceModel).filter(ServiceModel.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service model not found")

    requested_keys = []
    for key in payload.inventory_item_keys:
        normalized = str(key or "").strip()
        if normalized:
            requested_keys.append(normalized)
    requested_keys = list(dict.fromkeys(requested_keys))
    if not requested_keys:
        raise HTTPException(status_code=400, detail="At least one inventory item key is required")

    existing_keys = {
        row.inventory_item_key
        for row in db.query(ServiceModelResource.inventory_item_key).filter(ServiceModelResource.service_id == service_id).all()
    }

    attached_count = 0
    missing_keys: list[str] = []
    for inventory_item_key in requested_keys:
        if inventory_item_key in existing_keys:
            continue

        inventory_item = (
            db.query(InventoryItem)
            .filter(InventoryItem.item_key == inventory_item_key)
            .order_by(desc(InventoryItem.discovered_at), desc(InventoryItem.id))
            .first()
        )
        if not inventory_item:
            missing_keys.append(inventory_item_key)
            continue

        db.add(
            ServiceModelResource(
                service_id=service_id,
                inventory_item_key=inventory_item.item_key,
                provider=inventory_item.provider,
                item_type=inventory_item.item_type,
                name=inventory_item.name,
                region=inventory_item.region,
            )
        )
        existing_keys.add(inventory_item_key)
        attached_count += 1

    service.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(service)

    return {
        "attached_count": attached_count,
        "missing_keys": missing_keys,
        "service": _service_model_out(service, db),
    }


@app.delete("/api/service-models/catalog/{service_id}/resources/{resource_id}")
async def detach_service_resource(
    service_id: int,
    resource_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    service = db.query(ServiceModel).filter(ServiceModel.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service model not found")

    resource = db.query(ServiceModelResource).filter(
        ServiceModelResource.id == resource_id,
        ServiceModelResource.service_id == service_id,
    ).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Service resource attachment not found")

    db.delete(resource)
    service.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Service resource detached"}


@app.post("/api/service-models/catalog/{service_id}/dependencies")
async def add_service_dependency(
    service_id: int,
    payload: ServiceModelDependencyCreateRequest,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    service = db.query(ServiceModel).filter(ServiceModel.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service model not found")

    if payload.depends_on_service_id == service_id:
        raise HTTPException(status_code=400, detail="A service cannot depend on itself")

    depends_on = db.query(ServiceModel).filter(ServiceModel.id == payload.depends_on_service_id).first()
    if not depends_on:
        raise HTTPException(status_code=404, detail="Dependency target service not found")

    relation = payload.relation.strip().lower().replace(" ", "_")
    existing_dependency = db.query(ServiceModelDependency).filter(
        ServiceModelDependency.service_id == service_id,
        ServiceModelDependency.depends_on_service_id == payload.depends_on_service_id,
        ServiceModelDependency.relation == relation,
    ).first()
    if existing_dependency:
        return _service_model_out(service, db)

    db.add(
        ServiceModelDependency(
            service_id=service_id,
            depends_on_service_id=payload.depends_on_service_id,
            relation=relation,
        )
    )
    service.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(service)
    return _service_model_out(service, db)


@app.delete("/api/service-models/catalog/{service_id}/dependencies/{dependency_id}")
async def remove_service_dependency(
    service_id: int,
    dependency_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    service = db.query(ServiceModel).filter(ServiceModel.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service model not found")

    dependency = db.query(ServiceModelDependency).filter(
        ServiceModelDependency.id == dependency_id,
        ServiceModelDependency.service_id == service_id,
    ).first()
    if not dependency:
        raise HTTPException(status_code=404, detail="Service dependency not found")

    db.delete(dependency)
    service.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Service dependency removed"}


@app.get("/api/service-models/overview")
async def service_model_overview(
    max_items: int = Query(default=2000, ge=100, le=10000),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    rows = db.query(InventoryItem).order_by(desc(InventoryItem.discovered_at)).limit(max_items).all()

    nodes: dict[str, dict[str, Any]] = {}
    edges: list[dict[str, str]] = []
    edge_keys: set[tuple[str, str, str]] = set()

    def add_edge(from_node: str, to_node: str, relation: str) -> None:
        edge_key = (from_node, to_node, relation)
        if edge_key in edge_keys:
            return
        edge_keys.add(edge_key)
        edges.append({"from": from_node, "to": to_node, "relation": relation})

    for row in rows:
        if row.item_key not in nodes:
            nodes[row.item_key] = {
                "id": row.item_key,
                "label": row.name,
                "type": row.item_type,
                "provider": row.provider,
                "region": row.region,
            }

        if row.parent_key:
            add_edge(row.parent_key, row.item_key, "contains")
            if row.parent_key not in nodes:
                nodes[row.parent_key] = {
                    "id": row.parent_key,
                    "label": row.parent_key,
                    "type": "logical.parent",
                    "provider": row.provider,
                    "region": row.region,
                }

    services = db.query(ServiceModel).order_by(ServiceModel.name.asc()).all()
    for service in services:
        service_node_id = f"service:{service.id}"
        nodes[service_node_id] = {
            "id": service_node_id,
            "label": service.name,
            "type": "service.catalog",
            "provider": "catalog",
            "region": None,
            "is_active": service.is_active,
        }

    resources = db.query(ServiceModelResource).all()
    for resource in resources:
        service_node_id = f"service:{resource.service_id}"
        if service_node_id not in nodes:
            continue

        if resource.inventory_item_key not in nodes:
            nodes[resource.inventory_item_key] = {
                "id": resource.inventory_item_key,
                "label": resource.name,
                "type": resource.item_type or "inventory.resource",
                "provider": resource.provider or "unknown",
                "region": resource.region,
            }
        add_edge(service_node_id, resource.inventory_item_key, "uses")

    dependencies = db.query(ServiceModelDependency).all()
    for dependency in dependencies:
        from_node = f"service:{dependency.service_id}"
        to_node = f"service:{dependency.depends_on_service_id}"
        if from_node in nodes and to_node in nodes:
            add_edge(from_node, to_node, dependency.relation or "depends_on")

    return {
        "nodes": list(nodes.values()),
        "edges": edges,
        "node_count": len(nodes),
        "edge_count": len(edges),
    }
