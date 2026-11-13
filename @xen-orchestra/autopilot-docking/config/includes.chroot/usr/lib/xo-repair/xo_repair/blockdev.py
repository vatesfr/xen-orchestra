"""Block device inventory (lsblk) and storage stack activation."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass

from .util import RepairError, run

LSBLK_COLUMNS = "NAME,PATH,TYPE,FSTYPE,UUID,PARTUUID,LABEL,PARTTYPE,PTTYPE,SIZE,RM"
IGNORED_DISK_PREFIXES = ("loop", "sr", "zram", "ram", "fd")
# a whole disk holding an ISO filesystem is a medium, not a guest disk: the
# guest tools ISO attached read-only by XO (see tools.py)
MEDIA_FSTYPES = {"iso9660", "udf"}

ESP_PARTTYPES = {"c12a7328-f81f-11d2-ba4b-00a0c93ec93b", "0xef"}
BIOS_BOOT_PARTTYPE = "21686148-6449-6e6f-744e-656564454649"
LDM_PARTTYPES = {
    "5808c8aa-7e8f-42e0-85d2-e1e90434cfb3",  # LDM metadata (dynamic disk, GPT)
    "af9b60a0-1431-4f62-bc68-3311714a69ad",  # LDM data (dynamic disk, GPT)
    "0x42",  # dynamic disk, MBR
}


@dataclass
class BlockDev:
    name: str
    path: str
    type: str
    fstype: str | None = None
    uuid: str | None = None
    partuuid: str | None = None
    label: str | None = None
    parttype: str | None = None
    pttype: str | None = None
    size: int = 0
    removable: bool = False
    disk: str | None = None  # name of the top-level disk
    parent: str | None = None  # name of the direct parent

    def partition_number(self) -> int | None:
        if self.type != "part" or not self.parent:
            return None
        match = re.fullmatch(re.escape(self.parent) + r"p?(\d+)", self.name)
        return int(match.group(1)) if match else None

    @property
    def is_medium(self) -> bool:
        return self.type == "disk" and self.fstype in MEDIA_FSTYPES

    @property
    def is_esp(self) -> bool:
        return (self.parttype or "").lower() in ESP_PARTTYPES


def _flag(value) -> bool:
    return value in (True, 1, "1", "true")


def parse_lsblk(text: str) -> list[BlockDev]:
    data = json.loads(text)
    devices: dict[str, BlockDev] = {}

    def walk(node: dict, disk: str | None, parent: str | None) -> None:
        dev = BlockDev(
            name=node["name"],
            path=node.get("path") or f"/dev/{node['name']}",
            type=node.get("type") or "",
            fstype=node.get("fstype"),
            uuid=node.get("uuid"),
            partuuid=node.get("partuuid"),
            label=node.get("label"),
            parttype=node.get("parttype"),
            pttype=node.get("pttype"),
            size=int(node.get("size") or 0),
            removable=_flag(node.get("rm")),
            parent=parent,
        )
        dev.disk = disk or (dev.name if dev.type == "disk" else None)
        # a device can appear under several parents (RAID, multi-PV LVM)
        devices.setdefault(dev.path, dev)
        for child in node.get("children") or []:
            walk(child, dev.disk, dev.name)

    for node in data.get("blockdevices", []):
        walk(node, None, None)
    return list(devices.values())


def list_block_devices() -> list[BlockDev]:
    proc = run(["lsblk", "-J", "-b", "-o", LSBLK_COLUMNS])
    return parse_lsblk(proc.stdout)


def guest_disks(devices: list[BlockDev]) -> list[BlockDev]:
    """Guest disks in device order (xvda, xvdb, ..., xvdz, xvdaa)."""
    disks = [
        d for d in devices
        if d.type == "disk" and not d.removable and not d.is_medium
        and not d.name.startswith(IGNORED_DISK_PREFIXES)
    ]
    return sorted(disks, key=lambda d: (len(d.name), d.name))


def activate_storage(readonly: bool) -> list[str]:
    """Assemble MD arrays and activate LVM volumes so their filesystems are visible.

    Best effort: a guest without RAID or LVM makes these commands fail too. Returns the failures, which
    tell why no OS was found when none is.
    """
    mdadm = ["mdadm", "--assemble", "--scan"] + (["--readonly"] if readonly else [])
    failures = []
    for cmd in (mdadm, ["vgchange", "-ay"], ["udevadm", "settle", "--timeout=30"]):
        try:
            run(cmd, timeout=120)
        except RepairError as exc:
            failures.append(str(exc))
    return failures
