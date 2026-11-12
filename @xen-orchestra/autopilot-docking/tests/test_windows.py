import tempfile
import unittest
from pathlib import Path

from helpers import make_tree, write_empty_hive

from xo_repair.efi import fallback_copies
from xo_repair.windows import (
    FIRSTBOOT_SERVICE, clear_static_config, control_sets, current_control_set, disable_services,
    enable_boot_drivers, firstboot_config, firstboot_msi_patterns, firstboot_state, install_firstboot_service, is_hibernated, match_packages,
    map_static_adapters, network_adapters, network_config, parse_windows_nics, pv_drivers_installed,
    rtc_timeoffset, vmware_services,
)

try:
    from xo_repair.hive import Hive
    import hivex  # noqa: F401  # pyflakes: availability check
    HAVE_HIVEX = True
except ImportError:
    HAVE_HIVEX = False


NET_CLASS = "{4d36e972-e325-11ce-bfc1-08002be10318}"
OLD_NIC = "{11111111-2222-3333-4444-555555555555}"
LOOPBACK = "{99999999-2222-3333-4444-555555555555}"


def build_control_set(hive, root, name):
    control_set = hive.add_child(root, name)
    services = hive.add_child(control_set, "Services")

    def service(service_name, start, **values):
        node = hive.add_child(services, service_name)
        hive.set_dword(node, "Start", start)
        for key, value in values.items():
            if isinstance(value, int):
                hive.set_dword(node, key, value)
            else:
                hive.set_string(node, key, value, expand=key == "ImagePath")
        return node

    intelide = service("intelide", 3)
    hive.add_child(intelide, "StartOverride")
    service("atapi", 3)
    service("VMTools", 2, ImagePath=r'"C:\Program Files\VMware\VMware Tools\vmtoolsd.exe"', Type=0x10)
    service("vmci", 0, Type=1, ImagePath=r"\SystemRoot\System32\drivers\vmci.sys")
    # unknown to the static list, found by the generic rule
    service("vmgencounter", 3, Type=1, DisplayName="VMware Generation Counter",
            ImagePath=r"\SystemRoot\System32\drivers\vmgencounter.sys")
    service("VMwareToolsNewThing", 2, Type=0x10,
            ImagePath=r"C:\Program Files\VMware\VMware Tools\new.exe")
    # must NOT be caught: security agent from the VMware/Broadcom catalog
    service("CbDefense", 2, Type=0x10, DisplayName="VMware Carbon Black Cloud Sensor",
            ImagePath=r"C:\Program Files\Confer\RepMgr.exe")
    service("vmdisabled", 4, Type=1, DisplayName="VMware already disabled")

    tz = hive.add_child(hive.add_child(control_set, "Control"), "TimeZoneInformation")
    hive.set_dword(tz, "Bias", 0xFFFFFFC4)  # -60: UTC+1
    hive.set_dword(tz, "ActiveTimeBias", 0xFFFFFF88)  # -120: UTC+2, summer time

    interfaces = hive.add_child(hive.add_child(hive.add_child(services, "Tcpip"), "Parameters"), "Interfaces")
    old = hive.add_child(interfaces, OLD_NIC)
    hive.set_dword(old, "EnableDHCP", 0)
    hive.set_strings(old, "IPAddress", ["192.168.1.10"])
    hive.set_strings(old, "SubnetMask", ["255.255.255.0"])
    hive.set_strings(old, "DefaultGateway", ["192.168.1.1"])
    hive.set_string(old, "NameServer", "192.168.1.53,192.168.1.54")
    loop = hive.add_child(interfaces, LOOPBACK)
    hive.set_dword(loop, "EnableDHCP", 0)
    hive.set_strings(loop, "IPAddress", ["10.9.9.9"])

    adapters = hive.add_child(hive.add_child(hive.add_child(control_set, "Control"), "Class"), NET_CLASS)
    nic = hive.add_child(adapters, "0007")
    hive.set_string(nic, "ComponentId", "PCI\\VEN_15AD&DEV_07B0&SUBSYS_07B015AD")
    hive.set_string(nic, "NetCfgInstanceId", OLD_NIC)
    hive.set_string(nic, "DriverDesc", "vmxnet3 Ethernet Adapter")
    software_nic = hive.add_child(adapters, "0008")
    hive.set_string(software_nic, "ComponentId", "*msloop")
    hive.set_string(software_nic, "NetCfgInstanceId", LOOPBACK)
    return control_set


@unittest.skipUnless(HAVE_HIVEX, "python3-hivex is not installed")
class SystemHiveTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = write_empty_hive(Path(self.tmp.name) / "SYSTEM")
        hive = Hive(self.path, write=True)
        root = hive.root()
        hive.set_dword(hive.add_child(root, "Select"), "Current", 2)
        build_control_set(hive, root, "ControlSet001")  # Last Known Good
        build_control_set(hive, root, "ControlSet002")  # current
        hive.add_child(root, "MountedDevices")
        hive.commit()
        hive.close()

    def tearDown(self):
        self.tmp.cleanup()

    def test_detection(self):
        hive = Hive(self.path)
        current = current_control_set(hive)
        self.assertEqual(hive._h.node_name(current), "ControlSet002")
        self.assertEqual(len(control_sets(hive)), 2)
        services = hive.child(current, "Services")
        self.assertEqual(vmware_services(hive, services),
                         ["vmci", "vmgencounter", "VMTools", "VMwareToolsNewThing"])
        adapters = network_adapters(hive, current)
        self.assertEqual(adapters, [{
            "adapter": "vmxnet3 Ethernet Adapter", "vmware": True, "guid": OLD_NIC, "dhcp": False,
            "addresses": ["192.168.1.10"], "masks": ["255.255.255.0"], "gateways": ["192.168.1.1"],
            "dns": ["192.168.1.53", "192.168.1.54"],
        }])
        self.assertEqual(rtc_timeoffset(hive, current), 7200)
        hive.close()

    def test_rtc_universal(self):
        hive = Hive(self.path, write=True)
        current = current_control_set(hive)
        tz = hive.node("ControlSet002", "Control", "TimeZoneInformation")
        hive.set_dword(tz, "RealTimeIsUniversal", 1)
        self.assertEqual(rtc_timeoffset(hive, current), 0)
        hive.close()

    def test_repair_applies_to_every_control_set(self):
        hive = Hive(self.path, write=True)
        services_current = hive.child(current_control_set(hive), "Services")
        names = vmware_services(hive, services_current)
        for control_set in control_sets(hive):
            services = hive.child(control_set, "Services")
            enable_boot_drivers(hive, services)
            disable_services(hive, services, names)
            clear_static_config(hive, control_set, [OLD_NIC])
            install_firstboot_service(hive, services)
        hive.commit()
        hive.close()

        hive = Hive(self.path)
        for control_set in control_sets(hive):
            services = hive.child(control_set, "Services")
            intelide = hive.child(services, "intelide")
            self.assertEqual(hive.dword(intelide, "Start"), 0)
            self.assertIsNone(hive.child(intelide, "StartOverride"))
            for name in names:
                self.assertEqual(hive.dword(hive.child(services, name), "Start"), 4, name)
            self.assertEqual(hive.dword(hive.child(services, "CbDefense"), "Start"), 2)
            firstboot = hive.child(services, FIRSTBOOT_SERVICE)
            self.assertEqual(hive.dword(firstboot, "Start"), 2)
            self.assertIn(r"\xo-repair\firstboot.ps1", hive.string(firstboot, "ImagePath"))
            self.assertEqual(network_adapters(hive, control_set)[0]["addresses"], [])
            self.assertTrue(network_adapters(hive, control_set)[0]["dhcp"])
        hive.close()

    def test_pv_drivers_installed(self):
        hive = Hive(self.path, write=True)
        services = hive.child(current_control_set(hive), "Services")
        self.assertFalse(pv_drivers_installed(hive, services))  # fresh from VMware
        for name in ("xenbus", "xenvbd"):
            hive.set_dword(hive.add_child(services, name), "Start", 0)
        self.assertTrue(pv_drivers_installed(hive, services))
        hive.set_dword(hive.child(services, "xenvbd"), "Start", 4)
        self.assertFalse(pv_drivers_installed(hive, services))
        hive.close()

    def test_firstboot_config(self):
        self.assertEqual(firstboot_config(["xen-*.msi", "managementagent-*.msi"], "full"),
                         b"msi_patterns=xen-*.msi;managementagent-*.msi\r\ncleanup=full\r\nreboot=guest\r\nmax_attempts=3\r\n")
        self.assertIn(b"\r\nreboot=xo\r\n", firstboot_config(["*.msi"], "standard", "xo"))


class FirstbootMsiPatternsTest(unittest.TestCase):
    def test_default_depends_on_build(self):
        self.assertEqual(firstboot_msi_patterns(20348, None), ["*.msi"])
        self.assertEqual(firstboot_msi_patterns(14393, None), ["*.msi"])
        # 9.x MSI unsupported: no package, so the first boot reaches the static IP phase
        self.assertEqual(firstboot_msi_patterns(9600, None), [])

    def test_given_patterns_always_used(self):
        self.assertEqual(firstboot_msi_patterns(9600, ["old-tools*.msi"]), ["old-tools*.msi"])
        self.assertEqual(firstboot_msi_patterns(20348, []), [])

    def test_empty_config(self):
        self.assertEqual(firstboot_config([], "standard"),
                         b"msi_patterns=\r\ncleanup=standard\r\nreboot=guest\r\nmax_attempts=3\r\n")


class StaticNetworkTest(unittest.TestCase):
    OLD = {"adapter": "vmxnet3 Ethernet Adapter", "vmware": True, "guid": "{44FED271-EE81-4363-8CF0-893542F0734F}",
           "dhcp": False, "addresses": ["192.168.1.246"], "masks": ["255.255.255.0"],
           "gateways": ["192.168.1.254"], "dns": ["192.168.1.254", "1.1.1.1"]}
    BACKEND = {"adapter": "vmxnet3 Ethernet Adapter #2", "vmware": True, "guid": "{55FED271-EE81-4363-8CF0-893542F0734F}",
               "dhcp": False, "addresses": ["10.0.0.5"], "masks": ["255.255.0.0"], "gateways": [], "dns": []}

    def test_parse_windows_nics(self):
        value = "00:0C:29:94:80:0D={44FED271-EE81-4363-8CF0-893542F0734F};bad=x;00-0c-29-94-80-17={55FED271-EE81-4363-8CF0-893542F0734F}"
        self.assertEqual(parse_windows_nics(value), {
            "00:0c:29:94:80:0d": "{44fed271-ee81-4363-8cf0-893542f0734f}",
            "00:0c:29:94:80:17": "{55fed271-ee81-4363-8cf0-893542f0734f}",
        })
        self.assertEqual(parse_windows_nics(None), {})

    def test_single_adapter_is_automatic(self):
        mapped, unmapped = map_static_adapters([self.OLD], ["00:0c:29:94:80:0d"], {})
        self.assertEqual(mapped, [("00:0c:29:94:80:0d", self.OLD)])
        self.assertEqual(unmapped, [])

    def test_several_adapters_need_xo_mapping(self):
        macs = ["00:0c:29:94:80:0d", "00:0c:29:94:80:17"]
        mapped, unmapped = map_static_adapters([self.OLD, self.BACKEND], macs, {})
        self.assertEqual((mapped, unmapped), ([], [self.OLD, self.BACKEND]))
        given = parse_windows_nics("00:0c:29:94:80:17={55FED271-EE81-4363-8CF0-893542F0734F}")
        mapped, unmapped = map_static_adapters([self.OLD, self.BACKEND], macs, given)
        self.assertEqual(mapped, [("00:0c:29:94:80:17", self.BACKEND)])
        self.assertEqual(unmapped, [self.OLD])

    def test_network_config(self):
        self.assertEqual(network_config([("00:0c:29:94:80:0d", self.OLD), ("00:0c:29:94:80:17", self.BACKEND)]),
                         b"00:0c:29:94:80:0d|192.168.1.246|255.255.255.0|192.168.1.254|192.168.1.254,1.1.1.1\r\n"
                         b"00:0c:29:94:80:17|10.0.0.5|255.255.0.0||\r\n")


class MatchPackagesTest(unittest.TestCase):
    # guest-tools-8.3-19.xcpng8.3.iso
    FILES = ["Linux/install.sh", "Windows/XenBootFix/XenBootFix.exe", "Windows/XenClean/XenClean.exe",
             "Windows/XenTools-x64.msi", "Windows/XenTools-fix-9.2.351.msp"]

    def test_default_pattern(self):
        self.assertEqual(match_packages(self.FILES, ["*.msi"]), {"*.msi": "Windows/XenTools-x64.msi"})

    def test_case_insensitive_on_the_name_only(self):
        self.assertEqual(match_packages(self.FILES, ["xentools-*.MSI", "windows*"]),
                         {"xentools-*.MSI": "Windows/XenTools-x64.msi", "windows*": None})

    def test_order_kept(self):
        files = ["b/managementagent-x64.msi", "a/xen-drivers.msi"]
        self.assertEqual(list(match_packages(files, ["xen-*.msi", "managementagent-*.msi"]).values()),
                         ["a/xen-drivers.msi", "b/managementagent-x64.msi"])


class FirstbootStateTest(unittest.TestCase):
    def state(self, files):
        with tempfile.TemporaryDirectory() as tmp:
            base = make_tree(Path(tmp), {"firstboot.ps1": "", "config.ini": "max_attempts = 3\n", **files})
            return firstboot_state(base)

    def test_not_installed(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.assertIsNone(firstboot_state(Path(tmp)))
        self.assertIsNone(firstboot_state(None))

    def test_states(self):
        self.assertEqual(self.state({})["status"], "drivers:pending")
        self.assertEqual(self.state({"phase": "drivers\n", "attempts": "1\n"})["status"], "drivers:error")
        self.assertEqual(self.state({"phase": "drivers", "attempts": "3"})["status"], "drivers:failed")
        self.assertEqual(self.state({"phase": "finish", "attempts": "1", "firstboot.done": "x"})["status"], "done")
        self.assertEqual(self.state({"phase": "done"})["status"], "done")

    def test_log_tail(self):
        log = "".join(f"line {i}\n" for i in range(10)) + "x" * 500 + "\n"
        state = self.state({"attempts": "1", "firstboot.log": log})
        self.assertEqual(state["log"][:4], ["line 6", "line 7", "line 8", "line 9"])
        self.assertEqual(len(state["log"][4]), 200)


class HibernationTest(unittest.TestCase):
    def test_signatures(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.assertFalse(is_hibernated(root))
            (root / "hiberfil.sys").write_bytes(b"HIBR" + bytes(60))
            self.assertTrue(is_hibernated(root))
            (root / "hiberfil.sys").write_bytes(b"wake" + bytes(60))
            self.assertFalse(is_hibernated(root))
            (root / "hiberfil.sys").write_bytes(bytes(64))
            self.assertFalse(is_hibernated(root))


class EfiFallbackTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.esp = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def names(self, copies):
        return sorted((source.relative_to(self.esp).as_posix(), target) for source, target in copies.items())

    def test_debian_without_removable_path(self):
        make_tree(self.esp, {
            "EFI/debian/shimx64.efi": "", "EFI/debian/grubx64.efi": "", "EFI/debian/mmx64.efi": "",
            "EFI/debian/grub.cfg": "", "EFI/ubuntu/grubx64.efi": "",
        })
        self.assertEqual(self.names(fallback_copies(self.esp / "EFI", "linux", ["debian"])), [
            ("EFI/debian/grub.cfg", "grub.cfg"), ("EFI/debian/grubx64.efi", "grubx64.efi"),
            ("EFI/debian/mmx64.efi", "mmx64.efi"), ("EFI/debian/shimx64.efi", "BOOTX64.EFI"),
        ])

    def test_rhel_vendor_alias(self):
        make_tree(self.esp, {"EFI/centos/grubx64.efi": "", "EFI/redhat/shimx64.efi": ""})
        copies = fallback_copies(self.esp / "EFI", "linux", ["rhel", "fedora"])
        self.assertEqual(self.names(copies), [("EFI/redhat/shimx64.efi", "BOOTX64.EFI")])

    def test_existing_fallback_case_insensitive(self):
        make_tree(self.esp, {"EFI/Boot/bootx64.efi": "", "EFI/debian/shimx64.efi": ""})
        self.assertEqual(fallback_copies(self.esp / "EFI", "linux", ["debian"]), {})

    def test_windows(self):
        make_tree(self.esp, {"EFI/Microsoft/Boot/bootmgfw.efi": ""})
        self.assertEqual(self.names(fallback_copies(self.esp / "EFI", "windows", ["windows"])),
                         [("EFI/Microsoft/Boot/bootmgfw.efi", "BOOTX64.EFI")])

    def test_no_loader(self):
        make_tree(self.esp, {"EFI/empty/README": ""})
        self.assertIsNone(fallback_copies(self.esp / "EFI", "linux", ["debian"]))


if __name__ == "__main__":
    unittest.main()
