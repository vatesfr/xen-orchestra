"""Windows guests: inspection and repair planning.

Offline work covers what must happen before Windows can boot on XCP-ng, in
every control set (so "Last Known Good Configuration" stays bootable too):

- boot-start drivers for the emulated IDE controller;
- VMware services and drivers disabled (Start=4), found generically;
- static IP configuration of the old (VMware) adapters captured for XO, then
  cleared, so Windows does not refuse the same address on the new adapter.

Anything requiring a running Windows (Xen PV drivers, VMware Tools removal,
optional deep cleanup) is done by a first-boot script, in phases.
"""

from __future__ import annotations

import fnmatch
import logging
import re
import shutil
from pathlib import Path

from .detect import OsCandidate
from .hive import Hive
from .linux import MAC_RE, live_nics
from .mounts import Mounts
from .report import Report
from .util import RepairError, find_ci

log = logging.getLogger("xo-repair")

MIN_BUILD = 7601  # Windows 7 SP1 / Server 2008 R2 SP1
# XCP-ng 9.x PV drivers: Windows 10 1607 / Server 2016 and later (their MSI
# also needs .NET 4.x and fails with 1603 on older systems)
PV9_MIN_BUILD = 14393
DEFAULT_MSI_PATTERNS = ("*.msi",)
# QEMU emulates a PIIX IDE controller: these drivers must start at boot (Start=0)
IDE_SERVICES = ("atapi", "intelide", "pciide")
# installed by the PV drivers MSI: their presence means a first boot already ran
PV_DRIVER_SERVICES = ("xenbus", "xenvbd")

# Services and drivers installed by VMware Tools. Others are found by
# is_vmware_service(); this list only guarantees the usual ones are covered.
KNOWN_VMWARE_SERVICES = (
    # services
    "VMTools", "VGAuthService", "vm3dservice", "vmvss",
    "VMwareCAFCommAmqpListener", "VMwareCAFManagementAgentHost",
    # drivers
    "vmci", "vsock", "vmmemctl", "vmhgfs", "vmrawdsk", "vm3dmp", "vm3dmp_loader",
    "vm3dmp-debug", "vm3dmp-stats", "vmmouse", "vmusbmouse", "vmxnet3ndis6", "vmxnet3",
    "pvscsi", "vmkbd", "VMMemCtl",
)
TOOLS_PATH_MARKER = "\\vmware\\vmware tools\\"
SERVICE_KERNEL_DRIVER = 1
SERVICE_FS_DRIVER = 2

NET_CLASS = "{4d36e972-e325-11ce-bfc1-08002be10318}"  # Control\Class\<network adapters>
GUID_RE = re.compile(r"^\{[0-9a-fA-F-]{36}\}$")

FIRSTBOOT_SERVICE = "XoRepairFirstboot"
FIRSTBOOT_DIR = "xo-repair"  # at the root of the system volume
PACKAGES_DIR = "packages"  # under FIRSTBOOT_DIR: MSIs copied from the guest tools disk
FIRSTBOOT_IMAGE_PATH = (
    r'%SystemRoot%\System32\cmd.exe /c start "" '
    r"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe "
    r"-NoProfile -NonInteractive -ExecutionPolicy Bypass "
    rf"-File %SystemDrive%\{FIRSTBOOT_DIR}\firstboot.ps1"
)
CLEANUP_MODES = ("standard", "full")
# who restarts the VM between the phases of the first boot: the guest itself, or
# XO, which follows the first boot and starts the VM again once it has stopped
REBOOT_MODES = ("guest", "xo")
ASSETS = Path(__file__).resolve().parent / "assets" / "windows"


# -- pure helpers (unit tested) --------------------------------------------

def is_hibernated(system_volume: Path) -> bool:
    """hiberfil.sys starting with HIBR/RSTR holds a resumable session (or Fast Startup)."""
    hiberfil = find_ci(system_volume, "hiberfil.sys")
    if hiberfil is None:
        return False
    try:
        with hiberfil.open("rb") as handle:
            signature = handle.read(4).lower()
    except OSError:
        return False
    return signature in (b"hibr", b"rstr")


def windows_version(software: Hive) -> dict:
    node = software.node("Microsoft", "Windows NT", "CurrentVersion")
    if node is None:
        return {}
    build_text = software.string(node, "CurrentBuildNumber") or software.string(node, "CurrentBuild") or "0"
    build = int(build_text) if build_text.isdigit() else 0
    product = software.string(node, "ProductName") or "Windows"
    installation = software.string(node, "InstallationType") or ""
    # Windows 11 still reports "Windows 10" as ProductName
    if build >= 22000 and installation == "Client":
        product = product.replace("Windows 10", "Windows 11")
    return {
        "name": product,
        "build": build,
        "edition": software.string(node, "EditionID"),
        "installation_type": installation,
    }


def current_control_set(system: Hive) -> int:
    select = system.node("Select")
    number = system.dword(select, "Current") if select is not None else None
    node = system.node(f"ControlSet{number or 1:03d}")
    if node is None:
        raise RepairError("no_control_set", "cannot find the current control set in the SYSTEM hive")
    return node


def control_sets(system: Hive) -> list[int]:
    """Every ControlSetNNN (current, Last Known Good, failed...)."""
    return [node for name, node in system.children(system.root()) if re.fullmatch(r"ControlSet\d{3}", name, re.I)]


def services_of(system: Hive, control_set: int) -> int | None:
    return system.child(control_set, "Services")


def is_vmware_service(system: Hive, name: str, node: int) -> bool:
    """VMware Tools component? Conservative on purpose: security agents and
    other products from the VMware/Broadcom catalog must not be caught."""
    if name.lower() in {k.lower() for k in KNOWN_VMWARE_SERVICES}:
        return True
    image = (system.string(node, "ImagePath") or "").lower()
    if TOOLS_PATH_MARKER in image:
        return True
    if system.dword(node, "Type") not in (SERVICE_KERNEL_DRIVER, SERVICE_FS_DRIVER):
        return False
    label = " ".join(filter(None, (system.string(node, "DisplayName"), system.string(node, "Description"))))
    return "vmware" in label.lower() and (name.lower().startswith("vm") or "\\vm" in image)


def vmware_services(system: Hive, services: int) -> list[str]:
    """VMware components still enabled (Start != 4)."""
    found = []
    for name, node in system.children(services):
        if name == FIRSTBOOT_SERVICE or system.dword(node, "Start") == 4:
            continue
        if is_vmware_service(system, name, node):
            found.append(name)
    return sorted(found, key=str.lower)


def enable_boot_drivers(system: Hive, services: int, names=IDE_SERVICES) -> list[str]:
    changed = []
    for name in names:
        node = system.child(services, name)
        if node is None:
            continue
        system.set_dword(node, "Start", 0)
        # Windows 8+ can keep a per-boot-config override disabling the driver
        override = system.child(node, "StartOverride")
        if override is not None:
            system.delete_child(override)
        changed.append(name)
    return changed


def disable_services(system: Hive, services: int, names) -> list[str]:
    changed = []
    for name in names:
        node = system.child(services, name)
        if node is not None and system.dword(node, "Start") != 4:
            system.set_dword(node, "Start", 4)
            changed.append(name)
    return changed


def _child_path(system: Hive, node: int | None, *names: str) -> int | None:
    for name in names:
        if node is None:
            return None
        node = system.child(node, name)
    return node


def rtc_timeoffset(system: Hive, control_set: int) -> int | None:
    """Offset of the RTC from UTC, in seconds, as Windows expects it (XAPI platform:timeoffset).

    Windows keeps the RTC in local time, unless RealTimeIsUniversal is set.
    XCP-ng starts the RTC at UTC + platform:timeoffset (0 by default), so
    without it the clock is off by the time zone until time sync fixes it.
    ActiveTimeBias is UTC - local time, in minutes, at the last shutdown.
    """
    tz = _child_path(system, control_set, "Control", "TimeZoneInformation")
    if tz is None:
        return None
    if system.dword(tz, "RealTimeIsUniversal") == 1:
        return 0
    bias = system.dword(tz, "ActiveTimeBias")
    if bias is None:
        bias = system.dword(tz, "Bias")
    if bias is None:
        return None
    if bias >= 1 << 31:  # REG_DWORD holding a negative number
        bias -= 1 << 32
    return -bias * 60


def _split_dns(value: str | None) -> list[str]:
    return [v for v in re.split(r"[,\s]+", value or "") if v]


def network_adapters(system: Hive, control_set: int) -> list[dict]:
    """TCP/IP configuration of the physical (PCI) adapters, i.e. the VMware ones.

    After the migration every PCI adapter is new: the configurations found
    here all belong to adapters that no longer exist. Software adapters
    (loopback, VPN...) are left out.
    """
    adapters_class = _child_path(system, control_set, "Control", "Class", NET_CLASS)
    interfaces = _child_path(system, control_set, "Services", "Tcpip", "Parameters", "Interfaces")
    if adapters_class is None or interfaces is None:
        return []
    adapters = []
    for _, node in system.children(adapters_class):
        component = (system.string(node, "ComponentId") or "").lower()
        guid = system.string(node, "NetCfgInstanceId")
        if not component.startswith("pci\\") or not guid:
            continue
        config = system.child(interfaces, guid)
        if config is None:
            continue
        dhcp = system.dword(config, "EnableDHCP")
        addresses = [a for a in system.strings(config, "IPAddress") if a != "0.0.0.0"]
        masks = [m for m in system.strings(config, "SubnetMask") if m != "0.0.0.0"]
        adapters.append({
            "adapter": system.string(node, "DriverDesc") or component,
            "vmware": "ven_15ad" in component,
            "guid": guid,
            "dhcp": dhcp != 0,
            "addresses": addresses,
            "masks": masks,
            "gateways": system.strings(config, "DefaultGateway"),
            "dns": _split_dns(system.string(config, "NameServer")),
        })
    return adapters


def clear_static_config(system: Hive, control_set: int, guids) -> int:
    """Switch the old adapters to DHCP so their addresses can be reused."""
    interfaces = _child_path(system, control_set, "Services", "Tcpip", "Parameters", "Interfaces")
    if interfaces is None:
        return 0
    cleared = 0
    for guid in guids:
        config = system.child(interfaces, guid)
        if config is None:
            continue
        system.set_dword(config, "EnableDHCP", 1)
        system.set_strings(config, "IPAddress", ["0.0.0.0"])
        system.set_strings(config, "SubnetMask", ["0.0.0.0"])
        system.set_strings(config, "DefaultGateway", [])
        system.set_string(config, "NameServer", "")
        cleared += 1
    return cleared


def firstboot_state(directory: Path | None, log_lines: int = 5) -> dict | None:
    """State left by firstboot.ps1 in \\xo-repair\\, read offline.

    The first boot can only report through xenstore once the PV drivers are
    loaded: this is how XO learns why it did not finish.
    """
    if directory is None or not (directory / "firstboot.ps1").is_file():
        return None

    def read(name: str) -> str:
        path = find_ci(directory, name)
        try:
            return path.read_text(errors="replace").strip() if path else ""
        except OSError:
            return ""

    config = dict(re.findall(r"^\s*([^#=\s]+)\s*=\s*(.*?)\s*$", read("config.ini"), re.M))
    max_attempts = int(config.get("max_attempts", "3")) if config.get("max_attempts", "3").isdigit() else 3
    phase = read("phase") or "drivers"
    attempts = int(read("attempts")) if read("attempts").isdigit() else 0
    if phase == "done" or find_ci(directory, "firstboot.done"):
        status = "done"
    elif attempts == 0:
        status = f"{phase}:pending"  # never started, or a new phase not started yet
    elif attempts >= max_attempts:
        status = f"{phase}:failed"
    else:
        status = f"{phase}:error"
    log_tail = [line[:200] for line in read("firstboot.log").splitlines()[-log_lines:]]
    return {"status": status, "phase": phase, "attempts": attempts, "log": log_tail}


def pv_drivers_installed(system: Hive, services: int) -> bool:
    """The Xen PV storage drivers are installed and enabled."""
    nodes = [system.child(services, name) for name in PV_DRIVER_SERVICES]
    return all(node is not None and system.dword(node, "Start") != 4 for node in nodes)


def match_packages(files: list[str], patterns: list[str]) -> dict[str, str | None]:
    """First file (relative path, in sorted order) whose name matches each pattern.

    Case-insensitive, on the file name only, like Get-ChildItem -Filter in firstboot.ps1.
    """
    names = sorted(files, key=str.lower)
    return {
        pattern: next((f for f in names if fnmatch.fnmatch(f.rsplit("/", 1)[-1].lower(), pattern.lower())), None)
        for pattern in patterns
    }


def install_firstboot_service(system: Hive, services: int) -> None:
    node = system.add_child(services, FIRSTBOOT_SERVICE)
    system.set_dword(node, "Type", 0x10)  # own process
    system.set_dword(node, "Start", 2)  # automatic
    system.set_dword(node, "ErrorControl", 0)  # never block boot
    system.set_string(node, "ImagePath", FIRSTBOOT_IMAGE_PATH, expand=True)
    system.set_string(node, "DisplayName", "XO repair first boot")
    system.set_string(node, "Description", "Installs Xen PV drivers after a migration, then removes itself")
    system.set_string(node, "ObjectName", "LocalSystem")


def parse_windows_nics(value: str | None) -> dict[str, str]:
    """"00:0c:29:aa:bb:cc={GUID};..." -> {mac: guid}, invalid entries dropped.

    XO builds it by matching its vSphere capture (MAC, addresses) with the
    `network` of the report (GUID of the old adapter, addresses).
    """
    result = {}
    for item in (value or "").split(";"):
        mac, sep, guid = item.strip().partition("=")
        mac = mac.strip().lower().replace("-", ":")
        if sep and MAC_RE.match(mac) and GUID_RE.match(guid.strip()):
            result[mac] = guid.strip().lower()
    return result


def map_static_adapters(static: list[dict], live_macs: list[str],
                        given: dict[str, str]) -> tuple[list[tuple[str, dict]], list[dict]]:
    """Old adapters with a static address -> MAC of the VIF that replaces them.

    Automatic for a single static adapter on a VM with a single NIC; otherwise
    from XO's mapping. Returns the (mac, adapter) pairs and the unmapped adapters.
    """
    by_guid = {a["guid"].lower(): a for a in static}
    if given:
        mapped = [(mac, by_guid[guid]) for mac, guid in given.items() if guid in by_guid]
    elif len(static) == 1 and len(live_macs) == 1:
        mapped = [(live_macs[0], static[0])]
    else:
        mapped = []
    done = {id(adapter) for _, adapter in mapped}
    return mapped, [a for a in static if id(a) not in done]


def network_config(mapped: list[tuple[str, dict]]) -> bytes:
    """network.ini for firstboot.ps1: one adapter per line, mac|addresses|masks|gateways|dns."""
    lines = ["|".join([mac, ",".join(a["addresses"]), ",".join(a["masks"]),
                       ",".join(a["gateways"]), ",".join(a["dns"])]) for mac, a in mapped]
    return ("\r\n".join(lines) + "\r\n").encode("ascii")


def firstboot_msi_patterns(build: int, patterns: list[str] | None) -> list[str]:
    """Packages the first boot installs: none by default below PV9_MIN_BUILD, where the
    XCP-ng 9.x MSI fails and would stop the first boot before the static IP is reapplied."""
    if patterns is not None:
        return list(patterns)  # given by XO (windows-msi-patterns), e.g. older tools
    return [] if build < PV9_MIN_BUILD else list(DEFAULT_MSI_PATTERNS)


def firstboot_config(msi_patterns: list[str], cleanup: str, reboot: str = "guest", max_attempts: int = 3) -> bytes:
    lines = [
        f"msi_patterns={';'.join(msi_patterns)}",
        f"cleanup={cleanup}",
        f"reboot={reboot}",
        f"max_attempts={max_attempts}",
    ]
    return ("\r\n".join(lines) + "\r\n").encode("ascii")


# -- guest -------------------------------------------------------------------

class WindowsGuest:
    kind = "windows"

    def __init__(self, candidate: OsCandidate, mounts: Mounts, report: Report, readonly: bool,
                 msi_patterns: list[str] | None = None, cleanup: str = "standard", tools: Path | None = None,
                 windows_nics: dict[str, str] | None = None, live_macs: list[str] | None = None,
                 reboot: str = "guest"):
        self.windows_nics = windows_nics or {}
        # VIF MACs as the live system sees them: they are the MACs of the VMware NICs
        self.live_macs = live_macs if live_macs is not None else [mac for mac, _ in live_nics().values()]
        self.static_config: list[tuple[str, dict]] = []  # reapplied by the first boot
        self.candidate = candidate
        self.mounts = mounts
        self.report = report
        self.readonly = readonly
        self.given_msi_patterns = msi_patterns  # None: default, depends on the build
        self.msi_patterns = list(msi_patterns if msi_patterns is not None else DEFAULT_MSI_PATTERNS)
        self.cleanup = cleanup
        self.reboot = reboot
        self.tools = tools  # mounted guest tools disk
        self.packages: list[Path] = []  # copied into \xo-repair\packages\
        self.root: Path | None = None
        self.system: Hive | None = None
        self.system_path: Path | None = None
        self.os_ids = ["windows"]

    def inspect(self) -> None:
        if self.cleanup not in CLEANUP_MODES:
            self.report.error("invalid_cleanup_mode",
                              f"unknown cleanup mode {self.cleanup!r}, expected one of {', '.join(CLEANUP_MODES)}")
            return
        if self.reboot not in REBOOT_MODES:
            self.report.error("invalid_reboot_mode",
                              f"unknown reboot mode {self.reboot!r}, expected one of {', '.join(REBOOT_MODES)}")
            return
        dev = self.candidate.device
        self.root = self.mounts.mount(dev.path, "ntfs", readonly=self.readonly)
        if is_hibernated(self.root):
            self.report.error("windows_hibernated",
                              "Windows is hibernated or was stopped with Fast Startup; "
                              "do a full shutdown on the source (shutdown /s /f /t 0)")
            return
        config = find_ci(self.root, "Windows", "System32", "config")
        software_path = find_ci(config, "SOFTWARE")
        self.system_path = find_ci(config, "SYSTEM")

        software = Hive(software_path)
        try:
            version = windows_version(software)
        finally:
            software.close()
        self.report.os = {"kind": "windows", "root": dev.path, "cleanup": self.cleanup, **version}
        if version.get("build", 0) < MIN_BUILD:
            self.report.error("unsupported_windows_version",
                              f"Windows build {version.get('build')} is not supported "
                              f"(minimum {MIN_BUILD}, Windows 7 SP1 / Server 2008 R2 SP1)")
            return

        self.msi_patterns = firstboot_msi_patterns(version.get("build", 0), self.given_msi_patterns)
        if version.get("build", 0) < PV9_MIN_BUILD:
            self.report.warning("pv_drivers_unsupported",
                                f"the XCP-ng 9.x PV drivers need build {PV9_MIN_BUILD} or later "
                                "(Windows 10 1607 / Server 2016): the VM runs on emulated disk and NIC, "
                                "the first boot installs no PV driver unless windows-msi-patterns "
                                "points to older tools", build=version.get("build"), min_build=PV9_MIN_BUILD)
        self._check_firstboot()

        self.system = Hive(self.system_path, write=not self.readonly)
        current = current_control_set(self.system)
        self.control_sets = control_sets(self.system)
        self.report.os["control_sets"] = len(self.control_sets)
        self.report.os["rtc_timeoffset"] = rtc_timeoffset(self.system, current)

        self._plan_ide(current)
        self._plan_vmware(current)
        self._plan_network(current)
        self._plan_firstboot(current)
        self.report.plan("commit_registry", "back up then write the SYSTEM hive", self._commit)

    def finalize(self) -> None:
        pass

    def close(self) -> None:
        """Release the hive before the volume is unmounted."""
        if self.system is not None:
            self.system.close()

    def write_report(self, report: Report) -> None:
        target = self.root / FIRSTBOOT_DIR
        target.mkdir(exist_ok=True)
        (target / "report.json").write_text(report.full_json())
        log_file = Path("/run/xo-repair/xo-repair.log")
        if log_file.exists():
            shutil.copyfile(log_file, target / "xo-repair.log")

    # -- planning --
    def _for_each_services(self, function) -> None:
        for control_set in self.control_sets:
            services = services_of(self.system, control_set)
            if services is not None:
                function(services)

    def _plan_ide(self, current: int) -> None:
        services = services_of(self.system, current)
        present = [n for n in IDE_SERVICES if self.system.child(services, n) is not None]
        if not {"intelide", "pciide"} & set(present):
            self.report.error("no_ide_driver", "neither intelide nor pciide exists in this Windows")
            return
        self.report.plan("enable_ide_boot",
                         f"start {', '.join(present)} at boot (emulated IDE disk), "
                         f"in {len(self.control_sets)} control set(s)",
                         lambda: self._for_each_services(lambda s: enable_boot_drivers(self.system, s, present)))

    def _plan_vmware(self, current: int) -> None:
        names = vmware_services(self.system, services_of(self.system, current))
        self.report.os["vmware_services"] = names
        if names:
            self.report.plan("disable_vmware_services",
                             f"disable {len(names)} VMware service(s) and driver(s) in "
                             f"{len(self.control_sets)} control set(s): {', '.join(names)}",
                             lambda: self._for_each_services(lambda s: disable_services(self.system, s, names)),
                             critical=False)

    def _plan_network(self, current: int) -> None:
        adapters = network_adapters(self.system, current)
        self.report.network = adapters
        static = [a for a in adapters if not a["dhcp"] and a["addresses"]]
        if not static:
            return
        addresses = [ip for a in static for ip in a["addresses"]]
        self.report.warning("windows_static_ip",
                            "static IP configuration of the old adapter(s) captured in the report: "
                            + ", ".join(addresses), addresses=addresses)
        self.static_config, unmapped = map_static_adapters(static, self.live_macs, self.windows_nics)
        if unmapped:
            # XO reapplies them with VIF.configure_ipv4 once the agent is up (no DNS)
            self.report.warning("windows_static_ip_unmapped",
                                "no MAC for the old adapter(s) "
                                + ", ".join(ip for a in unmapped for ip in a["addresses"])
                                + ": pass windows-nics to have the first boot reapply them",
                                guids=[a["guid"] for a in unmapped])
        guids = [a["guid"] for a in static]

        def apply() -> None:
            for control_set in self.control_sets:
                clear_static_config(self.system, control_set, guids)

        self.report.plan("clear_old_static_ip",
                         f"switch {len(static)} old adapter(s) to DHCP so their addresses can be reused",
                         apply, critical=False)

    def _check_firstboot(self) -> None:
        """Report the state of a previous first boot (read before repair resets it)."""
        state = firstboot_state(find_ci(self.root, FIRSTBOOT_DIR))
        if state is None:
            return
        self.report.os["firstboot"] = state["status"]
        if state["status"] == "done":
            self.report.info("windows_firstboot_done", "the previous first boot finished", log=state["log"])
        else:
            self.report.warning("windows_firstboot_incomplete",
                                f"the previous first boot did not finish: {state['status']} "
                                f"after {state['attempts']} attempt(s)",
                                attempts=state["attempts"], log=state["log"])

    def _plan_firstboot(self, current: int) -> None:
        # repair run again on a migrated VM (XO retry): do not reinstall the drivers
        if (self.report.os.get("firstboot") == "done"
                and pv_drivers_installed(self.system, services_of(self.system, current))):
            self.report.info("windows_firstboot_already_done",
                             "a previous first boot installed the Xen PV drivers: it is not scheduled again")
            return
        patterns = ";".join(self.msi_patterns)
        if not self.msi_patterns:
            source = "none"
        elif self.tools is None:
            self.report.warning("windows_tools_disk_missing",
                                "no guest tools disk: the first boot will look for packages matching "
                                f"{patterns} on a CD drive")
            source = f"a CD matching {patterns}"
        else:
            files = [str(p.relative_to(self.tools)) for p in self.tools.rglob("*") if p.is_file()]
            matches = match_packages(files, self.msi_patterns)
            missing = [pattern for pattern, found in matches.items() if found is None]
            if missing:
                self.report.error("windows_msi_not_found",
                                  "no file matching " + ", ".join(missing) + " on the guest tools disk",
                                  patterns=missing)
            found = list(dict.fromkeys(f for f in matches.values() if f))
            self.packages = [self.tools / f for f in found]
            source = "the guest tools disk (" + ", ".join(p.name for p in self.packages) + ")"
        network = ""
        if self.static_config:
            network = ", static IP configuration of " + ", ".join(mac for mac, _ in self.static_config)
        self.report.plan("install_firstboot",
                         f"install the first-boot script ({self.cleanup} cleanup, {self.reboot} reboot, Xen PV drivers: {source}"
                         f"{network})", self._apply_firstboot)

    # -- apply --
    def _apply_firstboot(self) -> None:
        target = self.root / FIRSTBOOT_DIR
        target.mkdir(exist_ok=True)
        shutil.copyfile(ASSETS / "firstboot.ps1", target / "firstboot.ps1")
        (target / "config.ini").write_bytes(firstboot_config(self.msi_patterns, self.cleanup, self.reboot))
        network = target / "network.ini"
        if self.static_config:
            network.write_bytes(network_config(self.static_config))
        else:
            network.unlink(missing_ok=True)  # previous run of the ISO
        packages = target / PACKAGES_DIR
        shutil.rmtree(packages, ignore_errors=True)  # previous run of the ISO
        if self.packages:
            packages.mkdir()
            for package in self.packages:
                shutil.copyfile(package, packages / package.name)
        for stale in ("phase", "attempts", "firstboot.done"):
            (target / stale).unlink(missing_ok=True)  # previous run of the ISO
        self._for_each_services(lambda s: install_firstboot_service(self.system, s))

    def _commit(self) -> None:
        backup = self.system_path.with_name(self.system_path.name + ".xo-repair.bak")
        shutil.copyfile(self.system_path, backup)
        self.system.commit()
        self.system.close()
