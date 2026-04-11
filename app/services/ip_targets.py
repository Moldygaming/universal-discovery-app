import ipaddress
from typing import Iterable, List


class TargetParseError(ValueError):
    pass


def _expand_single_token(token: str) -> Iterable[ipaddress.IPv4Address]:
    if "/" in token:
        network = ipaddress.ip_network(token, strict=False)
        if network.version != 4:
            raise TargetParseError(f"Only IPv4 is supported right now: {token}")
        if network.prefixlen == 32:
            return [network.network_address]
        return list(network.hosts())

    if "-" in token:
        start_raw, end_raw = token.split("-", 1)
        start_ip = ipaddress.ip_address(start_raw.strip())
        end_ip = ipaddress.ip_address(end_raw.strip())
        if start_ip.version != 4 or end_ip.version != 4:
            raise TargetParseError(f"Only IPv4 is supported right now: {token}")
        if int(end_ip) < int(start_ip):
            raise TargetParseError(f"Invalid range start/end: {token}")
        return [ipaddress.IPv4Address(value) for value in range(int(start_ip), int(end_ip) + 1)]

    ip = ipaddress.ip_address(token)
    if ip.version != 4:
        raise TargetParseError(f"Only IPv4 is supported right now: {token}")
    return [ipaddress.IPv4Address(str(ip))]


def expand_targets(target: str, max_hosts: int) -> List[str]:
    if not target.strip():
        raise TargetParseError("Target value cannot be empty")

    result: List[str] = []
    seen = set()

    for token in [part.strip() for part in target.split(",") if part.strip()]:
        try:
            addresses = _expand_single_token(token)
        except ValueError as exc:
            raise TargetParseError(str(exc)) from exc

        for address in addresses:
            value = str(address)
            if value in seen:
                continue
            seen.add(value)
            result.append(value)
            if len(result) > max_hosts:
                raise TargetParseError(
                    f"Target expands to more than {max_hosts} hosts. Narrow the scan scope."
                )

    return result
