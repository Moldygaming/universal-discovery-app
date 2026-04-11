import json
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
import time
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
    SecretReferenceCreateRequest,
    SecretReferenceOut,
    SecretReferenceUpdateRequest,
    UserCreateRequest,
    UserOut,
)
from app.config import settings
from app.database import Base, SessionLocal, apply_runtime_schema_patches, engine, get_db_session
from app.db_models import AwsAccountConfig, AzureTenantConfig, InventoryItem, ScanProfile, ScanRun, SecretReference, User
from app.discovery_runtime import execute_and_persist_scan, mask_sensitive_config
from app.scan_profile_validation import ScanProfileValidationError, validate_scan_profile_config
from app.scheduler_runtime import discovery_scheduler
from app.secrets.provider import SecretResolutionError, validate_secret_reference
from app.secrets.provider import build_local_encrypted_secret_reference
from app.security import AuthError, create_access_token, hash_password, verify_password, decode_access_token

Base.metadata.create_all(bind=engine)
apply_runtime_schema_patches()

oauth = OAuth()
if settings.entra_enabled and settings.entra_tenant_id and settings.entra_client_id and settings.entra_client_secret:
    oauth.register(
        name="entra",
        client_id=settings.entra_client_id,
        client_secret=settings.entra_client_secret,
        server_metadata_url=(
            f"https://login.microsoftonline.com/{settings.entra_tenant_id}/v2.0/.well-known/openid-configuration"
        ),
        client_kwargs={"scope": "openid profile email"},
    )

security = HTTPBearer(auto_error=False)
INTERNAL_AZURE_SECRET_REF_PREFIX = "__internal_azure_"


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


def _aws_account_out(account: AwsAccountConfig) -> AwsAccountOut:
    regions = _to_json(account.regions_json) if account.regions_json else None
    if regions is not None and not isinstance(regions, list):
        regions = None

    return AwsAccountOut(
        id=account.id,
        name=account.name,
        access_key_ref_id=account.access_key_ref_id,
        access_key_ref_name=account.access_key_ref.name if account.access_key_ref else "unknown",
        secret_access_key_ref_id=account.secret_access_key_ref_id,
        secret_access_key_ref_name=account.secret_access_key_ref.name if account.secret_access_key_ref else "unknown",
        session_token_ref_id=account.session_token_ref_id,
        session_token_ref_name=account.session_token_ref.name if account.session_token_ref else None,
        regions=regions,
        is_active=account.is_active,
    )


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
async def entra_login(request: Request):
    client = oauth.create_client("entra")
    if client is None:
        raise HTTPException(status_code=400, detail="Entra SSO is not configured")

    redirect_uri = settings.entra_redirect_uri or request.url_for("entra_callback")
    return await client.authorize_redirect(request, str(redirect_uri))


@app.get("/api/auth/entra/callback", name="entra_callback")
async def entra_callback(request: Request, db: Session = Depends(get_db_session)):
    client = oauth.create_client("entra")
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

    user = db.query(User).filter(User.entra_oid == oid).first()
    if not user and email:
        user = db.query(User).filter(User.email == email).first()

    if not user:
        username = email or f"entra-{oid[:8]}"
        role = "admin" if email and email in settings.entra_admin_emails else "user"
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
async def update_user_role(user_id: int, role: str = Query(..., pattern="^(admin|user)$"), _: User = Depends(require_admin), db: Session = Depends(get_db_session)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    db.refresh(user)
    return _user_out(user)


@app.get("/api/admin/secret-references")
async def list_secret_references(_: User = Depends(require_admin), db: Session = Depends(get_db_session)):
    refs = (
        db.query(SecretReference)
        .filter(~SecretReference.name.startswith(INTERNAL_AZURE_SECRET_REF_PREFIX))
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
    if payload.name.startswith(INTERNAL_AZURE_SECRET_REF_PREFIX):
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

    if _is_internal_azure_secret_ref(secret_ref):
        raise HTTPException(status_code=403, detail="Internal secret references cannot be modified")

    if payload.name is not None and payload.name != secret_ref.name:
        if payload.name.startswith(INTERNAL_AZURE_SECRET_REF_PREFIX):
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

    if _is_internal_azure_secret_ref(secret_ref):
        raise HTTPException(status_code=403, detail="Internal secret references cannot be deleted directly")

    in_use = (
        db.query(AzureTenantConfig).filter(AzureTenantConfig.client_secret_ref_id == reference_id).first() is not None
        or db.query(AwsAccountConfig).filter(AwsAccountConfig.access_key_ref_id == reference_id).first() is not None
        or db.query(AwsAccountConfig).filter(AwsAccountConfig.secret_access_key_ref_id == reference_id).first() is not None
        or db.query(AwsAccountConfig).filter(AwsAccountConfig.session_token_ref_id == reference_id).first() is not None
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

    access_key_ref = db.query(SecretReference).filter(SecretReference.id == payload.access_key_ref_id).first()
    secret_access_key_ref = db.query(SecretReference).filter(SecretReference.id == payload.secret_access_key_ref_id).first()
    if not access_key_ref or not secret_access_key_ref:
        raise HTTPException(status_code=404, detail="Referenced secret not found")

    session_token_ref = None
    if payload.session_token_ref_id is not None:
        session_token_ref = db.query(SecretReference).filter(SecretReference.id == payload.session_token_ref_id).first()
        if not session_token_ref:
            raise HTTPException(status_code=404, detail="Session token secret reference not found")

    account = AwsAccountConfig(
        name=payload.name,
        access_key_ref_id=payload.access_key_ref_id,
        secret_access_key_ref_id=payload.secret_access_key_ref_id,
        session_token_ref_id=payload.session_token_ref_id,
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

    db.delete(account)
    db.commit()
    return {"message": "AWS account deleted"}


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
        query = query.filter((InventoryItem.name.like(like)) | (InventoryItem.item_key.like(like)))

    items = query.order_by(desc(InventoryItem.discovered_at)).limit(limit).all()
    return [_inventory_out(item) for item in items]


@app.get("/api/service-models/overview")
async def service_model_overview(
    max_items: int = Query(default=2000, ge=100, le=10000),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    rows = db.query(InventoryItem).order_by(desc(InventoryItem.discovered_at)).limit(max_items).all()

    nodes: dict[str, dict] = {}
    edges = []

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
            edges.append({"from": row.parent_key, "to": row.item_key, "relation": "contains"})
            if row.parent_key not in nodes:
                nodes[row.parent_key] = {
                    "id": row.parent_key,
                    "label": row.parent_key,
                    "type": "logical.parent",
                    "provider": row.provider,
                    "region": row.region,
                }

    return {
        "nodes": list(nodes.values()),
        "edges": edges,
        "node_count": len(nodes),
        "edge_count": len(edges),
    }
