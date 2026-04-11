# Universal Discovery Server

Server-based discovery platform designed as a replacement path from OpenText UCMDB discovery.

## Current Capability Set

- Burger-menu navigation in the top-right corner for all primary views
- Scheduled scan profiles created in the GUI
- Persistent storage of scan runs and discovered inventory items
- Inventory and service-model views in the GUI
- Admin console for scanning configuration and user management
- Authentication:
  - Local users (username/password)
  - Microsoft Entra ID (Azure AD) SSO
- Secret-provider abstraction for scan profiles:
  - Azure Key Vault references
  - AWS Secrets Manager references
  - Environment variable references (local/dev)
- Cloud account configuration in GUI:
  - Multiple Azure tenant configs
  - Reusable secret reference catalog

Discovery types currently supported:

- ICMP IP range scanning
- SNMP IP range scanning (v1/v2c)
- Azure resource inventory scanning (app registration credentials)
- AWS resource inventory scanning

## Architecture

- Backend: FastAPI
- Scheduler: APScheduler (interval-based scan execution)
- Database: SQLAlchemy + SQLite (default)
- Frontend: Single-page admin/operator console

Data persisted:

- Users and roles
- Scan profiles and schedules
- Scan runs with status and summary
- Inventory items discovered from scans

## Quick Start (Linux)

1. Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run API + Web UI:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8080
```

4. Open:

- http://localhost:8080
- User guide: http://localhost:8080/guide

## First-Time Setup

On first startup with an empty DB, the app auto-creates a default local admin:

- Username: `admin`
- Password: `Admin123£`

The account is blocked from all inventory/admin actions until the password is changed after first login.

Optional: override defaults via environment:

- `UDA_BOOTSTRAP_ADMIN`
- `UDA_DEFAULT_ADMIN_PASSWORD`

Manual admin bootstrap endpoint is still available if needed:

```bash
curl -X POST http://localhost:8080/api/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"ChangeMe123!"}'
```

Then login in the web console and complete password change when prompted.

## Docker Run

```bash
docker build -t universal-discovery-app .
docker run --rm -p 8080:8080 universal-discovery-app
```

## Entra (Azure AD) SSO Setup

Set in `.env`:

- `ENTRA_ENABLED=true`
- `ENTRA_TENANT_ID=<tenant-guid>`
- `ENTRA_CLIENT_ID=<app-registration-client-id>`
- `ENTRA_CLIENT_SECRET=<client-secret>`
- `ENTRA_REDIRECT_URI=http://localhost:8080/api/auth/entra/callback`
- `ENTRA_ADMIN_EMAILS=admin1@company.com,admin2@company.com`

App registration requirements:

- Platform type: Web
- Redirect URI: match `ENTRA_REDIRECT_URI`
- OpenID Connect scopes: `openid profile email`

References used for implementation guidance:

- https://learn.microsoft.com/entra/identity-platform/
- https://learn.microsoft.com/entra/identity-platform/v2-protocols
- https://learn.microsoft.com/entra/msal/

## Secret-Provider Abstraction

Scan profile configs now support secret references via `$secret`, so sensitive values are resolved only at runtime and not embedded in stored profile JSON.

Supported providers:

1. `env`
2. `azure_key_vault`
3. `aws_secrets_manager`

Reference examples:

```json
{"$secret":{"provider":"env","key":"SNMP_COMMUNITY"}}
```

```json
{"$secret":{"provider":"azure_key_vault","vault_url":"https://my-vault.vault.azure.net/","name":"discovery-client-secret"}}
```

```json
{"$secret":{"provider":"aws_secrets_manager","region":"us-east-1","secret_id":"discovery/aws","json_key":"secret_access_key"}}
```

Sensitive fields enforced to use `$secret` references:

- SNMP: `community`
- Azure: `client_secret`
- AWS: `secret_access_key`, `session_token`

If these fields are submitted as plain values, profile create/update returns HTTP 400.

### GUI Setup (No Manual JSON Needed)

In Admin Console, use the **Secret Reference Builder**:

1. Choose the scan profile `Scan Type`.
2. Choose a target secret field (or provide a custom path).
3. Choose provider (`env`, `azure_key_vault`, `aws_secrets_manager`).
4. Fill provider fields.
5. Click `Insert Into Config`.
6. Save the profile.

This inserts a `$secret` reference into `Config JSON` automatically.

### Azure Tenant Setup Window (GUI)

In Admin Console:

1. Open `Cloud Accounts`.
2. Create secret references in `Add Secret Reference` window.
3. Click `Configure Azure Tenant`.
4. Enter `Tenant ID`, `Client ID`, and choose `Client Secret Reference` from dropdown.
5. Save and optionally click `Use In Profile` to insert `tenant_config_id` into an Azure scan profile.

This provides multi-tenant Azure discovery without embedding client secrets in profile JSON.

### Azure Key Vault permissions

The app identity used by discovery runtime must have Key Vault secret read permission, e.g. `Key Vault Secrets User` on the vault scope.

### AWS Secrets Manager permissions

The app runtime identity/credentials must allow `secretsmanager:GetSecretValue` for the relevant secret IDs.

## Azure App Registration Permissions

For inventory discovery, grant the app registration at least:

- `Reader` role at subscription or management-group scope to enumerate resources.

Inputs required in UI:

- Tenant ID
- Client ID
- Client Secret
- Optional list of subscription IDs

## AWS Permissions

For this MVP inventory, IAM identity should be allowed to:

- `ec2:DescribeRegions`
- `ec2:DescribeInstances`
- `rds:DescribeDBInstances`
- `s3:ListAllMyBuckets`

Inputs required in UI:

- Access Key ID
- Secret Access Key
- Optional Session Token
- Optional regions list

## Limitations (Current MVP)

- IPv4 only for ICMP/SNMP.
- SNMP supports v1 and v2c community authentication only.
- Cloud inventory currently focuses on high-value services for rapid adoption.
- Service-model dependency graph is metadata-based and not yet deep-application aware.
- Secret references are enforced for sensitive fields, but rotation orchestration and secret health monitoring are not yet implemented.

## Future Tasks Mapped from Your Roadmap

1. HA
- Split API and worker roles.
- Add Redis queue + Postgres state store.
- Run active/active API behind load balancer.

2. Proxy Nodes
- Add distributed discovery workers with registration and health checks.
- Assign scan jobs to nodes by network segment and cloud account scope.

3. Service Modeling + Dependency Linking
- Build graph schema (services, hosts, cloud resources, edges).
- Add correlation engine for topology and dependency inference.
- Add visual topology explorer and change-impact analysis.

## Next Iteration Suggestions

- Add secret rotation health checks and alerts for referenced secret IDs.
- Add background worker nodes for segmented/proxy scanning.
- Add richer CMDB/service graph persistence (Neo4j or PostgreSQL graph model).
