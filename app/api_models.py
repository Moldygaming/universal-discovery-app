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
    scan_type: Literal["icmp", "snmp", "azure", "aws"]
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
    access_key_ref_id: int
    secret_access_key_ref_id: int
    session_token_ref_id: int | None = None
    regions: list[str] | None = None
    is_active: bool = True


class AwsAccountUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=180)
    access_key_ref_id: int | None = None
    secret_access_key_ref_id: int | None = None
    session_token_ref_id: int | None = None
    regions: list[str] | None = None
    is_active: bool | None = None


class AwsAccountOut(BaseModel):
    id: int
    name: str
    access_key_ref_id: int
    access_key_ref_name: str
    secret_access_key_ref_id: int
    secret_access_key_ref_name: str
    session_token_ref_id: int | None
    session_token_ref_name: str | None
    regions: list[str] | None
    is_active: bool
