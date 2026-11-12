"""xenstore access from inside the guest.

XO -> ISO: VM.xenstore_data entries, readable at vm-data/xo-repair/*
ISO -> XO: written under vm-data/xo-repair/out/*. XAPI only syncs the guest's
vm-data/ subtree back into VM.xenstore_data (not data/), and keeps it after
the VM halts.

Paths are relative to the domain's home (/local/domain/<domid>/).
"""

from __future__ import annotations

import logging
import shutil
import subprocess
from pathlib import Path

log = logging.getLogger("xo-repair")

CONFIG_PREFIX = "vm-data/xo-repair"
STATUS_PREFIX = "vm-data/xo-repair/out"


class Xenstore:
    def __init__(self, enabled: bool):
        self.enabled = enabled

    @classmethod
    def detect(cls) -> "Xenstore":
        has_tools = shutil.which("xenstore-read") is not None
        has_device = Path("/dev/xen/xenbus").exists() or Path("/proc/xen/xenbus").exists()
        if not (has_tools and has_device):
            log.warning("xenstore unavailable: status will only be logged")
        return cls(has_tools and has_device)

    def read(self, path: str) -> str | None:
        if not self.enabled:
            return None
        # -R: raw value, otherwise \ and non-printable bytes come back escaped
        proc = subprocess.run(["xenstore-read", "-R", path], capture_output=True, text=True)
        if proc.returncode != 0:
            return None
        return proc.stdout.strip()

    def write(self, path: str, value: str) -> bool:
        if not self.enabled:
            log.info("xenstore (disabled) %s = %s", path, value)
            return False
        # -R: without it xenstore-write unescapes the value (\\ -> \, \xNN -> byte),
        # and a JSON report with a Windows path (\EFI\BOOT) becomes invalid
        proc = subprocess.run(["xenstore-write", "-R", path, value], capture_output=True, text=True)
        if proc.returncode != 0:
            log.error("xenstore-write %s failed: %s", path, proc.stderr.strip())
            return False
        return True

    def remove(self, path: str) -> bool:
        if not self.enabled:
            return False
        proc = subprocess.run(["xenstore-rm", path], capture_output=True, text=True)
        return proc.returncode == 0

    def config(self, key: str) -> str | None:
        return self.read(f"{CONFIG_PREFIX}/{key}")

    def status(self, key: str, value: str) -> bool:
        return self.write(f"{STATUS_PREFIX}/{key}", value)

    def clear_status(self) -> None:
        """Remove the outputs of a previous run (they persist in VM.xenstore_data)."""
        self.remove(STATUS_PREFIX)
