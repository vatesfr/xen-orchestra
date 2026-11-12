"""Find the operating system(s) installed on the guest disks.

Every candidate filesystem is mounted read-only (without journal replay),
inspected, then unmounted.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .blockdev import LDM_PARTTYPES, BlockDev
from .mounts import Mounts
from .report import Report
from .util import RepairError, find_ci, guest_exists

LINUX_FSTYPES = {"ext2", "ext3", "ext4", "xfs", "btrfs"}
# usual root subvolume names when the btrfs default subvolume is not the root
BTRFS_ROOT_SUBVOLS = ("@", "root", "@rootfs", "rootfs")


@dataclass
class OsCandidate:
    kind: str  # linux | windows
    device: BlockDev
    subvol: str | None = None


def classify(mnt: Path, fstype: str) -> str | None:
    if fstype == "ntfs":
        if find_ci(mnt, "Windows", "System32", "config", "SYSTEM"):
            return "windows"
        return None
    if not (mnt / "etc" / "fstab").is_file():
        return None
    if guest_exists(mnt, "/etc/os-release") or guest_exists(mnt, "/usr/lib/os-release"):
        return "linux"
    if any((mnt / "etc").glob("*-release")):
        return "linux"
    return None


def probe(devices: list[BlockDev], mounts: Mounts, report: Report) -> list[OsCandidate]:
    candidates: list[OsCandidate] = []
    for dev in devices:
        if (dev.parttype or "").lower() in LDM_PARTTYPES:
            report.error("windows_dynamic_disk",
                         f"{dev.path} belongs to a Windows dynamic disk, which is not supported",
                         device=dev.path)
            continue
        if dev.fstype == "crypto_LUKS":
            report.warning("luks_volume", f"{dev.path} is LUKS-encrypted and cannot be inspected",
                           device=dev.path)
            continue
        if dev.fstype == "BitLocker":
            report.warning("bitlocker_volume",
                           f"{dev.path} is BitLocker-encrypted and cannot be inspected",
                           device=dev.path)
            continue
        if dev.fstype not in LINUX_FSTYPES | {"ntfs"}:
            continue
        try:
            mnt = mounts.mount(dev.path, dev.fstype, readonly=True)
        except RepairError as exc:
            if exc.code == "windows_hibernated":
                report.error(exc.code, str(exc), device=dev.path)
            else:
                report.warning("probe_mount_failed", str(exc), device=dev.path)
            continue
        try:
            kind = classify(mnt, dev.fstype)
            subvol = None
            if kind is None and dev.fstype == "btrfs":
                kind, subvol = _probe_btrfs_subvols(dev, mounts)
            if kind:
                candidates.append(OsCandidate(kind, dev, subvol))
        finally:
            mounts.umount(mnt)
    return candidates


def _probe_btrfs_subvols(dev: BlockDev, mounts: Mounts) -> tuple[str | None, str | None]:
    top = mounts.mount(dev.path, "btrfs", readonly=True, options=["subvolid=5"])
    try:
        for name in BTRFS_ROOT_SUBVOLS:
            if (top / name).is_dir() and classify(top / name, "btrfs") == "linux":
                return "linux", name
    finally:
        mounts.umount(top)
    return None, None
