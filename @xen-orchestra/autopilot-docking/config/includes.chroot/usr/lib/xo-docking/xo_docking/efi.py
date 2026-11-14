"""Firmware checks and UEFI boot path.

The VM's NVRAM is new on XCP-ng, so the boot entries created on VMware are
gone. Instead of writing NVRAM, make sure the removable-media path
\\EFI\\BOOT\\BOOTX64.EFI exists on the ESP: the firmware always tries it, and
shim's fallback (RHEL, Ubuntu...) recreates proper entries on first boot.
This is what `grub-install --force-extra-removable` does.
"""

from __future__ import annotations

import shutil
from pathlib import Path

from .blockdev import BIOS_BOOT_PARTTYPE, BlockDev
from .mounts import Mounts
from .report import Report
from .util import DockingError, find_ci

SKIPPED_VENDOR_DIRS = {"boot", "microsoft"}
# os-release ID -> directory name used on the ESP
VENDOR_ALIASES = {
    "rhel": "redhat",
    "ol": "redhat",
    "opensuse-leap": "opensuse",
    "opensuse-tumbleweed": "opensuse",
}


def firmware() -> str:
    return "uefi" if Path("/sys/firmware/efi").exists() else "bios"


def find_esp(devices: list[BlockDev], disk: str | None) -> BlockDev | None:
    esps = [d for d in devices if d.type == "part" and d.is_esp]
    return next((d for d in esps if d.disk == disk), esps[0] if esps else None)


def fallback_copies(efi_dir: Path, kind: str, os_ids: list[str]) -> dict[Path, str] | None:
    """Files to copy into EFI/BOOT (source -> target name), {} if nothing to do."""
    boot = find_ci(efi_dir, "BOOT")
    if boot is not None and find_ci(boot, "BOOTX64.EFI") is not None:
        return {}
    if kind == "windows":
        source = find_ci(efi_dir, "Microsoft", "Boot", "bootmgfw.efi")
        return {source: "BOOTX64.EFI"} if source else None

    vendors = [d for d in efi_dir.iterdir() if d.is_dir() and d.name.lower() not in SKIPPED_VENDOR_DIRS]
    vendors = [d for d in vendors if find_ci(d, "shimx64.efi") or find_ci(d, "grubx64.efi")]
    if not vendors:
        return None
    wanted = []
    for os_id in (i.lower() for i in os_ids if i):
        wanted += [os_id, VENDOR_ALIASES.get(os_id, os_id)]
    vendors.sort(key=lambda d: wanted.index(d.name.lower()) if d.name.lower() in wanted else len(wanted))
    vendor = vendors[0]
    copies: dict[Path, str] = {}
    shim = find_ci(vendor, "shimx64.efi")
    grub = find_ci(vendor, "grubx64.efi")
    if shim:
        copies[shim] = "BOOTX64.EFI"
        if grub:
            copies[grub] = "grubx64.efi"
        mok = find_ci(vendor, "mmx64.efi")
        if mok:
            copies[mok] = "mmx64.efi"
    else:
        copies[grub] = "BOOTX64.EFI"
    config = find_ci(vendor, "grub.cfg")
    if config:
        copies[config] = "grub.cfg"
    return copies


def plan(report: Report, mounts: Mounts, devices: list[BlockDev], disk: BlockDev,
         kind: str, os_ids: list[str], readonly: bool) -> None:
    mode = firmware()
    report.firmware = mode
    if mode == "bios":
        if disk.pttype == "gpt":
            if kind == "windows":
                report.error("firmware_mismatch", "Windows on a GPT disk needs UEFI firmware on the VM")
            elif not any(d.disk == disk.name and (d.parttype or "").lower() == BIOS_BOOT_PARTTYPE
                         for d in devices):
                report.warning("firmware_mismatch",
                               "GPT disk without a BIOS boot partition: the VM probably needs UEFI firmware")
        return

    esp = find_esp(devices, disk.name)
    if esp is None:
        report.error("firmware_mismatch", "UEFI firmware but no EFI system partition: the VM probably needs BIOS")
        return
    try:
        mnt = mounts.mounted(esp.path) or mounts.mount(esp.path, "vfat", readonly=readonly)
    except DockingError as exc:
        report.error("esp_mount_failed", str(exc), device=esp.path)
        return
    efi_dir = find_ci(mnt, "EFI")
    copies = fallback_copies(efi_dir, kind, os_ids) if efi_dir else None
    if copies is None:
        report.error("no_efi_loader", f"no boot loader found on the ESP {esp.path}", device=esp.path)
        return
    if not copies:
        report.info("efi_fallback_present", "the ESP already has \\EFI\\BOOT\\BOOTX64.EFI")
        return

    def apply() -> None:
        boot = find_ci(efi_dir, "BOOT") or (efi_dir / "BOOT")
        boot.mkdir(exist_ok=True)
        for source, name in copies.items():
            shutil.copyfile(source, boot / name)

    names = ", ".join(sorted(f"{s.name}->{n}" for s, n in copies.items()))
    report.plan("efi_fallback_loader", f"create \\EFI\\BOOT on {esp.path} ({names})", apply)
