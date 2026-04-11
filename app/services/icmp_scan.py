import asyncio
import re
import time
from typing import Dict, List

from app.services.ip_targets import expand_targets

_RTT_REGEX = re.compile(r"time[=<]([0-9.]+)\\s*ms")


async def _ping_host(ip: str, timeout_seconds: float) -> Dict[str, object]:
    started = time.perf_counter()
    process = await asyncio.create_subprocess_exec(
        "ping",
        "-c",
        "1",
        ip,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    try:
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=timeout_seconds + 0.2)
    except asyncio.TimeoutError:
        process.kill()
        await process.communicate()
        return {
            "ip": ip,
            "alive": False,
            "rtt_ms": None,
            "duration_ms": round((time.perf_counter() - started) * 1000, 2),
            "error": "Timeout",
        }

    output = stdout.decode(errors="ignore")
    match = _RTT_REGEX.search(output)
    rtt_ms = float(match.group(1)) if match else None

    return {
        "ip": ip,
        "alive": process.returncode == 0,
        "rtt_ms": rtt_ms,
        "duration_ms": round((time.perf_counter() - started) * 1000, 2),
        "error": None if process.returncode == 0 else stderr.decode(errors="ignore").strip() or "No response",
    }


async def scan_icmp(target: str, timeout_seconds: float, concurrency: int, max_hosts: int) -> List[Dict[str, object]]:
    targets = expand_targets(target=target, max_hosts=max_hosts)
    semaphore = asyncio.Semaphore(concurrency)

    async def worker(ip: str) -> Dict[str, object]:
        async with semaphore:
            return await _ping_host(ip=ip, timeout_seconds=timeout_seconds)

    tasks = [asyncio.create_task(worker(ip)) for ip in targets]
    return await asyncio.gather(*tasks)
