"""xo-repair: prepare a VM migrated from VMware to boot on XCP-ng.

Booted from the live ISO inside the migrated VM itself. Inputs come from
xenstore (set by XO), results go back to xenstore, then the VM powers off.
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

from . import efi
from .blockdev import activate_storage, guest_disks, list_block_devices
from .detect import probe
from .linux import LinuxGuest, parse_nic_map
from .mounts import Mounts
from .report import Report
from .tools import find_tools
from .util import RepairError, kernel_cmdline_param, run
from .windows import WindowsGuest, parse_windows_nics
from .xenstore import Xenstore

log = logging.getLogger("xo-repair")

MODES = ("diagnose", "repair")
RUN_DIR = Path("/run/xo-repair")
VERSION_FILE = Path(__file__).resolve().parent.parent / "VERSION"


def read_version() -> str:
    try:
        return VERSION_FILE.read_text().strip() or "dev"
    except OSError:
        return "dev"


def setup_logging(verbose: bool) -> None:
    RUN_DIR.mkdir(parents=True, exist_ok=True)
    log.setLevel(logging.DEBUG)
    console = logging.StreamHandler(sys.stderr)
    console.setLevel(logging.DEBUG if verbose else logging.INFO)
    console.setFormatter(logging.Formatter("xo-repair: %(levelname)s %(message)s"))
    logfile = logging.FileHandler(RUN_DIR / "xo-repair.log")
    logfile.setLevel(logging.DEBUG)
    logfile.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    log.addHandler(console)
    log.addHandler(logfile)


def parse_args(argv):
    parser = argparse.ArgumentParser(prog="xo-repair", description=__doc__)
    parser.add_argument("--mode", choices=MODES, help="overrides xenstore and the kernel command line")
    parser.add_argument("--service", action="store_true",
                        help="started by systemd: power off when done (unless keep-running is set)")
    parser.add_argument("--verbose", action="store_true")
    return parser.parse_args(argv)


def is_true(value: str | None) -> bool:
    return value is not None and value.lower() in ("", "1", "true", "yes")


def execute(report: Report, mounts: Mounts, msi_patterns: list[str] | None, cleanup: str,
            nic_map: dict[str, str], windows_nics: dict[str, str], reboot: str = "guest") -> None:
    readonly = report.mode != "repair"
    report.firmware = efi.firmware()
    activation_failures = activate_storage(readonly)
    devices = list_block_devices()
    disks = guest_disks(devices)
    report.disks = [d.name for d in disks]
    if not disks:
        report.error("no_disk", "the VM has no disk")
        return

    tools = find_tools(devices, mounts, report)
    candidates = probe(devices, mounts, report)
    if not candidates:
        # the OS may be on RAID or LVM which could not be activated
        for failure in activation_failures:
            report.warning("storage_activation_failed", failure)
        report.error("no_os_found", "no Linux or Windows installation found on the disks")
        return
    if len(candidates) > 1:
        roots = [c.device.path for c in candidates]
        report.error("multiple_os", "several operating systems found: " + ", ".join(roots), roots=roots)
        return
    candidate = candidates[0]
    disk = next((d for d in disks if d.name == candidate.device.disk), disks[0])
    if disk.name != disks[0].name:
        # the firmware boots the first disk: the VM would not boot. Blocking, so
        # that nothing is modified until XO puts the OS disk at userdevice 0.
        report.error("boot_disk_not_first",
                     f"the OS is on {disk.name}, not on the first disk ({disks[0].name}): "
                     "move its VBD to userdevice 0 and run again", os_disk=disk.name, first_disk=disks[0].name)

    if candidate.kind == "linux":
        guest = LinuxGuest(candidate, devices, disks, mounts, report, readonly, nic_map, tools)
    else:
        guest = WindowsGuest(candidate, mounts, report, readonly, msi_patterns, cleanup, tools, windows_nics,
                             reboot=reboot)
    try:
        guest.inspect()
        if not report.blocked:
            efi.plan(report, mounts, devices, disk, guest.kind, guest.os_ids, readonly)
            guest.finalize()
        if report.mode == "repair":
            if report.blocked:
                report.info("repair_skipped", "blocking errors found: nothing was modified")
            else:
                report.apply_actions()
                try:
                    guest.write_report(report)
                except OSError as exc:
                    report.warning("guest_report_failed", f"cannot write the report in the guest: {exc}")
    finally:
        guest.close()


def main(argv=None) -> int:
    args = parse_args(argv)
    setup_logging(args.verbose)
    xenstore = Xenstore.detect()

    mode = args.mode or xenstore.config("mode") or kernel_cmdline_param("xo-repair.mode") or "diagnose"
    # ";"-separated, installed in this order (e.g. drivers then management agent)
    # None: default patterns, which depend on the Windows build
    given_patterns = xenstore.config("windows-msi-patterns")
    msi_patterns = [p for p in given_patterns.split(";") if p] if given_patterns else None
    cleanup = xenstore.config("windows-cleanup") or "standard"
    # "xo": the first boot stops the VM between its phases, XO starts it again
    reboot = xenstore.config("windows-reboot") or "guest"
    # old Linux interface name -> MAC, needed when the VM has several NICs
    nic_map = parse_nic_map(xenstore.config("nics"))
    # Windows: VIF MAC -> GUID of the old adapter whose static configuration it gets
    windows_nics = parse_windows_nics(xenstore.config("windows-nics"))
    keep_running = is_true(xenstore.config("keep-running")) or kernel_cmdline_param("xo-repair.keep-running") is not None

    report = Report(mode, read_version())
    xenstore.clear_status()
    xenstore.status("version", report.version)
    xenstore.status("mode", mode)
    xenstore.status("state", "running")
    log.info("xo-repair %s, mode %s", report.version, mode)

    try:
        if mode not in MODES:
            raise RepairError("invalid_mode", f"unknown mode {mode!r}, expected one of {', '.join(MODES)}")
        with Mounts(RUN_DIR / "mnt") as mounts:
            execute(report, mounts, msi_patterns, cleanup, nic_map, windows_nics, reboot)
    except RepairError as exc:
        report.error(exc.code, str(exc))
    except Exception as exc:  # noqa: BLE001 - XO must always get a result
        log.exception("unexpected error")
        report.error("internal_error", f"{type(exc).__name__}: {exc}")

    result = report.result()
    (RUN_DIR / "report.json").write_text(report.full_json())
    firstboot = report.os.get("firstboot")
    if firstboot and mode == "diagnose":
        # state of a previous Windows first boot, which could not send it itself
        xenstore.status("firstboot", firstboot)
    xenstore.status("report", report.compact_json())
    xenstore.status("result", result)
    xenstore.status("state", "done")  # written last: XO can rely on the other keys
    log.info("result: %s", result)

    if args.service and not keep_running:
        run(["systemctl", "poweroff", "--no-block"], check=False)
    return 1 if result == "error" else 0


if __name__ == "__main__":
    sys.exit(main())
