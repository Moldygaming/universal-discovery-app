from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    role: Mapped[str] = mapped_column(String(24), default="user", nullable=False)
    provider: Mapped[str] = mapped_column(String(24), default="local", nullable=False)
    entra_oid: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    password_changed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class ScanProfile(Base):
    __tablename__ = "scan_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    scan_type: Mapped[str] = mapped_column(String(24), nullable=False)
    schedule_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=60)
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    config_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class ScanRun(Base):
    __tablename__ = "scan_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("scan_profiles.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(24), default="queued", nullable=False)
    triggered_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    summary_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    result_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    profile: Mapped[ScanProfile] = relationship("ScanProfile")


class SecretReference(Base):
    __tablename__ = "secret_references"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(180), unique=True, nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(60), nullable=False)
    reference_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class AzureTenantConfig(Base):
    __tablename__ = "azure_tenant_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(180), unique=True, nullable=False, index=True)
    tenant_id: Mapped[str] = mapped_column(String(180), nullable=False)
    client_id: Mapped[str] = mapped_column(String(180), nullable=False)
    client_secret_ref_id: Mapped[int] = mapped_column(ForeignKey("secret_references.id"), nullable=False)
    subscription_ids_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    client_secret_ref: Mapped[SecretReference] = relationship("SecretReference")


class AwsAccountConfig(Base):
    __tablename__ = "aws_account_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(180), unique=True, nullable=False, index=True)
    auth_mode: Mapped[str] = mapped_column(String(24), nullable=False, default="access_key")
    access_key_ref_id: Mapped[int] = mapped_column(ForeignKey("secret_references.id"), nullable=False)
    secret_access_key_ref_id: Mapped[int] = mapped_column(ForeignKey("secret_references.id"), nullable=False)
    session_token_ref_id: Mapped[int | None] = mapped_column(ForeignKey("secret_references.id"), nullable=True)
    role_arn: Mapped[str | None] = mapped_column(String(255), nullable=True)
    external_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    regions_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    access_key_ref: Mapped[SecretReference] = relationship("SecretReference", foreign_keys=[access_key_ref_id])
    secret_access_key_ref: Mapped[SecretReference] = relationship(
        "SecretReference", foreign_keys=[secret_access_key_ref_id]
    )
    session_token_ref: Mapped[SecretReference | None] = relationship(
        "SecretReference", foreign_keys=[session_token_ref_id]
    )


class GcpAccountConfig(Base):
    __tablename__ = "gcp_account_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(180), unique=True, nullable=False, index=True)
    service_account_ref_id: Mapped[int] = mapped_column(ForeignKey("secret_references.id"), nullable=False)
    project_ids_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    service_account_ref: Mapped[SecretReference] = relationship("SecretReference", foreign_keys=[service_account_ref_id])


class SsoConfig(Base):
    __tablename__ = "sso_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    provider: Mapped[str] = mapped_column(String(24), nullable=False, default="entra", unique=True)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tenant_id: Mapped[str | None] = mapped_column(String(180), nullable=True)
    client_id: Mapped[str | None] = mapped_column(String(180), nullable=True)
    client_secret_ref_id: Mapped[int | None] = mapped_column(ForeignKey("secret_references.id"), nullable=True)
    redirect_uri: Mapped[str | None] = mapped_column(String(500), nullable=True)
    default_role: Mapped[str] = mapped_column(String(24), nullable=False, default="user")
    role_claim_key: Mapped[str] = mapped_column(String(100), nullable=False, default="groups")
    admin_group_ids_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_group_ids_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    admin_emails_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    client_secret_ref: Mapped[SecretReference | None] = relationship("SecretReference", foreign_keys=[client_secret_ref_id])


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("scan_runs.id"), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(24), nullable=False)
    item_key: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    item_type: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    region: Mapped[str | None] = mapped_column(String(120), nullable=True)
    parent_key: Mapped[str | None] = mapped_column(String(500), nullable=True, index=True)
    attributes_json: Mapped[str] = mapped_column(Text, nullable=False)
    discovered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    run: Mapped[ScanRun] = relationship("ScanRun")
