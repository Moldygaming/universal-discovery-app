from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, SecretStr


class BootstrapAdminRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=120)
    password: SecretStr = Field(..., min_length=8)


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=120)
    password: SecretStr = Field(..., min_length=8)


class UserCreateRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=120)
    email: str | None = None
    password: SecretStr | None = Field(default=None)
    role: Literal["admin", "user"] = "user"
    provider: Literal["local", "entra"] = "local"
    entra_oid: str | None = None


class UserOut(BaseModel):
    id: int
    username: str
    email: str | None
    role: str
    provider: str
    is_active: bool
    must_change_password: bool


class ChangePasswordRequest(BaseModel):
    current_password: SecretStr = Field(..., min_length=8)
    new_password: SecretStr = Field(..., min_length=8)


class ScanProfileCreateRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    scan_type: Literal["icmp", "snmp", "azure", "aws", "gcp"]
    schedule_minutes: int = Field(60, ge=1, le=10080)
    is_enabled: bool = True
    config: dict[str, Any]


class ScanProfileOut(BaseModel):
    id: int
    name: str
    scan_type: str
    schedule_minutes: int
    is_enabled: bool
    config: dict[str, Any]
    last_run_at: datetime | None


class ScanProfileUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=150)
    schedule_minutes: int | None = Field(default=None, ge=1, le=10080)
    is_enabled: bool | None = None
    config: dict[str, Any] | None = None


class ScanRunOut(BaseModel):
    id: int
    profile_id: int
    profile_name: str
    status: str
    triggered_by: str | None
    started_at: datetime
    finished_at: datetime | None
    summary: dict[str, Any] | None
    error_message: str | None


class InventoryItemOut(BaseModel):
    id: int
    run_id: int
    provider: str
    item_key: str
    item_type: str
    name: str
    region: str | None
    parent_key: str | None
    attributes: dict[str, Any]
    discovered_at: datetime


class SecretReferenceCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=180)
    reference: dict[str, Any]


class SecretReferenceOut(BaseModel):
    id: int
    name: str
    provider: str
    reference: dict[str, Any]


class SecretReferenceUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=180)
    reference: dict[str, Any] | None = None


class AzureTenantCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=180)
    tenant_id: str = Field(..., min_length=3, max_length=180)
    client_id: str = Field(..., min_length=3, max_length=180)
    client_secret_ref_id: int | None = None
    client_secret: SecretStr | None = None
    subscription_ids: list[str] | None = None
    is_active: bool = True


class AzureTenantUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=180)
    tenant_id: str | None = Field(default=None, min_length=3, max_length=180)
    client_id: str | None = Field(default=None, min_length=3, max_length=180)
    client_secret_ref_id: int | None = None
    client_secret: SecretStr | None = None
    subscription_ids: list[str] | None = None
    is_active: bool | None = None


class AzureTenantOut(BaseModel):
    id: int
    name: str
    tenant_id: str
    client_id: str
    client_secret_ref_id: int | None
    client_secret_ref_name: str | None
    client_secret_source: Literal["reference", "encrypted"]
    subscription_ids: list[str] | None
    is_active: bool


class AzureTenantCreateProfileRequest(BaseModel):
    profile_name: str | None = Field(default=None, min_length=3, max_length=150)
    schedule_minutes: int = Field(default=60, ge=1, le=10080)
    is_enabled: bool = True
    max_resources_per_subscription: int = Field(default=2000, ge=1, le=50000)


class AwsAccountCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=180)
    auth_mode: Literal["access_key", "assume_role"] = "access_key"
    credential_source: Literal["reference", "inline_encrypted"] = "reference"
    access_key_ref_id: int | None = None
    secret_access_key_ref_id: int | None = None
    access_key_id: str | None = Field(default=None, min_length=1, max_length=180)
    secret_access_key: SecretStr | None = None
    session_token_ref_id: int | None = None
    role_arn: str | None = None
    external_id: str | None = None
    regions: list[str] | None = None
    is_active: bool = True


class AwsAccountUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=180)
    auth_mode: Literal["access_key", "assume_role"] | None = None
    credential_source: Literal["reference", "inline_encrypted"] | None = None
    access_key_ref_id: int | None = None
    secret_access_key_ref_id: int | None = None
    access_key_id: str | None = Field(default=None, min_length=1, max_length=180)
    secret_access_key: SecretStr | None = None
    session_token_ref_id: int | None = None
    role_arn: str | None = None
    external_id: str | None = None
    regions: list[str] | None = None
    is_active: bool | None = None


class AwsAccountOut(BaseModel):
    id: int
    name: str
    auth_mode: Literal["access_key", "assume_role"]
    credential_source: Literal["reference", "inline_encrypted"] | None
    access_key_ref_id: int | None
    access_key_ref_name: str | None
    secret_access_key_ref_id: int | None
    secret_access_key_ref_name: str | None
    session_token_ref_id: int | None
    session_token_ref_name: str | None
    role_arn: str | None
    external_id: str | None
    regions: list[str] | None
    is_active: bool


class GcpAccountCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=180)
    service_account_ref_id: int | None = None
    service_account_json: SecretStr | None = None
    project_ids: list[str] | None = None
    is_active: bool = True


class GcpAccountUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=180)
    service_account_ref_id: int | None = None
    service_account_json: SecretStr | None = None
    project_ids: list[str] | None = None
    is_active: bool | None = None


class GcpAccountOut(BaseModel):
    id: int
    name: str
    service_account_ref_id: int | None
    service_account_ref_name: str | None
    service_account_source: Literal["reference", "encrypted"]
    project_ids: list[str] | None
    is_active: bool


class SsoConfigUpdateRequest(BaseModel):
    is_enabled: bool
    tenant_id: str | None = Field(default=None, min_length=3, max_length=180)
    client_id: str | None = Field(default=None, min_length=3, max_length=180)
    client_secret_ref_id: int | None = None
    client_secret: SecretStr | None = None
    redirect_uri: str | None = None
    default_role: Literal["admin", "user"] = "user"
    role_claim_key: str | None = Field(default="groups", min_length=1, max_length=100)
    admin_group_ids: list[str] | None = None
    user_group_ids: list[str] | None = None
    admin_emails: list[str] | None = None


class SsoConfigOut(BaseModel):
    provider: Literal["entra"]
    source: Literal["database", "environment", "disabled"]
    is_enabled: bool
    tenant_id: str | None
    client_id: str | None
    client_secret_ref_id: int | None
    client_secret_ref_name: str | None
    client_secret_source: Literal["reference", "encrypted", "none"]
    redirect_uri: str | None
    default_role: Literal["admin", "user"]
    role_claim_key: str
    admin_group_ids: list[str]
    user_group_ids: list[str]
    admin_emails: list[str]


class ServiceModelCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=180)
    description: str | None = Field(default=None, max_length=2000)
    is_active: bool = True


class ServiceModelUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=180)
    description: str | None = Field(default=None, max_length=2000)
    is_active: bool | None = None


class ServiceModelResourceAttachRequest(BaseModel):
    inventory_item_keys: list[str] = Field(..., min_length=1, max_length=500)


class ServiceModelDependencyCreateRequest(BaseModel):
    depends_on_service_id: int = Field(..., ge=1)
    relation: str = Field(default="depends_on", min_length=2, max_length=60)


class ServiceModelResourceOut(BaseModel):
    id: int
    inventory_item_key: str
    provider: str | None
    item_type: str | None
    name: str
    region: str | None
    created_at: datetime


class ServiceModelDependencyOut(BaseModel):
    id: int
    depends_on_service_id: int
    depends_on_service_name: str
    relation: str
    created_at: datetime


class ServiceModelOut(BaseModel):
    id: int
    name: str
    description: str | None
    is_active: bool
    created_by_user_id: int | None
    created_at: datetime
    updated_at: datetime
    resource_count: int
    dependency_count: int
    resources: list[ServiceModelResourceOut]
    dependencies: list[ServiceModelDependencyOut]
