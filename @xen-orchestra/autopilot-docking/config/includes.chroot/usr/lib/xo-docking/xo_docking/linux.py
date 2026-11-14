"""Linux guests: inspection and docking planning.

Everything that touches the guest runs the guest's own tools through chroot
(dracut, update-initramfs, mkinitcpio); the live system's Python only reads
and edits files.
"""

from __future__ import annotations

import contextlib
import fnmatch
import logging
import os
import re
import shutil
import tarfile
from dataclasses import dataclass
from pathlib import Path

from .blockdev import BlockDev
from .detect import OsCandidate
from .mounts import Mounts
from .report import Report
from .util import DockingError, chroot_run, find_ci, guest_exists, guest_read, resolve_in_root, run

log = logging.getLogger("xo-docking")

# xen-blkfront is critical: a PVHVM kernel unplugs the emulated disks at boot
# whenever it is built with blkfront support, even as a module. If the module
# is not in the initramfs, the root disk disappears.
XEN_MODULES = ("xen-blkfront", "xen-netfront")
# fallback for kernels without Xen support: QEMU's emulated IDE controller
EMULATED_MODULES = ("ata_piix", "ata_generic", "sd_mod")
WANTED_MODULES = XEN_MODULES + EMULATED_MODULES

VMWARE_UNITS = (
    "vmtoolsd.service",
    "open-vm-tools.service",
    "vgauth.service",
    "vgauthd.service",  # SUSE and RHEL name of vgauth.service
    "vmware-tools.service",
    "vmware-tools-thinprint.service",
)
UNIT_DIRS = ("/etc/systemd/system", "/usr/lib/systemd/system", "/lib/systemd/system")

SKIPPED_FSTYPES = {
    "swap", "nfs", "nfs4", "cifs", "smb3", "smbfs", "tmpfs", "proc", "sysfs", "devpts",
    "devtmpfs", "none", "iso9660", "udf", "fuse", "glusterfs", "ceph", "9p", "virtiofs",
}
ESSENTIAL_MOUNTPOINTS = {"/boot", "/usr"}

# by-id names derived from the content (LVM, MD, device-mapper UUIDs) survive the
# migration; the hardware ones (scsi-, wwn-, ata-...) do not
STABLE_BY_ID_PREFIXES = ("dm-uuid-", "dm-name-", "lvm-pv-uuid-", "md-uuid-", "md-name-")
UNSTABLE_SPEC_RE = re.compile(
    r"^/dev/(sd[a-z]+\d*|hd[a-z]+\d*|disk/by-path/.+|disk/by-id/(?!" + "|".join(STABLE_BY_ID_PREFIXES) + r").+)$")
SD_SPEC_RE = re.compile(r"^/dev/(?:sd|hd)([a-z]+)(\d*)$")
BY_NAME_SPEC_RE = re.compile(r"^/dev/disk/(by-id|by-path)/(.+?)(?:-part(\d+))?$")
UNSTABLE_RESUME_RE = re.compile(r"\bresume=(/dev/(?:sd|hd)[a-z]+\d*|/dev/disk/by-(?:id|path)/[^\s\"']+)")
# kdump initrds built on VMware lack xen-blkfront and the guest does not rebuild
# them after the migration: the capture kernel then cannot find the disk.
# Deleting them is enough: SUSE's kdump.service (mkdumprd) and the RHEL
# family's kdumpctl regenerate a missing initrd when kdump starts.
SUSE_KDUMP_INITRD = "/var/lib/kdump/initrd"
RHEL_KDUMP_IMAGE_GLOB = "initramfs-*kdump.img"
IFACE_RE = re.compile(r"\b(eth\d+|ens\d+|eno\d+|enp\d+s\d+(?:f\d+)?)\b")
# kernel names: unchanged on XCP-ng (net.ifnames=0), and reserved for the kernel
KERNEL_IFACE_RE = re.compile(r"^eth\d+$")
MAC_RE = re.compile(r"^[0-9a-f]{2}(:[0-9a-f]{2}){5}$")
UDEVD_PATHS = ("/usr/lib/systemd/systemd-udevd", "/lib/systemd/systemd-udevd")

# xe-guest-utilities (XCP-ng Linux guest tools) or the newer xen-guest-agent
AGENT_PATHS = ("/usr/sbin/xe-daemon", "/usr/bin/xe-daemon",
               "/usr/sbin/xen-guest-agent", "/usr/bin/xen-guest-agent")
AGENT_SERVICE = "xe-linux-distribution"
SYSTEMD_PATHS = ("/usr/lib/systemd/systemd", "/lib/systemd/systemd")
DEB_ARCHES = {"x86_64": "amd64", "i386": "i386"}
TGZ_ARCHES = {"x86_64": "x86_64", "i386": "386"}
# systemd unit shipped next to the packages, for the generic tgz (which only has an init script)
AGENT_UNIT_FILE = f"{AGENT_SERVICE}.service"
# ELF e_machine -> architecture name used by the guest tools packages
ELF_MACHINES = {0x3E: "x86_64", 0x03: "i386"}
POLICY_RC_D = "/usr/sbin/policy-rc.d"
TRANSACTIONAL_UPDATE = "/usr/sbin/transactional-update"
STAGING_DIR = "/tmp/xo-docking"

MARKER = "# added by xo-docking"


# -- pure helpers (unit tested) --------------------------------------------

@dataclass
class FstabEntry:
    lineno: int
    spec: str
    mountpoint: str
    fstype: str
    options: str


def parse_os_release(text: str) -> dict:
    values = {}
    for line in text.splitlines():
        key, sep, value = line.strip().partition("=")
        if sep and key and not key.startswith("#"):
            values[key] = value.strip().strip('"').strip("'")
    return values


def parse_fstab(text: str) -> list[FstabEntry]:
    entries = []
    for lineno, line in enumerate(text.splitlines(), start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        fields = stripped.split()
        if len(fields) < 3:
            continue
        options = fields[3] if len(fields) > 3 else "defaults"
        entries.append(FstabEntry(lineno, fields[0], fields[1], fields[2], options))
    return entries


def mountable_entries(entries: list[FstabEntry]) -> list[FstabEntry]:
    """Entries to mount under the guest root, parents first.

    `noauto` entries are skipped: they are mounted on demand (CD drives,
    removable disks, network shares) and may designate the docking CD itself.
    The fstype field can be a list ("udf,iso9660").
    """
    mountable = []
    for e in entries:
        options = e.options.split(",")
        if not e.mountpoint.startswith("/") or e.mountpoint == "/":
            continue
        if "noauto" in options or "bind" in options:
            continue
        if any(t in SKIPPED_FSTYPES for t in e.fstype.split(",")):
            continue
        mountable.append(e)
    return sorted(mountable, key=lambda e: e.mountpoint.count("/"))


def is_unstable_spec(spec: str) -> bool:
    return bool(UNSTABLE_SPEC_RE.match(spec))


def _letters_to_index(letters: str) -> int:
    index = 0
    for char in letters:
        index = index * 26 + (ord(char) - ord("a") + 1)
    return index - 1


def map_sd_spec(spec: str, disks: list[BlockDev], devices: list[BlockDev]) -> BlockDev | None:
    """Map /dev/sdXN (VMware naming) to the device it designates now.

    Assumes XO kept the disk order: the n-th VMware disk is the n-th disk here.
    """
    match = SD_SPEC_RE.match(spec)
    if not match:
        return None
    index = _letters_to_index(match.group(1))
    if index >= len(disks):
        return None
    disk = disks[index]
    if not match.group(2):
        return disk
    number = int(match.group(2))
    return next(
        (d for d in devices
         if d.type == "part" and d.parent == disk.name and d.partition_number() == number),
        None,
    )


def map_by_name_spec(spec: str, anchor_spec: str | None, anchor: BlockDev | None,
                     devices: list[BlockDev]) -> BlockDev | None:
    """Map a /dev/disk/by-id or by-path name relative to a known entry (the root fs).

    VMware ids and paths do not exist on XCP-ng, but the partitions of a disk
    share its base name (`<base>-partN`): once the device of the anchor is known,
    the other partitions of the same disk follow. Other disks stay unresolved.
    """
    match = BY_NAME_SPEC_RE.match(spec)
    anchor_match = BY_NAME_SPEC_RE.match(anchor_spec or "")
    if anchor is None or not match or not anchor_match or not anchor_match.group(3):
        return None
    if match.group(1, 2) != anchor_match.group(1, 2):
        return None
    if anchor.partition_number() != int(anchor_match.group(3)):
        return None  # the anchor is not the partition its name says
    disk = anchor.parent
    if not match.group(3):
        return next((d for d in devices if d.name == disk), None)
    number = int(match.group(3))
    return next(
        (d for d in devices if d.type == "part" and d.parent == disk and d.partition_number() == number),
        None,
    )


def unstable_resume(text: str) -> str | None:
    """resume= device of /etc/default/grub that will not exist on XCP-ng."""
    match = UNSTABLE_RESUME_RE.search(text)
    return match.group(1) if match else None


def stale_kdump_initrds(root: Path) -> list[str]:
    """kdump initrd of SUSE, rebuilt by kdump.service once deleted."""
    return [SUSE_KDUMP_INITRD] if resolve_in_root(root, SUSE_KDUMP_INITRD).is_file() else []


def rhel_kdump_images(root: Path) -> list[str]:
    boot = resolve_in_root(root, "/boot")
    return sorted(f"/boot/{p.name}" for p in boot.glob(RHEL_KDUMP_IMAGE_GLOB)) if boot.is_dir() else []


def rewrite_fstab(text: str, replacements: dict[int, str]) -> str:
    """Replace the first field of the given lines, keeping the rest untouched."""
    lines = text.splitlines(keepends=True)
    for lineno, spec in replacements.items():
        match = re.match(r"^(\s*)(\S+)(.*)$", lines[lineno - 1], re.S)
        lines[lineno - 1] = match.group(1) + spec + match.group(3)
    return "".join(lines)


def detect_initramfs_tool(root: Path) -> str | None:
    tools = (
        ("initramfs-tools", ("/usr/sbin/update-initramfs", "/sbin/update-initramfs")),
        ("dracut", ("/usr/bin/dracut", "/usr/sbin/dracut", "/sbin/dracut")),
        ("mkinitcpio", ("/usr/bin/mkinitcpio",)),
    )
    for name, paths in tools:
        if any(guest_exists(root, p) for p in paths):
            return name
    return None


def kernel_versions(root: Path) -> list[str]:
    moddir = resolve_in_root(root, "/lib/modules")
    if not moddir.is_dir():
        return []
    boot = resolve_in_root(root, "/boot")
    versions = []
    for entry in sorted(moddir.iterdir()):
        if not (entry / "modules.dep").is_file():
            continue
        if (boot / f"vmlinuz-{entry.name}").exists() or (entry / "vmlinuz").exists():
            versions.append(entry.name)
    return versions


def _canonical(module: str) -> str:
    return module.replace("-", "_")


def available_modules(root: Path, kver: str, wanted=WANTED_MODULES) -> list[str]:
    """Modules from `wanted` that exist (loadable or built-in) for this kernel."""
    moddir = resolve_in_root(root, f"/lib/modules/{kver}")
    names = set()
    for filename in ("modules.dep", "modules.builtin"):
        path = moddir / filename
        if not path.is_file():
            continue
        for line in path.read_text(errors="replace").splitlines():
            base = line.split(":", 1)[0].strip().rsplit("/", 1)[-1]
            base = re.sub(r"\.ko(\.(xz|gz|zst))?$", "", base)
            if base:
                names.add(_canonical(base))
    return [m for m in wanted if _canonical(m) in names]


def readonly_root(root: Path, fstype: str | None, entries: list[FstabEntry]) -> bool:
    """Root of a transactional system (SL Micro...): a read-only btrfs snapshot.

    Such a root is only changed through transactional-update, never offline.
    """
    if fstype == "btrfs":
        try:
            proc = run(["btrfs", "property", "get", "-ts", str(root), "ro"], check=False)
            if proc.stdout.strip() == "ro=true":
                return True
        except DockingError:
            pass  # no btrfs-progs: fall back to fstab
    root_entry = next((e for e in entries if e.mountpoint == "/"), None)
    return (root_entry is not None and "ro" in root_entry.options.split(",")
            and guest_exists(root, TRANSACTIONAL_UPDATE))


def initramfs_files(image: Path) -> list[str]:
    """Paths inside an initramfs (early cpio and compressed main archive), [] if unreadable."""
    try:
        proc = run(["lsinitramfs", str(image)], check=False, timeout=300)
    except DockingError:
        return []
    return proc.stdout.splitlines() if proc.returncode == 0 else []


def missing_initramfs_modules(files: list[str], modules) -> list[str]:
    """`modules` without a .ko file in the initramfs listing."""
    present = {_canonical(re.sub(r"\.ko(\.(xz|gz|zst))?$", "", f.rsplit("/", 1)[-1]))
               for f in files if re.search(r"\.ko(\.(xz|gz|zst))?$", f)}
    return [m for m in modules if _canonical(m) not in present]


def initramfs_image(root: Path, kver: str) -> str | None:
    boot = resolve_in_root(root, "/boot")
    for name in (f"initramfs-{kver}.img", f"initrd.img-{kver}", f"initrd-{kver}"):
        if (boot / name).exists():
            return f"/boot/{name}"
    return None


def interface_names(root: Path) -> list[str]:
    """Interface names referenced by the network configuration."""
    patterns = (
        "/etc/network/interfaces", "/etc/network/interfaces.d/*", "/etc/netplan/*.yaml",
        "/etc/NetworkManager/system-connections/*", "/etc/sysconfig/network-scripts/ifcfg-*",
        "/etc/sysconfig/network/ifcfg-*", "/etc/systemd/network/*.network",
    )
    names = set()
    for pattern in patterns:
        directory, _, glob = pattern.rpartition("/")
        base = resolve_in_root(root, directory)
        if not base.is_dir():
            continue
        for path in base.glob(glob):
            if not path.is_file():
                continue
            names.update(IFACE_RE.findall(path.name))
            try:
                names.update(IFACE_RE.findall(path.read_text(errors="replace")))
            except OSError:
                continue
    return sorted(names)


def parse_nic_map(value: str | None) -> dict[str, str]:
    """"ens192=00:0c:29:aa:bb:cc;ens224=..." -> {name: mac}, invalid entries dropped."""
    result = {}
    for item in (value or "").split(";"):
        name, sep, mac = item.strip().partition("=")
        mac = mac.strip().lower().replace("-", ":")
        if sep and name.strip() and MAC_RE.match(mac):
            result[name.strip()] = mac
    return result


def live_nics(sys_net: Path = Path("/sys/class/net")) -> dict[str, tuple[str, str]]:
    """Physical NICs of the running VM: {name: (mac, driver)}.

    The VIFs keep the MACs of the VMware NICs, so they identify the old names.
    """
    nics = {}
    if not sys_net.is_dir():
        return nics
    for path in sorted(sys_net.iterdir()):
        driver = path / "device" / "driver"
        if not driver.exists():
            continue  # lo, bridges, bonds, vlans
        try:
            mac = (path / "address").read_text().strip().lower()
        except OSError:
            continue
        nics[path.name] = (mac, os.path.basename(os.readlink(driver)))
    return nics


def pin_interface_names(names: list[str], nics: dict[str, tuple[str, str]],
                        given: dict[str, str]) -> tuple[dict[str, tuple[str, str]], list[str]]:
    """Map the old interface names to (mac, driver), from XO's map or a single NIC.

    Returns the pinned names and the names left unresolved.
    """
    drivers = {mac: driver for mac, driver in nics.values()}
    pinned, unresolved = {}, []
    candidates = [n for n in names if not KERNEL_IFACE_RE.match(n)]
    for name in candidates:
        if name in given:
            pinned[name] = (given[name], drivers.get(given[name], ""))
    rest = [n for n in candidates if n not in pinned]
    if len(rest) == 1 and len(nics) == 1 and not given:
        pinned[rest[0]] = next(iter(nics.values()))
    else:
        unresolved = rest
    return pinned, unresolved


def link_file(name: str, mac: str, driver: str) -> str:
    """systemd .link pinning `name` on the NIC with this MAC.

    The driver match keeps VLANs (which inherit the MAC) out of it.
    """
    match = f"MACAddress={mac}\n" + (f"Driver={driver}\n" if driver else "")
    return f"{MARKER}\n[Match]\n{match}\n[Link]\nName={name}\n"


def disable_units(root: Path, units) -> list[str]:
    """Remove the enablement symlinks of `units`, like `systemctl disable`.

    Done by hand because the live system's systemctl ignores /lib/systemd/system
    (split-/usr guests) and may not understand an older guest's layout.
    Masks (symlinks to /dev/null) are left alone.
    """
    etc = resolve_in_root(root, "/etc/systemd/system")
    if not etc.is_dir():
        return []
    removed = []
    for link in sorted([*etc.glob("*.wants/*"), *etc.glob("*.requires/*"), *etc.glob("*")]):
        if not link.is_symlink():
            continue
        target = os.readlink(link)
        if target == "/dev/null":
            continue
        if link.name in units or Path(target).name in units:
            link.unlink()
            removed.append(str(link.relative_to(etc)))
    return removed


def guest_arch(root: Path) -> str | None:
    """Architecture of the guest userland, from the ELF header of /bin/sh."""
    try:
        with resolve_in_root(root, "/bin/sh").open("rb") as handle:
            header = handle.read(20)
    except OSError:
        return None
    if len(header) < 20 or header[:4] != b"\x7fELF":
        return None
    order = "little" if header[5] == 1 else "big"
    return ELF_MACHINES.get(int.from_bytes(header[18:20], order))


def package_manager(root: Path) -> str | None:
    """dpkg first: Debian guests can have the rpm tool installed too."""
    if any(guest_exists(root, p) for p in ("/usr/bin/dpkg", "/bin/dpkg")):
        return "dpkg"
    if any(guest_exists(root, p) for p in ("/usr/bin/rpm", "/bin/rpm")):
        return "rpm"
    return None


def has_systemd(root: Path) -> bool:
    return any(guest_exists(root, p) for p in SYSTEMD_PATHS)


def select_agent_package(names: list[str], manager: str, arch: str, systemd: bool) -> str | None:
    """xe-guest-utilities package of the guest tools ISO for this guest.

    Same choice as the ISO's install.sh: the "legacy" rpm (chkconfig) is for
    guests without systemd. "tgz" is the generic tarball, for systemd guests
    with neither dpkg nor rpm (Arch...); it needs the unit file of the ISO.
    """
    if manager == "dpkg":
        if arch not in DEB_ARCHES:
            return None
        matches = [n for n in names if fnmatch.fnmatch(n, f"xe-guest-utilities_*_{DEB_ARCHES[arch]}.deb")]
    elif manager == "rpm":
        legacy = [n for n in names if fnmatch.fnmatch(n, f"xe-guest-utilities-*.legacy.{arch}.rpm")]
        standard = [n for n in names
                    if fnmatch.fnmatch(n, f"xe-guest-utilities-*.{arch}.rpm") and n not in legacy]
        matches = standard if systemd else legacy
    elif manager == "tgz":
        if not systemd or arch not in TGZ_ARCHES or AGENT_UNIT_FILE not in names:
            return None
        matches = [n for n in names if fnmatch.fnmatch(n, f"xe-guest-utilities_*_{TGZ_ARCHES[arch]}.tgz")]
    else:
        return None
    return sorted(matches)[-1] if matches else None


def extract_agent_tgz(root: Path, tgz: Path) -> list[str]:
    """Extract the files and symlinks of the generic tarball under the guest root.

    Paths are resolved like the guest does (/usr/sbin -> usr/bin on merged-/usr
    guests). The SysV script is skipped: the systemd unit replaces it.
    """
    installed = []
    with tarfile.open(tgz) as archive:
        for member in archive.getmembers():
            name = member.name.removeprefix("./").lstrip("/")
            if member.isdir() or name.startswith("etc/init.d/") or ".." in name.split("/"):
                continue
            target = resolve_in_root(root, "/" + name)
            target.parent.mkdir(parents=True, exist_ok=True)
            if target.is_symlink() or target.exists():
                target.unlink()
            if member.issym():
                target.symlink_to(member.linkname)
            elif member.isfile():
                with archive.extractfile(member) as source, target.open("wb") as handle:
                    shutil.copyfileobj(source, handle)
                target.chmod(member.mode & 0o7777)
            else:
                continue
            installed.append("/" + name)
    return installed


def enable_unit(root: Path, unit: str, target: str = "multi-user.target") -> None:
    """`systemctl enable` for a unit installed in /etc/systemd/system."""
    wants = resolve_in_root(root, f"/etc/systemd/system/{target}.wants")
    wants.mkdir(parents=True, exist_ok=True)
    link = wants / unit
    if link.is_symlink() or link.exists():
        link.unlink()
    link.symlink_to(f"/etc/systemd/system/{unit}")


def agent_enabled(root: Path) -> bool:
    """The agent service starts at boot (systemd unit or SysV rc links)."""
    # the link itself: its absolute target does not resolve under `root`
    wants = resolve_in_root(root, "/etc/systemd/system/multi-user.target.wants") / f"{AGENT_SERVICE}.service"
    if wants.is_symlink():
        return True
    etc = resolve_in_root(root, "/etc")
    return any(etc.glob(f"rc[2-5].d/S*{AGENT_SERVICE}")) or any(etc.glob(f"rc.d/rc[2-5].d/S*{AGENT_SERVICE}"))


@contextlib.contextmanager
def services_not_started(root: Path):
    """policy-rc.d forbidding invoke-rc.d to start services from the chroot.

    In a chroot, invoke-rc.d does not see systemd and runs the init script:
    the daemon would start on the live system and keep the guest mounted.
    """
    policy = resolve_in_root(root, POLICY_RC_D)
    backup = policy.with_name(policy.name + ".xo-docking.bak")
    if policy.exists() or policy.is_symlink():
        policy.rename(backup)
    policy.write_text("#!/bin/sh\n" + MARKER + "\nexit 101\n")
    policy.chmod(0o755)
    try:
        yield
    finally:
        policy.unlink()
        if backup.exists() or backup.is_symlink():
            backup.rename(policy)


def selinux_enabled(root: Path) -> bool:
    text = guest_read(root, "/etc/selinux/config") or ""
    match = re.search(r"^\s*SELINUX\s*=\s*(\w+)", text, re.M)
    return bool(match) and match.group(1).lower() in ("enforcing", "permissive")


# -- guest -------------------------------------------------------------------

class LinuxGuest:
    kind = "linux"

    def __init__(self, candidate: OsCandidate, devices: list[BlockDev], disks: list[BlockDev],
                 mounts: Mounts, report: Report, readonly: bool, nic_map: dict[str, str] | None = None,
                 tools: Path | None = None):
        self.nic_map = nic_map or {}
        self.tools = tools  # mounted guest tools disk
        self.candidate = candidate
        self.devices = devices
        self.disks = disks
        self.mounts = mounts
        self.report = report
        self.readonly = readonly
        self.root: Path | None = None
        self.os_ids: list[str] = []
        self._root_spec: str | None = None  # fstab spec of /, anchor for by-id/by-path names
        self._chroot_ready = False
        self.readonly_root = False  # transactional system: nothing is written offline
        self._not_planned: list[str] = []  # actions a read-only root prevents

    # -- inspection --
    def inspect(self) -> None:
        dev = self.candidate.device
        options = [f"subvol={self.candidate.subvol}"] if self.candidate.subvol else []
        self.root = self.mounts.mount(dev.path, dev.fstype, readonly=self.readonly, options=options)

        info = parse_os_release(
            guest_read(self.root, "/etc/os-release") or guest_read(self.root, "/usr/lib/os-release") or ""
        )
        self.os_ids = [info.get("ID", "")] + info.get("ID_LIKE", "").split()
        self.report.os = {
            "kind": "linux",
            "name": info.get("PRETTY_NAME") or info.get("NAME") or "unknown Linux",
            "id": info.get("ID"),
            "version": info.get("VERSION_ID"),
            "root": dev.path,
        }

        fstab_text = guest_read(self.root, "/etc/fstab") or ""
        entries = parse_fstab(fstab_text)
        self._root_spec = next((e.spec for e in entries if e.mountpoint == "/"), None)
        self.readonly_root = readonly_root(self.root, dev.fstype, entries)
        if self.readonly_root:
            self.report.os["readonly_root"] = True
        self._mount_fstab(entries)
        self._plan_fstab(fstab_text, entries)
        self._plan_vmware_tools()
        self._plan_network()  # before the initramfs: the .link files are copied into it
        self._plan_initramfs()
        self._plan_kdump()
        self._check_grub_defaults()
        self._plan_guest_agent()
        if self._not_planned:
            self.report.warning("readonly_root",
                                "read-only root (transactional system), nothing is changed offline; "
                                "not done: " + ", ".join(self._not_planned)
                                + ". Do it after the first boot with transactional-update",
                                actions=self._not_planned)

    def finalize(self) -> None:
        """Planned last, once every other component has planned its actions."""
        if self.report.actions and selinux_enabled(self.root):
            self._plan("selinux_relabel",
                       "schedule a full SELinux relabel at next boot (one extra reboot)",
                       self._apply_selinux_relabel)

    def _plan(self, code: str, description: str, apply, *, critical: bool = True) -> None:
        """Plan an action writing to the guest root, unless the root is read-only."""
        if self.readonly_root:
            self._not_planned.append(code)
            return
        self.report.plan(code, description, apply, critical=critical)

    def close(self) -> None:
        pass

    def write_report(self, report: Report) -> None:
        target = resolve_in_root(self.root, "/var/log/xo-docking")
        target.mkdir(parents=True, exist_ok=True)
        (target / "report.json").write_text(report.full_json())
        log_file = Path("/run/xo-docking/xo-docking.log")
        if log_file.exists():
            shutil.copyfile(log_file, target / "xo-docking.log")

    # -- fstab --
    def _resolve_spec(self, spec: str) -> BlockDev | None:
        for prefix, attr in (("UUID=", "uuid"), ("LABEL=", "label"), ("PARTUUID=", "partuuid")):
            if spec.startswith(prefix):
                wanted = spec[len(prefix):].strip('"').lower()
                return next((d for d in self.devices if (getattr(d, attr) or "").lower() == wanted), None)
        if spec.startswith("/dev/disk/by-uuid/"):
            wanted = spec.rsplit("/", 1)[-1].lower()
            return next((d for d in self.devices if (d.uuid or "").lower() == wanted), None)
        mapped = self._map_unstable_spec(spec)
        if mapped:
            return mapped
        if spec.startswith("/dev/"):
            real = Path(spec).resolve()
            return next((d for d in self.devices if Path(d.path).resolve() == real), None)
        return None

    def _mount_fstab(self, entries: list[FstabEntry]) -> None:
        for entry in mountable_entries(entries):
            essential = entry.mountpoint in ESSENTIAL_MOUNTPOINTS
            dev = self._resolve_spec(entry.spec)
            # a symlink of the guest must not lead the mount out of its root
            target = resolve_in_root(self.root, entry.mountpoint)
            if dev is None or not target.is_dir():
                if essential:
                    self.report.error("fstab_mount_missing",
                                      f"cannot find the device for {entry.mountpoint} ({entry.spec})",
                                      mountpoint=entry.mountpoint)
                continue
            fstype = dev.fstype or entry.fstype
            extra = [o for o in entry.options.split(",") if o.startswith(("subvol=", "subvolid="))]
            try:
                self.mounts.mount(dev.path, fstype, target, readonly=self.readonly, options=extra)
            except DockingError as exc:
                if essential:
                    self.report.error("fstab_mount_failed", str(exc), mountpoint=entry.mountpoint)
                else:
                    self.report.warning("fstab_mount_failed", str(exc), mountpoint=entry.mountpoint)

    def _plan_fstab(self, text: str, entries: list[FstabEntry]) -> None:
        replacements: dict[int, str] = {}
        unresolved = []
        for entry in entries:
            if not is_unstable_spec(entry.spec):
                continue
            dev = self._map_unstable_spec(entry.spec)
            if dev is not None and dev.uuid:
                replacements[entry.lineno] = f"UUID={dev.uuid}"
            else:
                unresolved.append(entry.spec)
        if unresolved:
            self.report.warning("fstab_unstable_names",
                                "fstab uses device names that may change on XCP-ng: " + ", ".join(unresolved),
                                specs=unresolved)
        if not replacements:
            return
        new_text = rewrite_fstab(text, replacements)

        def apply() -> None:
            fstab = resolve_in_root(self.root, "/etc/fstab")
            shutil.copy2(fstab, fstab.with_name("fstab.xo-docking.bak"))
            # rewrite in place: keeps the inode, owner and SELinux label
            with fstab.open("w") as handle:
                handle.write(new_text)

        self._plan("fstab_stable_names",
                         f"replace {len(replacements)} /dev/sdX or by-id/by-path reference(s) in fstab "
                         "with UUIDs", apply)

    def _map_unstable_spec(self, spec: str) -> BlockDev | None:
        return (map_sd_spec(spec, self.disks, self.devices)
                or map_by_name_spec(spec, self._root_spec, self.candidate.device, self.devices))

    # -- VMware tools --
    def _plan_vmware_tools(self) -> None:
        units = [u for u in VMWARE_UNITS
                 if any(guest_exists(self.root, f"{d}/{u}") for d in UNIT_DIRS)]
        if not units:
            return

        def apply() -> None:
            removed = disable_units(self.root, units)
            log.info("removed unit links: %s", ", ".join(removed) or "none")

        self._plan("disable_vmware_tools", "disable " + ", ".join(units), apply, critical=False)

    # -- initramfs --
    def _plan_initramfs(self) -> None:
        tool = detect_initramfs_tool(self.root)
        kernels = kernel_versions(self.root)
        self.report.os["kernels"] = kernels
        self.report.os["initramfs"] = tool
        if not kernels:
            self.report.error("no_kernel_found", "no installed kernel found in /lib/modules")
            return
        modules = {k: available_modules(self.root, k) for k in kernels}
        without_blkfront = [k for k in kernels if "xen-blkfront" not in modules[k]]
        if without_blkfront:
            self.report.warning("no_xen_blkfront",
                                "kernel(s) without Xen PV disk driver, will boot on emulated IDE: "
                                + ", ".join(without_blkfront), kernels=without_blkfront)
        if self.readonly_root:
            self._check_readonly_initramfs(kernels, modules)
            return
        if tool is None:
            self.report.error("unsupported_initramfs_tool",
                              "no supported initramfs tool found (dracut, initramfs-tools, mkinitcpio)")
            return
        common = [m for m in WANTED_MODULES if all(m in modules[k] for k in kernels)]

        if tool == "dracut":
            def apply() -> None:
                self._prepare_chroot()
                for kver in kernels:
                    cmd = ["dracut", "--force", "--kver", kver]
                    if modules[kver]:
                        cmd += ["--add-drivers", " ".join(modules[kver])]
                    image = initramfs_image(self.root, kver)
                    if image:
                        cmd.append(image)
                    chroot_run(self.root, cmd)
        elif tool == "initramfs-tools":
            def apply() -> None:
                self._append_module_list("/etc/initramfs-tools/modules", common)
                self._prepare_chroot()
                chroot_run(self.root, ["update-initramfs", "-u", "-k", "all"])
        else:
            self.report.warning("mkinitcpio_experimental", "mkinitcpio support is experimental")

            def apply() -> None:
                dropin = resolve_in_root(self.root, "/etc/mkinitcpio.conf.d")
                dropin.mkdir(parents=True, exist_ok=True)
                (dropin / "90-xo-docking.conf").write_text(f"{MARKER}\nMODULES+=({' '.join(common)})\n")
                self._prepare_chroot()
                chroot_run(self.root, ["mkinitcpio", "-P"])

        self.report.plan("initramfs_xen_drivers",
                         f"rebuild the initramfs with {tool} including Xen and emulated disk drivers "
                         f"for {len(kernels)} kernel(s)", apply)

    def _check_readonly_initramfs(self, kernels: list[str], modules: dict[str, list[str]]) -> None:
        """A read-only root cannot be rebuilt offline: check the existing initramfs instead.

        Generic images (SL Micro...) ship an initramfs with every driver.
        """
        missing = {}
        for kver in kernels:
            wanted = [m for m in XEN_MODULES if m in modules[kver]]
            image = initramfs_image(self.root, kver)
            files = initramfs_files(resolve_in_root(self.root, image)) if image else []
            lacking = missing_initramfs_modules(files, wanted) if files else wanted
            if lacking:
                missing[kver] = lacking
        if not missing:
            self.report.info("initramfs_xen_drivers_present",
                             "the initramfs already has the Xen PV drivers for every kernel")
            return
        self.report.error("readonly_root_initramfs",
                          "read-only root: the initramfs of " + ", ".join(missing)
                          + " lacks the Xen PV drivers and cannot be rebuilt offline. On the source, add "
                          'add_drivers+=" xen-blkfront xen-netfront " to /etc/dracut.conf.d/xen.conf, run '
                          "transactional-update initrd and reboot, then migrate again", kernels=missing)

    # -- kdump --
    def _plan_kdump(self) -> None:
        stale = stale_kdump_initrds(self.root) + rhel_kdump_images(self.root)
        if not stale:
            return

        def apply() -> None:
            for path in stale:
                resolve_in_root(self.root, path).unlink()

        self._plan("kdump_initrd_rebuild",
                         "delete the kdump initrd built on VMware (" + ", ".join(stale)
                         + "), kdump rebuilds it at the next boot", apply, critical=False)

    def _append_module_list(self, path: str, modules: list[str]) -> None:
        target = resolve_in_root(self.root, path)
        current = target.read_text() if target.exists() else ""
        present = {line.strip() for line in current.splitlines()}
        missing = [m for m in modules if m not in present]
        if not missing:
            return
        if target.exists():
            shutil.copy2(target, target.with_name(target.name + ".xo-docking.bak"))
        with target.open("a") as handle:
            if current and not current.endswith("\n"):
                handle.write("\n")
            handle.write(MARKER + "\n" + "\n".join(missing) + "\n")

    def _prepare_chroot(self) -> None:
        if self._chroot_ready:
            return
        for source in ("/dev", "/dev/pts", "/proc", "/sys"):
            target = self.root / source.lstrip("/")
            if not target.is_dir():
                raise DockingError("chroot_setup_failed", f"{source} is missing in the guest root")
            self.mounts.bind(source, target)
        self._chroot_ready = True

    # -- network --
    def _plan_network(self) -> None:
        names = interface_names(self.root)
        if not names:
            return
        if any(guest_exists(self.root, p) for p in UDEVD_PATHS):
            pinned, unresolved = pin_interface_names(names, live_nics(), self.nic_map)
        else:
            pinned, unresolved = {}, [n for n in names if not KERNEL_IFACE_RE.match(n)]
        if unresolved:
            self.report.warning("linux_interface_names",
                                "network configuration references interface names that will change on "
                                "XCP-ng: " + ", ".join(unresolved), interfaces=unresolved)
        if not pinned:
            return

        def apply() -> None:
            directory = resolve_in_root(self.root, "/etc/systemd/network")
            directory.mkdir(parents=True, exist_ok=True)
            for name, (mac, driver) in pinned.items():
                (directory / f"10-xo-docking-{name}.link").write_text(link_file(name, mac, driver))

        self._plan("linux_pin_interface_names",
                         "keep the interface names " + ", ".join(f"{n} ({m})" for n, (m, _) in pinned.items())
                         + " with systemd .link files", apply, critical=False)

    # -- guest agent --
    def _plan_guest_agent(self) -> None:
        if any(guest_exists(self.root, p) for p in AGENT_PATHS):
            return
        if self.tools is None:
            self.report.info("guest_agent_missing",
                             "xe-guest-utilities is not installed and no guest tools disk is attached; "
                             "install it after the first boot")
            return
        arch = guest_arch(self.root)
        systemd = has_systemd(self.root)
        manager = package_manager(self.root) or ("tgz" if systemd else None)
        directory = find_ci(self.tools, "Linux")
        names = sorted(p.name for p in directory.iterdir()) if directory else []
        package = select_agent_package(names, manager, arch, systemd) if manager and arch else None
        if package is None:
            self.report.warning("guest_agent_unsupported",
                                "no xe-guest-utilities package on the guest tools disk for this guest "
                                f"({manager or 'neither dpkg, rpm nor systemd'}, {arch or 'unknown architecture'}); "
                                "install it after the first boot", manager=manager, arch=arch)
            return
        self.report.os["guest_agent"] = package

        def apply() -> None:
            self._install_agent(directory / package, manager, systemd)

        self._plan("install_guest_agent", f"install {package} from the guest tools disk",
                         apply, critical=False)

    def _install_agent(self, package: Path, manager: str, systemd: bool) -> None:
        if manager == "tgz":
            installed = extract_agent_tgz(self.root, package)
            log.info("installed from %s: %s", package.name, ", ".join(installed))
            unit = resolve_in_root(self.root, f"/etc/systemd/system/{AGENT_UNIT_FILE}")
            shutil.copyfile(package.with_name(AGENT_UNIT_FILE), unit)
            unit.chmod(0o644)
            enable_unit(self.root, AGENT_UNIT_FILE)
            return
        self._prepare_chroot()
        staging = resolve_in_root(self.root, STAGING_DIR)
        staging.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(package, staging / package.name)
        guest_path = f"{STAGING_DIR}/{package.name}"
        try:
            if manager == "dpkg":
                with services_not_started(self.root):
                    chroot_run(self.root, ["dpkg", "-i", guest_path])
            elif systemd:
                # the scriptlets enable the unit; systemctl does not start anything in a chroot
                chroot_run(self.root, ["rpm", "-U", "--replacepkgs", guest_path])
            else:
                # the legacy scriptlets would start the daemon on the live system
                chroot_run(self.root, ["rpm", "-U", "--replacepkgs", "--noscripts", guest_path])
                chroot_run(self.root, ["chkconfig", "--add", AGENT_SERVICE])
        finally:
            shutil.rmtree(staging, ignore_errors=True)
        if not agent_enabled(self.root) and systemd:
            chroot_run(self.root, ["systemctl", "enable", f"{AGENT_SERVICE}.service"])
        if not agent_enabled(self.root):
            raise DockingError("guest_agent_not_enabled", f"{AGENT_SERVICE} is installed but not enabled at boot")

    # -- checks only --

    def _check_grub_defaults(self) -> None:
        text = guest_read(self.root, "/etc/default/grub") or ""
        if re.search(r"root=/dev/(sd|hd)[a-z]", text):
            self.report.warning("grub_unstable_root", "/etc/default/grub sets root= with a /dev/sdX name")
        resume = unstable_resume(text)
        if resume:
            # the initramfs waits for this device at every boot
            self.report.warning("grub_unstable_resume",
                                f"/etc/default/grub sets resume={resume}, which will not exist on XCP-ng",
                                device=resume)

    def _apply_selinux_relabel(self) -> None:
        resolve_in_root(self.root, "/.autorelabel").touch()

