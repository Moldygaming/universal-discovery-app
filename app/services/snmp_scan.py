import asyncio
from typing import Dict, List, Tuple

from pysnmp.hlapi.asyncio import (
    CommunityData,
    ContextData,
    ObjectIdentity,
    ObjectType,
    SnmpEngine,
    UdpTransportTarget,
)

try:
    from pysnmp.hlapi.asyncio import getCmd  # type: ignore
except ImportError:
    from pysnmp.hlapi.asyncio import get_cmd as getCmd  # type: ignore

from app.services.ip_targets import expand_targets


async def _build_transport(ip: str, port: int, timeout_seconds: float):
    if hasattr(UdpTransportTarget, "create"):
        return await UdpTransportTarget.create((ip, port), timeout=timeout_seconds, retries=0)
    return UdpTransportTarget((ip, port), timeout=timeout_seconds, retries=0)


async def _snmp_get(ip: str, community: str, version: str, oid: str, port: int, timeout_seconds: float) -> Dict[str, object]:
    transport = await _build_transport(ip=ip, port=port, timeout_seconds=timeout_seconds)
    mp_model = 0 if version == "1" else 1

    error_indication, error_status, error_index, var_binds = await getCmd(
        SnmpEngine(),
        CommunityData(community, mpModel=mp_model),
        transport,
        ContextData(),
        ObjectType(ObjectIdentity(oid)),
    )

    if error_indication:
        return {
            "ip": ip,
            "reachable": False,
            "value": None,
            "error": str(error_indication),
        }

    if error_status:
        return {
            "ip": ip,
            "reachable": False,
            "value": None,
            "error": str(error_status),
        }

    value = None
    if var_binds:
        name, value_obj = var_binds[0]
        value = {
            "oid": str(name),
            "value": str(value_obj),
        }

    return {
        "ip": ip,
        "reachable": True,
        "value": value,
        "error": None,
    }


async def scan_snmp(
    target: str,
    community: str,
    version: str,
    oid: str,
    port: int,
    timeout_seconds: float,
    concurrency: int,
    max_hosts: int,
) -> List[Dict[str, object]]:
    targets = expand_targets(target=target, max_hosts=max_hosts)
    semaphore = asyncio.Semaphore(concurrency)

    async def worker(ip: str) -> Dict[str, object]:
        async with semaphore:
            try:
                return await _snmp_get(
                    ip=ip,
                    community=community,
                    version=version,
                    oid=oid,
                    port=port,
                    timeout_seconds=timeout_seconds,
                )
            except Exception as exc:
                return {
                    "ip": ip,
                    "reachable": False,
                    "value": None,
                    "error": str(exc),
                }

    tasks = [asyncio.create_task(worker(ip)) for ip in targets]
    return await asyncio.gather(*tasks)
