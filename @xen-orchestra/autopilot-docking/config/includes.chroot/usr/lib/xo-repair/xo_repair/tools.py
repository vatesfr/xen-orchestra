"""Guest tools disk: the XCP-ng guest tools ISO, attached read-only by XO.

XO attaches the ISO from the pool's ISO SR as a read-only *disk*
(`userdevice` 25, xvdz), not as a CD: xen-blkfront ignores CD drives on HVM
guests, so the live system would not see it. It is told apart from the guest
disks by its filesystem, and recognized by its Linux/ or Windows/ directory.
"""

from __future__ import annotations

from pathlib import Path

from .blockdev import BlockDev
from .mounts import Mounts
from .report import Report
from .util import RepairError, find_ci


def find_tools(devices: list[BlockDev], mounts: Mounts, report: Report) -> Path | None:
    """Mount the guest tools disk read-only; None when XO did not attach one."""
    for dev in devices:
        if not dev.is_medium:
            continue
        try:
            mnt = mounts.mount(dev.path, dev.fstype, readonly=True)
        except RepairError as exc:
            report.warning("tools_disk_mount_failed", str(exc), device=dev.path)
            continue
        if find_ci(mnt, "Linux") or find_ci(mnt, "Windows"):
            report.tools = dev.name
            return mnt
        mounts.umount(mnt)
    return None
