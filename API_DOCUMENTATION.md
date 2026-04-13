# Universal Discovery Server API Documentation

## 1. API Basics

- Base URL: `http://<host>:<port>`
- Content type: `application/json`
- Auth type: Bearer JWT (`Authorization: Bearer <token>`)
- Main UI route: `/`
- User guide route: `/guide`

### Authentication and Roles

- `local` users authenticate with username/password.
- Microsoft Entra sign-in flow is available via dedicated endpoints.
- Authorization model:
  - Unauthenticated: public UI/document routes only.
  - Authenticated user: inventory + service model APIs.
  - Admin user: all `/api/admin/*` APIs.

## 2. Error Model

Errors follow FastAPI defaults, typically:

```json
{"detail": "Error message"}
```

Common status codes:

- `400` bad request / validation rule failed
- `401` missing or invalid token
- `403` authenticated but not permitted
- `404` resource not found
- `409` conflict (duplicate name, protected state)
- `422` request validation failed

## 3. Authentication Endpoints

### POST `/api/auth/bootstrap-admin`
- Auth: none
- Purpose: create first admin account when needed and return token
- Body: `BootstrapAdminRequest`
- Response: auth payload with `access_token`, `user`, `must_change_password`

### POST `/api/auth/login`
- Auth: none
- Purpose: local login
- Body: `LoginRequest`
- Response: auth payload with `access_token`, `user`, `must_change_password`

### POST `/api/auth/change-password`
- Auth: bearer token
- Purpose: change current user password
- Body: `ChangePasswordRequest`
- Response: `{ "message": "...", "user": UserOut }`

### GET `/api/auth/me`
- Auth: bearer token
- Purpose: current user profile
- Response: `UserOut`

### GET `/api/auth/entra/login`
- Auth: none
- Purpose: start Entra OAuth/OIDC redirect
- Response: HTTP redirect

### GET `/api/auth/entra/callback`
- Auth: none
- Purpose: complete Entra login and issue app token
- Response: HTTP redirect to `/` with token query param

## 4. Admin: User Management

### GET `/api/admin/users`
- Auth: admin
- Response: `UserOut[]`

### POST `/api/admin/users`
- Auth: admin
- Body: `UserCreateRequest`
- Response: `UserOut`

### PUT `/api/admin/users/{user_id}/role`
- Auth: admin
- Query:
  - `role`: `admin|user`
- Response: `UserOut`
- Rules:
  - self-demotion blocked
  - last active admin demotion blocked

### PUT `/api/admin/users/{user_id}/status`
- Auth: admin
- Query:
  - `is_active`: `true|false`
- Response: `UserOut`
- Rules:
  - self-disable blocked
  - disabling last active admin blocked

### DELETE `/api/admin/users/{user_id}`
- Auth: admin
- Response: `{ "message": "User deleted" }`
- Rules:
  - self-delete blocked
  - deleting last active admin blocked

## 5. Admin: SSO Configuration

### GET `/api/admin/sso-config`
- Auth: admin
- Response: `SsoConfigOut`

### PUT `/api/admin/sso-config`
- Auth: admin
- Body: `SsoConfigUpdateRequest`
- Response: `SsoConfigOut`
- Notes:
  - supports secret reference or inline encrypted secret
  - supports group-based role mapping and fallback admin emails

## 6. Admin: Secret References

### GET `/api/admin/secret-references`
- Auth: admin
- Response: `SecretReferenceOut[]`

### POST `/api/admin/secret-references`
- Auth: admin
- Body: `SecretReferenceCreateRequest`
- Response: `SecretReferenceOut`

### PUT `/api/admin/secret-references/{reference_id}`
- Auth: admin
- Body: `SecretReferenceUpdateRequest`
- Response: `SecretReferenceOut`

### DELETE `/api/admin/secret-references/{reference_id}`
- Auth: admin
- Response: `{ "message": "Secret reference deleted" }`
- Notes:
  - fails with `409` if reference is in use

## 7. Admin: Azure Tenants

### GET `/api/admin/azure-tenants`
- Auth: admin
- Response: `AzureTenantOut[]`

### POST `/api/admin/azure-tenants`
- Auth: admin
- Body: `AzureTenantCreateRequest`
- Response: `AzureTenantOut`

### PUT `/api/admin/azure-tenants/{tenant_id}`
- Auth: admin
- Body: `AzureTenantUpdateRequest`
- Response: `AzureTenantOut`

### DELETE `/api/admin/azure-tenants/{tenant_id}`
- Auth: admin
- Response: `{ "message": "Azure tenant deleted" }`

### POST `/api/admin/azure-tenants/{tenant_id}/create-profile`
- Auth: admin
- Body: `AzureTenantCreateProfileRequest`
- Response: `ScanProfileOut`

## 8. Admin: AWS Accounts

### GET `/api/admin/aws-accounts`
- Auth: admin
- Response: `AwsAccountOut[]`

### POST `/api/admin/aws-accounts`
- Auth: admin
- Body: `AwsAccountCreateRequest`
- Response: `AwsAccountOut`

### PUT `/api/admin/aws-accounts/{account_id}`
- Auth: admin
- Body: `AwsAccountUpdateRequest`
- Response: `AwsAccountOut`

### DELETE `/api/admin/aws-accounts/{account_id}`
- Auth: admin
- Response: `{ "message": "AWS account deleted" }`

## 9. Admin: GCP Accounts

### GET `/api/admin/gcp-accounts`
- Auth: admin
- Response: `GcpAccountOut[]`

### POST `/api/admin/gcp-accounts`
- Auth: admin
- Body: `GcpAccountCreateRequest`
- Response: `GcpAccountOut`

### PUT `/api/admin/gcp-accounts/{account_id}`
- Auth: admin
- Body: `GcpAccountUpdateRequest`
- Response: `GcpAccountOut`

### DELETE `/api/admin/gcp-accounts/{account_id}`
- Auth: admin
- Response: `{ "message": "GCP account deleted" }`

## 10. Admin: Scan Profiles

### GET `/api/admin/scan-profiles`
- Auth: admin
- Response: `ScanProfileOut[]`

### POST `/api/admin/scan-profiles`
- Auth: admin
- Body: `ScanProfileCreateRequest`
- Response: `ScanProfileOut`

### PUT `/api/admin/scan-profiles/{profile_id}`
- Auth: admin
- Body: `ScanProfileUpdateRequest`
- Response: `ScanProfileOut`

### DELETE `/api/admin/scan-profiles/{profile_id}`
- Auth: admin
- Response: `{ "message": "Profile deleted" }`
- Notes:
  - removes related run history and inventory rows for that profile

### POST `/api/admin/scan-profiles/{profile_id}/run`
- Auth: admin
- Response: `ScanRunOut`

## 11. Inventory APIs

### GET `/api/inventory/runs`
- Auth: authenticated user
- Query:
  - `limit` (default `100`, max `2000`)
- Response: `ScanRunOut[]`

### GET `/api/inventory/filter-options`
- Auth: authenticated user
- Response:
  - `providers: string[]`
  - `item_types: string[]`
  - `provider_item_types: Record<string, string[]>`

### GET `/api/inventory/items`
- Auth: authenticated user
- Query:
  - `provider` (optional)
  - `item_type` (optional)
  - `search` (optional, case-insensitive against `name` and `item_key`)
  - `limit` (default `300`, max `5000`)
  - `include_history` (default `false`)
- Response: `InventoryItemOut[]`
- Notes:
  - default mode returns latest row per resource key

## 12. Service Model APIs

All service-model endpoints currently require a valid bearer token (admin not required).

### GET `/api/service-models/catalog`
- Auth: authenticated user
- Query:
  - `include_inactive` (default `true`)
- Response: `ServiceModelOut[]`

`ServiceModelOut` includes:

- `resource_count`
- `dependency_count` (services this model depends on)
- `dependant_count` (services depending on this model)
- `resources[]`
- `dependencies[]`
- `dependants[]`

### GET `/api/service-models/catalog/{service_id}`
- Auth: authenticated user
- Response: `ServiceModelOut`
- Notes:
  - includes `resources[]`, `dependencies[]`, and `dependants[]` for the selected service model

### POST `/api/service-models/catalog`
- Auth: authenticated user
- Body: `ServiceModelCreateRequest`
- Response: `ServiceModelOut`

### PUT `/api/service-models/catalog/{service_id}`
- Auth: authenticated user
- Body: `ServiceModelUpdateRequest`
- Response: `ServiceModelOut`

### DELETE `/api/service-models/catalog/{service_id}`
- Auth: authenticated user
- Response: `{ "message": "Service model deleted" }`

### POST `/api/service-models/catalog/{service_id}/resources`
- Auth: authenticated user
- Body: `ServiceModelResourceAttachRequest`
- Response:
  - `attached_count: number`
  - `missing_keys: string[]`
  - `service: ServiceModelOut`

### DELETE `/api/service-models/catalog/{service_id}/resources/{resource_id}`
- Auth: authenticated user
- Response: `{ "message": "Service resource detached" }`

### POST `/api/service-models/catalog/{service_id}/dependencies`
- Auth: authenticated user
- Body: `ServiceModelDependencyCreateRequest`
- Response: `ServiceModelOut`

### DELETE `/api/service-models/catalog/{service_id}/dependencies/{dependency_id}`
- Auth: authenticated user
- Response: `{ "message": "Service dependency removed" }`

### GET `/api/service-models/overview`
- Auth: authenticated user
- Query:
  - `max_items` (default `2000`, min `100`, max `10000`)
- Response:
  - `nodes: object[]`
  - `edges: object[]`
  - `node_count: number`
  - `edge_count: number`
- Notes:
  - combines discovered inventory graph (`contains`) with service catalogue edges (`uses`, dependency relation)

## 13. Request Schemas

### `BootstrapAdminRequest`
- `username: string` (3..120)
- `password: string` (min 8)

### `LoginRequest`
- `username: string` (3..120)
- `password: string` (min 8)

### `ChangePasswordRequest`
- `current_password: string` (min 8)
- `new_password: string` (min 8)

### `UserCreateRequest`
- `username: string`
- `email?: string`
- `password?: string`
- `role: "admin"|"user"`
- `provider: "local"|"entra"`
- `entra_oid?: string`

### `ScanProfileCreateRequest`
- `name: string`
- `scan_type: "icmp"|"snmp"|"azure"|"aws"|"gcp"`
- `schedule_minutes: number`
- `is_enabled: boolean`
- `config: object`

### `ScanProfileUpdateRequest`
- `name?: string`
- `schedule_minutes?: number`
- `is_enabled?: boolean`
- `config?: object`

### `SecretReferenceCreateRequest`
- `name: string`
- `reference: object` (supports `$secret` payloads)

### `SecretReferenceUpdateRequest`
- `name?: string`
- `reference?: object`

### `AzureTenantCreateRequest`
- `name: string`
- `tenant_id: string`
- `client_id: string`
- `client_secret_ref_id?: number`
- `client_secret?: string`
- `subscription_ids?: string[]`
- `is_active: boolean`

### `AzureTenantUpdateRequest`
- same fields as create, all optional except inferred tenant identity rules

### `AzureTenantCreateProfileRequest`
- `profile_name?: string`
- `schedule_minutes: number`
- `is_enabled: boolean`
- `max_resources_per_subscription: number`

### `AwsAccountCreateRequest`
- `name: string`
- `auth_mode: "access_key"|"assume_role"`
- `credential_source: "reference"|"inline_encrypted"`
- `access_key_ref_id?: number`
- `secret_access_key_ref_id?: number`
- `access_key_id?: string`
- `secret_access_key?: string`
- `session_token_ref_id?: number`
- `role_arn?: string`
- `external_id?: string`
- `regions?: string[]`
- `is_active: boolean`

### `AwsAccountUpdateRequest`
- same fields as create, all optional

### `GcpAccountCreateRequest`
- `name: string`
- `service_account_ref_id?: number`
- `service_account_json?: string`
- `project_ids?: string[]`
- `is_active: boolean`

### `GcpAccountUpdateRequest`
- same fields as create, all optional

### `SsoConfigUpdateRequest`
- `is_enabled: boolean`
- `tenant_id?: string`
- `client_id?: string`
- `client_secret_ref_id?: number`
- `client_secret?: string`
- `redirect_uri?: string`
- `default_role: "admin"|"user"`
- `role_claim_key?: string`
- `admin_group_ids?: string[]`
- `user_group_ids?: string[]`
- `admin_emails?: string[]`

### `ServiceModelCreateRequest`
- `name: string`
- `description?: string`
- `is_active: boolean`

### `ServiceModelUpdateRequest`
- `name?: string`
- `description?: string`
- `is_active?: boolean`

### `ServiceModelResourceAttachRequest`
- `inventory_item_keys: string[]`

### `ServiceModelDependencyCreateRequest`
- `depends_on_service_id: number`
- `relation: string`

## 14. Example Calls

### Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"AdminPass123!"}'
```

### Create a Service Model

```bash
curl -X POST http://localhost:8080/api/service-models/catalog \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"IPAM","description":"IP address management","is_active":true}'
```

### Attach Resources to a Service

```bash
curl -X POST http://localhost:8080/api/service-models/catalog/1/resources \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"inventory_item_keys":["/subscriptions/.../providers/Microsoft.KeyVault/vaults/lrdprod-kv"]}'
```

### Add Service Dependency

```bash
curl -X POST http://localhost:8080/api/service-models/catalog/1/dependencies \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"depends_on_service_id":2,"relation":"depends_on"}'
```
