import json
import os
from base64 import urlsafe_b64encode
from dataclasses import dataclass
from functools import lru_cache
import hashlib
from typing import Any

import boto3
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from cryptography.fernet import Fernet, InvalidToken

from app.config import settings


class SecretResolutionError(ValueError):
    pass


@dataclass(frozen=True)
class SecretReference:
    provider: str
    params: dict[str, Any]


def is_secret_ref(value: Any) -> bool:
    return isinstance(value, dict) and "$secret" in value and isinstance(value["$secret"], dict)


def parse_secret_ref(value: dict[str, Any]) -> SecretReference:
    ref = value.get("$secret", {})
    provider = str(ref.get("provider", "")).strip().lower()
    if not provider:
        raise SecretResolutionError("Secret reference provider is required")

    params = {key: val for key, val in ref.items() if key != "provider"}
    return SecretReference(provider=provider, params=params)


def validate_secret_reference(value: dict[str, Any]) -> SecretReference:
    ref = parse_secret_ref(value)

    if ref.provider == "env":
        if not str(ref.params.get("key") or "").strip():
            raise SecretResolutionError("env provider requires 'key'")
        return ref

    if ref.provider == "azure_key_vault":
        if not str(ref.params.get("vault_url") or "").strip():
            raise SecretResolutionError("azure_key_vault provider requires 'vault_url'")
        if not str(ref.params.get("name") or "").strip():
            raise SecretResolutionError("azure_key_vault provider requires 'name'")
        return ref

    if ref.provider == "aws_secrets_manager":
        if not str(ref.params.get("secret_id") or "").strip():
            raise SecretResolutionError("aws_secrets_manager provider requires 'secret_id'")
        return ref

    if ref.provider == "local_encrypted":
        if not str(ref.params.get("ciphertext") or "").strip():
            raise SecretResolutionError("local_encrypted provider requires 'ciphertext'")
        return ref

    raise SecretResolutionError(f"Unsupported secret provider: {ref.provider}")


@lru_cache(maxsize=1)
def _local_cipher() -> Fernet:
    raw_key = (settings.local_secret_encryption_key or "").strip()
    if raw_key:
        digest = hashlib.sha256(raw_key.encode("utf-8")).digest()
    else:
        digest = hashlib.sha256(settings.jwt_secret.encode("utf-8")).digest()
    fernet_key = urlsafe_b64encode(digest)
    return Fernet(fernet_key)


def build_local_encrypted_secret_reference(secret_value: str) -> dict[str, Any]:
    ciphertext = _local_cipher().encrypt(secret_value.encode("utf-8")).decode("utf-8")
    return {
        "$secret": {
            "provider": "local_encrypted",
            "ciphertext": ciphertext,
        }
    }


@lru_cache(maxsize=8)
def _kv_client(vault_url: str) -> SecretClient:
    credential = DefaultAzureCredential(exclude_interactive_browser_credential=False)
    return SecretClient(vault_url=vault_url, credential=credential)


def _resolve_env(params: dict[str, Any]) -> str:
    key = params.get("key")
    if not key:
        raise SecretResolutionError("env provider requires 'key'")
    value = os.getenv(str(key))
    if value is None:
        raise SecretResolutionError(f"Environment variable not found: {key}")
    return value


def _resolve_azure_key_vault(params: dict[str, Any]) -> str:
    vault_url = str(params.get("vault_url") or "").strip()
    name = str(params.get("name") or "").strip()
    if not vault_url or not name:
        raise SecretResolutionError("azure_key_vault provider requires 'vault_url' and 'name'")

    version = str(params.get("version") or "").strip() or None
    client = _kv_client(vault_url)
    secret = client.get_secret(name=name, version=version)
    if not secret.value:
        raise SecretResolutionError(f"Key Vault secret has no value: {name}")
    return str(secret.value)


def _resolve_aws_secrets_manager(params: dict[str, Any]) -> str:
    secret_id = str(params.get("secret_id") or "").strip()
    if not secret_id:
        raise SecretResolutionError("aws_secrets_manager provider requires 'secret_id'")

    region = str(params.get("region") or os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION") or "us-east-1")
    client = boto3.client("secretsmanager", region_name=region)
    response = client.get_secret_value(SecretId=secret_id)

    if "SecretString" in response and response["SecretString"] is not None:
        secret_string = str(response["SecretString"])
    elif "SecretBinary" in response and response["SecretBinary"] is not None:
        secret_string = response["SecretBinary"].decode("utf-8")
    else:
        raise SecretResolutionError(f"Secret value not found for id: {secret_id}")

    json_key = params.get("json_key")
    if json_key:
        try:
            parsed = json.loads(secret_string)
        except json.JSONDecodeError as exc:
            raise SecretResolutionError(
                f"Secret {secret_id} is not JSON but json_key was requested"
            ) from exc

        if json_key not in parsed:
            raise SecretResolutionError(f"json_key '{json_key}' not found in secret {secret_id}")
        return str(parsed[json_key])

    return secret_string


def _resolve_local_encrypted(params: dict[str, Any]) -> str:
    ciphertext = str(params.get("ciphertext") or "").strip()
    if not ciphertext:
        raise SecretResolutionError("local_encrypted provider requires 'ciphertext'")

    try:
        return _local_cipher().decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise SecretResolutionError("Failed to decrypt local_encrypted secret reference") from exc


def resolve_secret_reference(ref: SecretReference) -> str:
    if ref.provider == "env":
        return _resolve_env(ref.params)
    if ref.provider == "azure_key_vault":
        return _resolve_azure_key_vault(ref.params)
    if ref.provider == "aws_secrets_manager":
        return _resolve_aws_secrets_manager(ref.params)
    if ref.provider == "local_encrypted":
        return _resolve_local_encrypted(ref.params)

    raise SecretResolutionError(f"Unsupported secret provider: {ref.provider}")


def resolve_secrets(value: Any) -> Any:
    if is_secret_ref(value):
        ref = parse_secret_ref(value)
        return resolve_secret_reference(ref)

    if isinstance(value, dict):
        return {key: resolve_secrets(val) for key, val in value.items()}

    if isinstance(value, list):
        return [resolve_secrets(item) for item in value]

    return value
