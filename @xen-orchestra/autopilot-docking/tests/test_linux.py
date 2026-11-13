import io
import os
import tarfile
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from helpers import dev, lsblk_json, make_tree

from xo_repair.blockdev import guest_disks, parse_lsblk
from xo_repair.detect import OsCandidate
from xo_repair.linux import (
    VMWARE_UNITS, LinuxGuest, agent_enabled, available_modules, detect_initramfs_tool, disable_units,
    enable_unit, extract_agent_tgz,
    guest_arch, initramfs_image, missing_initramfs_modules, interface_names, is_unstable_spec, kernel_versions, link_file,
    live_nics, map_by_name_spec, map_sd_spec, mountable_entries, package_manager, parse_fstab, parse_nic_map,
    parse_os_release, pin_interface_names, rewrite_fstab, rhel_kdump_images, select_agent_package,
    selinux_enabled, services_not_started, stale_kdump_initrds, unstable_resume,
)
from xo_repair.report import Report
from xo_repair.util import RepairError, guest_read, resolve_in_root

FSTAB = """\
# /etc/fstab: static file system information.
/dev/sda2   /        ext4  errors=remount-ro 0 1
UUID=1234-ABCD  /boot/efi  vfat  umask=0077  0  1
/dev/sdb1\t/data\txfs\tdefaults\t0 2
/dev/sda3 none swap sw 0 0
/dev/disk/by-path/pci-0000:03:00.0-scsi-0:0:2:0-part1 /srv ext4 defaults 0 2
proc /proc proc
"""


class FstabTest(unittest.TestCase):
    def setUp(self):
        devices = parse_lsblk(lsblk_json(
            dev("xvda", "disk", children=[
                dev("xvda1", uuid="1234-ABCD"), dev("xvda2", uuid="root-uuid"), dev("xvda3", uuid="swap-uuid"),
            ]),
            dev("xvdb", "disk", children=[dev("xvdb1", uuid="data-uuid")]),
        ))
        self.devices = devices
        self.disks = guest_disks(devices)

    def test_parse(self):
        entries = parse_fstab(FSTAB)
        self.assertEqual([e.mountpoint for e in entries], ["/", "/boot/efi", "/data", "none", "/srv", "/proc"])
        self.assertEqual(entries[0].lineno, 2)
        self.assertEqual(entries[-1].options, "defaults")

    def test_unstable(self):
        self.assertTrue(is_unstable_spec("/dev/sda2"))
        self.assertTrue(is_unstable_spec("/dev/disk/by-path/pci-0000:03:00.0-scsi-0:0:2:0-part1"))
        self.assertFalse(is_unstable_spec("UUID=1234"))
        self.assertFalse(is_unstable_spec("/dev/mapper/vg-root"))
        self.assertFalse(is_unstable_spec("/dev/xvda1"))
        # Ubuntu installs the root LV by its LVM UUID
        self.assertFalse(is_unstable_spec("/dev/disk/by-id/dm-uuid-LVM-xCX2aOHDiNpEJsyUKMQcp0BsuKOcAWcN"))
        self.assertFalse(is_unstable_spec("/dev/disk/by-id/md-uuid-1234:5678"))
        self.assertTrue(is_unstable_spec("/dev/disk/by-id/scsi-36000c29abc-part1"))

    def test_map_sd(self):
        self.assertEqual(map_sd_spec("/dev/sda2", self.disks, self.devices).name, "xvda2")
        self.assertEqual(map_sd_spec("/dev/sdb1", self.disks, self.devices).name, "xvdb1")
        self.assertEqual(map_sd_spec("/dev/sdb", self.disks, self.devices).name, "xvdb")
        self.assertIsNone(map_sd_spec("/dev/sdc1", self.disks, self.devices))
        self.assertIsNone(map_sd_spec("/dev/sda9", self.disks, self.devices))

    def test_rewrite_keeps_layout(self):
        result = rewrite_fstab(FSTAB, {2: "UUID=root-uuid", 4: "UUID=data-uuid"})
        lines = result.splitlines()
        self.assertEqual(lines[0], "# /etc/fstab: static file system information.")
        self.assertEqual(lines[1], "UUID=root-uuid   /        ext4  errors=remount-ro 0 1")
        self.assertEqual(lines[3], "UUID=data-uuid\t/data\txfs\tdefaults\t0 2")
        self.assertTrue(result.endswith("\n"))


class ByNameSpecTest(unittest.TestCase):
    """SLES/YaST "mount by device ID": the VMware names are gone on XCP-ng."""

    ROOT = "/dev/disk/by-id/scsi-36000c29abc-part2"

    def setUp(self):
        self.devices = parse_lsblk(lsblk_json(
            dev("xvda", "disk", children=[
                dev("xvda1", uuid="boot-uuid"), dev("xvda2", uuid="root-uuid"), dev("xvda3", uuid="swap-uuid"),
            ]),
            dev("xvdb", "disk", children=[dev("xvdb1", uuid="data-uuid")]),
        ))
        self.root = next(d for d in self.devices if d.name == "xvda2")

    def map(self, spec, anchor_spec=ROOT, anchor=None):
        return map_by_name_spec(spec, anchor_spec, anchor or self.root, self.devices)

    def test_same_disk_as_root(self):
        self.assertTrue(is_unstable_spec(self.ROOT))
        self.assertEqual(self.map("/dev/disk/by-id/scsi-36000c29abc-part3").name, "xvda3")
        self.assertEqual(self.map("/dev/disk/by-id/scsi-36000c29abc-part1").name, "xvda1")
        self.assertEqual(self.map("/dev/disk/by-id/scsi-36000c29abc").name, "xvda")
        self.assertIsNone(self.map("/dev/disk/by-id/scsi-36000c29abc-part9"))

    def test_by_path(self):
        root = "/dev/disk/by-path/pci-0000:03:00.0-scsi-0:0:0:0-part2"
        self.assertEqual(self.map("/dev/disk/by-path/pci-0000:03:00.0-scsi-0:0:0:0-part3", root).name, "xvda3")
        # a by-id alias of the same disk is a different name: not guessed
        self.assertIsNone(self.map("/dev/disk/by-id/scsi-36000c29abc-part3", root))

    def test_other_disk_unresolved(self):
        self.assertIsNone(self.map("/dev/disk/by-id/scsi-36000c29def-part1"))

    def test_needs_a_consistent_anchor(self):
        self.assertIsNone(self.map("/dev/disk/by-id/scsi-36000c29abc-part3", "UUID=root-uuid"))
        self.assertIsNone(self.map("/dev/disk/by-id/scsi-36000c29abc-part3", None))
        # the root spec says part2 but the root device is xvda1: do not trust it
        xvda1 = next(d for d in self.devices if d.name == "xvda1")
        self.assertIsNone(self.map("/dev/disk/by-id/scsi-36000c29abc-part3", anchor=xvda1))
        self.assertIsNone(map_by_name_spec("/dev/disk/by-id/scsi-36000c29abc-part3", self.ROOT, None, self.devices))

    def test_unstable_resume(self):
        self.assertEqual(
            unstable_resume('GRUB_CMDLINE_LINUX_DEFAULT="splash=silent resume=/dev/disk/by-id/scsi-3600-part3 quiet"'),
            "/dev/disk/by-id/scsi-3600-part3",
        )
        self.assertEqual(unstable_resume('GRUB_CMDLINE_LINUX_DEFAULT="quiet resume=/dev/sda3"'), "/dev/sda3")
        self.assertIsNone(unstable_resume('GRUB_CMDLINE_LINUX_DEFAULT="resume=UUID=9c97 quiet"'))
        self.assertIsNone(unstable_resume('GRUB_CMDLINE_LINUX_DEFAULT="splash=silent quiet"'))


class MountableTest(unittest.TestCase):
    def test_skips_noauto_and_cdrom(self):
        entries = parse_fstab(
            "/dev/sda1 / ext4 defaults 0 1\n"
            "/dev/sr0 /media/cdrom0 udf,iso9660 user,noauto 0 0\n"
            "/dev/sdc1 /mnt/usb ext4 noauto,user 0 0\n"
            "/dev/sr1 /media/cdrom1 udf,iso9660 ro 0 0\n"
            "/srv/a /srv/b none bind 0 0\n"
            "UUID=x /var/lib ext4 defaults 0 2\n"
            "UUID=y /var ext4 defaults 0 2\n"
        )
        self.assertEqual([e.mountpoint for e in mountable_entries(entries)], ["/var", "/var/lib"])


class MountFstabTest(unittest.TestCase):
    def test_mount_point_stays_in_the_guest_root(self):
        with tempfile.TemporaryDirectory() as tmp:
            # an absolute symlink, which the live system would follow out of the guest
            root = make_tree(Path(tmp), {"boot": ("symlink", "/guest-boot"), "guest-boot/.keep": ""})
            devices = parse_lsblk(lsblk_json(
                dev("xvda", "disk", children=[dev("xvda1", fstype="ext4", uuid="U-BOOT")]),
            ))
            mounts = mock.Mock()
            guest = LinuxGuest(OsCandidate("linux", devices[1]), devices, guest_disks(devices), mounts,
                               Report("repair", "dev"), readonly=False)
            guest.root = root
            guest._mount_fstab(parse_fstab("UUID=U-BOOT /boot ext4 defaults 0 2\n"))
            mounts.mount.assert_called_once_with("/dev/xvda1", "ext4", root / "guest-boot", readonly=False,
                                                 options=[])


class NetworkTest(unittest.TestCase):
    MAC = "00:0c:29:d4:bf:19"

    def test_parse_nic_map(self):
        self.assertEqual(
            parse_nic_map("ens192=00:0C:29:D4:BF:19; ens224=00-0c-29-00-00-01;bad=xyz;;=00:0c:29:00:00:02"),
            {"ens192": self.MAC, "ens224": "00:0c:29:00:00:01"},
        )
        self.assertEqual(parse_nic_map(None), {})

    def test_live_nics(self):
        with tempfile.TemporaryDirectory() as tmp:
            sys_net = make_tree(Path(tmp), {
                "drivers/vif/bind": "",
                "devices/vif-0/driver": ("symlink", "../../drivers/vif"),
                "net/enX0/address": self.MAC.upper() + "\n",
                "net/enX0/device": ("symlink", "../../devices/vif-0"),
                "net/lo/address": "00:00:00:00:00:00\n",
            }) / "net"
            self.assertEqual(live_nics(sys_net), {"enX0": (self.MAC, "vif")})

    def test_pin_single_nic(self):
        nics = {"enX0": (self.MAC, "vif")}
        self.assertEqual(pin_interface_names(["ens192"], nics, {}), ({"ens192": (self.MAC, "vif")}, []))
        # kernel names are left alone
        self.assertEqual(pin_interface_names(["eth0"], nics, {}), ({}, []))

    def test_pin_several_nics(self):
        nics = {"enX0": (self.MAC, "vif"), "enX1": ("00:0c:29:00:00:01", "vif")}
        self.assertEqual(pin_interface_names(["ens192", "ens224"], nics, {}), ({}, ["ens192", "ens224"]))
        pinned, unresolved = pin_interface_names(["ens192", "ens224"], nics, {"ens192": self.MAC})
        self.assertEqual(pinned, {"ens192": (self.MAC, "vif")})
        self.assertEqual(unresolved, ["ens224"])

    def test_link_file(self):
        text = link_file("ens192", self.MAC, "vif")
        self.assertIn("[Match]\nMACAddress=00:0c:29:d4:bf:19\nDriver=vif\n", text)
        self.assertIn("[Link]\nName=ens192\n", text)
        self.assertNotIn("Driver=", link_file("ens192", self.MAC, ""))


class GuestTreeTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = make_tree(Path(self.tmp.name), {
            "lib": ("symlink", "usr/lib"),
            "sbin": ("symlink", "/usr/sbin"),  # absolute symlink, must stay in the guest
            "etc/os-release": 'NAME="Debian GNU/Linux"\nID=debian\nVERSION_ID="12"\n',
            "usr/sbin/update-initramfs": "",
            "boot/vmlinuz-6.1.0-18-amd64": "",
            "boot/initrd.img-6.1.0-18-amd64": "",
            "usr/lib/modules/6.1.0-18-amd64/modules.dep":
                "kernel/drivers/block/xen-blkfront.ko.xz: \nkernel/drivers/net/xen-netfront.ko.xz:\n",
            "usr/lib/modules/6.1.0-18-amd64/modules.builtin":
                "kernel/drivers/ata/ata_piix.ko\nkernel/drivers/scsi/sd_mod.ko\n",
            "usr/lib/modules/5.10.0-old/modules.dep": "kernel/drivers/ata/ata_piix.ko:\n",
            "usr/lib/modules/6.2.0-headers-only/README": "",
            "etc/netplan/50-cloud-init.yaml": "network:\n  ethernets:\n    ens192:\n      dhcp4: true\n",
            "etc/sysconfig/network-scripts/ifcfg-ens224": "DEVICE=ens224\n",
            "etc/selinux/config": "# comment\nSELINUX=enforcing\n",
        })

    def tearDown(self):
        self.tmp.cleanup()

    def test_resolve_absolute_symlink_stays_in_root(self):
        self.assertEqual(resolve_in_root(self.root, "/sbin/update-initramfs"),
                         self.root / "usr/sbin/update-initramfs")
        self.assertEqual(resolve_in_root(self.root, "/lib/modules"), self.root / "usr/lib/modules")

    def test_os_release(self):
        info = parse_os_release(guest_read(self.root, "/etc/os-release"))
        self.assertEqual(info["ID"], "debian")
        self.assertEqual(info["VERSION_ID"], "12")

    def test_initramfs_tool(self):
        self.assertEqual(detect_initramfs_tool(self.root), "initramfs-tools")

    def test_kernels(self):
        # 5.10.0-old has no vmlinuz, headers-only has no modules.dep
        self.assertEqual(kernel_versions(self.root), ["6.1.0-18-amd64"])
        self.assertEqual(initramfs_image(self.root, "6.1.0-18-amd64"), "/boot/initrd.img-6.1.0-18-amd64")

    def test_available_modules(self):
        self.assertEqual(available_modules(self.root, "6.1.0-18-amd64"),
                         ["xen-blkfront", "xen-netfront", "ata_piix", "sd_mod"])
        self.assertEqual(available_modules(self.root, "5.10.0-old"), ["ata_piix"])

    def test_interface_names(self):
        self.assertEqual(interface_names(self.root), ["ens192", "ens224"])

    def test_selinux(self):
        self.assertTrue(selinux_enabled(self.root))

    def test_kdump_initrds(self):
        self.assertEqual(stale_kdump_initrds(self.root), [])
        self.assertEqual(rhel_kdump_images(self.root), [])
        make_tree(self.root, {
            "var/lib/kdump/initrd": "",
            "boot/initramfs-5.14.0-427.el9.x86_64kdump.img": "",
            "boot/initramfs-5.14.0-427.el9.x86_64.img": "",
        })
        self.assertEqual(stale_kdump_initrds(self.root), ["/var/lib/kdump/initrd"])
        self.assertEqual(rhel_kdump_images(self.root), ["/boot/initramfs-5.14.0-427.el9.x86_64kdump.img"])

    def test_disable_units(self):
        make_tree(self.root, {
            "lib/systemd/system/open-vm-tools.service": "",
            "etc/systemd/system/multi-user.target.wants/open-vm-tools.service":
                ("symlink", "/lib/systemd/system/open-vm-tools.service"),
            "etc/systemd/system/vmtoolsd.service": ("symlink", "/lib/systemd/system/open-vm-tools.service"),
            "etc/systemd/system/vgauth.service": ("symlink", "/dev/null"),  # masked: keep
            "etc/systemd/system/multi-user.target.wants/ssh.service": ("symlink", "/lib/systemd/system/ssh.service"),
        })
        removed = disable_units(self.root, ("open-vm-tools.service", "vmtoolsd.service", "vgauth.service"))
        self.assertEqual(removed, ["multi-user.target.wants/open-vm-tools.service", "vmtoolsd.service"])
        etc = self.root / "etc/systemd/system"
        self.assertTrue((etc / "vgauth.service").is_symlink())
        self.assertTrue((etc / "multi-user.target.wants/ssh.service").is_symlink())

    def test_disable_units_suse(self):
        # openSUSE Leap 15.6: vgauthd is enabled on its own and required by vmtoolsd
        make_tree(self.root, {
            "usr/lib/systemd/system/vmtoolsd.service": "",
            "usr/lib/systemd/system/vgauthd.service": "",
            "etc/systemd/system/multi-user.target.wants/vmtoolsd.service":
                ("symlink", "/usr/lib/systemd/system/vmtoolsd.service"),
            "etc/systemd/system/multi-user.target.wants/vgauthd.service":
                ("symlink", "/usr/lib/systemd/system/vgauthd.service"),
            "etc/systemd/system/vmtoolsd.service.requires/vgauthd.service":
                ("symlink", "/usr/lib/systemd/system/vgauthd.service"),
            "etc/systemd/system/multi-user.target.wants/ssh.service": ("symlink", "/lib/systemd/system/ssh.service"),
        })
        removed = disable_units(self.root, VMWARE_UNITS)
        self.assertEqual(removed, [
            "multi-user.target.wants/vgauthd.service", "multi-user.target.wants/vmtoolsd.service",
            "vmtoolsd.service.requires/vgauthd.service",
        ])
        etc = self.root / "etc/systemd/system"
        self.assertTrue((etc / "multi-user.target.wants/ssh.service").is_symlink())


# Linux/ directory of guest-tools-8.3-19.xcpng8.3.iso
TOOLS_LINUX = [
    "install.sh", "versions.deb", "versions.rpm", "xe-daemon",
    "xe-guest-utilities_7.30.0-19_386.tgz", "xe-guest-utilities_7.30.0-19_amd64.deb",
    "xe-guest-utilities_7.30.0-19_i386.deb", "xe-guest-utilities-7.30.0-19.i386.rpm",
    "xe-guest-utilities-7.30.0-19.legacy.i386.rpm", "xe-guest-utilities-7.30.0-19.legacy.x86_64.rpm",
    "xe-guest-utilities-7.30.0-19.x86_64.rpm", "xe-guest-utilities_7.30.0-19_x86_64.tgz",
    "xe-linux-distribution", "xe-linux-distribution.service", "xen-vcpu-hotplug.rules",
]
# ELF header of an x86_64 binary, padded to the e_machine field
ELF_X86_64 = b"\x7fELF\x02\x01\x01" + b"\x00" * 11 + b"\x3e\x00"
ELF_I386 = b"\x7fELF\x01\x01\x01" + b"\x00" * 11 + b"\x03\x00"
ELF_AARCH64 = b"\x7fELF\x02\x01\x01" + b"\x00" * 11 + b"\xb7\x00"


class GuestAgentTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def test_select_package(self):
        self.assertEqual(select_agent_package(TOOLS_LINUX, "rpm", "x86_64", True),
                         "xe-guest-utilities-7.30.0-19.x86_64.rpm")
        self.assertEqual(select_agent_package(TOOLS_LINUX, "rpm", "x86_64", False),
                         "xe-guest-utilities-7.30.0-19.legacy.x86_64.rpm")
        self.assertEqual(select_agent_package(TOOLS_LINUX, "dpkg", "x86_64", True),
                         "xe-guest-utilities_7.30.0-19_amd64.deb")
        self.assertEqual(select_agent_package(TOOLS_LINUX, "dpkg", "i386", True),
                         "xe-guest-utilities_7.30.0-19_i386.deb")
        self.assertIsNone(select_agent_package(TOOLS_LINUX, "dpkg", "aarch64", True))
        self.assertEqual(select_agent_package(TOOLS_LINUX, "tgz", "x86_64", True),
                         "xe-guest-utilities_7.30.0-19_x86_64.tgz")
        self.assertIsNone(select_agent_package(TOOLS_LINUX, "tgz", "x86_64", False))  # needs systemd
        self.assertIsNone(select_agent_package(
            [n for n in TOOLS_LINUX if not n.endswith(".service")], "tgz", "x86_64", True))
        self.assertIsNone(select_agent_package(["install.sh"], "rpm", "x86_64", True))

    def test_guest_arch_follows_symlinks(self):
        make_tree(self.root, {"usr/bin/bash": ELF_X86_64, "bin": ("symlink", "usr/bin"),
                              "usr/bin/sh": ("symlink", "/usr/bin/bash")})
        self.assertEqual(guest_arch(self.root), "x86_64")

    def test_guest_arch_other(self):
        make_tree(self.root, {"bin/sh": ELF_I386})
        self.assertEqual(guest_arch(self.root), "i386")
        (self.root / "bin/sh").write_bytes(ELF_AARCH64)
        self.assertIsNone(guest_arch(self.root))
        (self.root / "bin/sh").write_text("#!/bin/busybox\n")
        self.assertIsNone(guest_arch(self.root))

    def test_package_manager(self):
        self.assertIsNone(package_manager(self.root))
        make_tree(self.root, {"usr/bin/rpm": ""})
        self.assertEqual(package_manager(self.root), "rpm")
        make_tree(self.root, {"usr/bin/dpkg": ""})  # Debian with the rpm tool
        self.assertEqual(package_manager(self.root), "dpkg")

    def test_agent_enabled(self):
        make_tree(self.root, {"etc/hostname": ""})
        self.assertFalse(agent_enabled(self.root))
        make_tree(self.root, {"etc/rc2.d/S01xe-linux-distribution": ("symlink", "../init.d/xe-linux-distribution")})
        self.assertTrue(agent_enabled(self.root))

    def test_agent_enabled_systemd(self):
        make_tree(self.root, {"etc/systemd/system/multi-user.target.wants/xe-linux-distribution.service":
                              ("symlink", "/usr/lib/systemd/system/xe-linux-distribution.service")})
        self.assertTrue(agent_enabled(self.root))

    def test_services_not_started_restores_existing_policy(self):
        make_tree(self.root, {"usr/sbin/policy-rc.d": "#!/bin/sh\nexit 0\n"})
        with services_not_started(self.root):
            self.assertIn("exit 101", (self.root / "usr/sbin/policy-rc.d").read_text())
        self.assertEqual((self.root / "usr/sbin/policy-rc.d").read_text(), "#!/bin/sh\nexit 0\n")
        self.assertFalse((self.root / "usr/sbin/policy-rc.d.xo-repair.bak").exists())

    def test_services_not_started_removes_its_policy(self):
        make_tree(self.root, {"usr/sbin/dpkg": ""})
        with self.assertRaises(RuntimeError):
            with services_not_started(self.root):
                raise RuntimeError("dpkg failed")
        self.assertFalse((self.root / "usr/sbin/policy-rc.d").exists())


class FakeMounts:
    """Mounts stand-in: the guest root is a prepared tree, other mounts are no-ops."""

    def __init__(self, root: Path):
        self.root = root

    def mount(self, device, fstype, target=None, *, readonly=True, options=()):
        return Path(target) if target else self.root

    def bind(self, source, target):
        return target


class LeapGuestTest(unittest.TestCase):
    """openSUSE Leap 15.6 / SLES 15 installed with YaST "mount by device ID"."""

    BY_ID = "/dev/disk/by-id/scsi-36000c29abc"
    KVER = "6.4.0-150600.21-default"

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.tools = make_tree(Path(self.tmp.name) / "tools", {f"Linux/{n}": n for n in TOOLS_LINUX})
        self.root = make_tree(Path(self.tmp.name) / "root", {
            "bin": ("symlink", "usr/bin"),
            "usr/bin/bash": ELF_X86_64,
            "usr/bin/sh": ("symlink", "bash"),
            "usr/bin/rpm": "",
            "usr/lib/systemd/systemd": "",
            "etc/os-release": 'NAME="openSUSE Leap"\nID="opensuse-leap"\nVERSION_ID="15.6"\n',
            "etc/fstab": (
                f"{self.BY_ID}-part2  /      btrfs  defaults       0  0\n"
                f"{self.BY_ID}-part2  /var   btrfs  subvol=/@/var  0  0\n"
                f"{self.BY_ID}-part3  swap   swap   defaults       0  0\n"
            ),
            "etc/default/grub": f'GRUB_CMDLINE_LINUX_DEFAULT="splash=silent resume={self.BY_ID}-part3 quiet"\n',
            "usr/bin/dracut": "",
            f"boot/vmlinuz-{self.KVER}": "",
            f"boot/initrd-{self.KVER}": "",
            f"lib/modules/{self.KVER}/modules.dep": "kernel/drivers/block/xen-blkfront.ko.zst:\n",
            "var/lib/kdump/initrd": "",
            "usr/lib/systemd/system/vmtoolsd.service": "",
            "usr/lib/systemd/system/vgauthd.service": "",
        })
        devices = parse_lsblk(lsblk_json(dev("xvda", "disk", children=[
            dev("xvda1"), dev("xvda2", fstype="btrfs", uuid="root-uuid"), dev("xvda3", fstype="swap", uuid="swap-uuid"),
        ])))
        root_dev = next(d for d in devices if d.name == "xvda2")
        self.report = Report("repair", "test")
        self.guest = LinuxGuest(OsCandidate("linux", root_dev), devices, guest_disks(devices),
                                FakeMounts(self.root), self.report, readonly=False, tools=self.tools)
        self.guest.inspect()

    def tearDown(self):
        self.tmp.cleanup()

    def action(self, code):
        return next(a for a in self.report.actions if a.code == code)

    def test_planned(self):
        codes = [a.code for a in self.report.actions]
        self.assertEqual(codes, ["fstab_stable_names", "disable_vmware_tools", "initramfs_xen_drivers",
                                 "kdump_initrd_rebuild", "install_guest_agent"])
        self.assertEqual(self.report.os["guest_agent"], "xe-guest-utilities-7.30.0-19.x86_64.rpm")
        self.assertIn("vgauthd.service", self.action("disable_vmware_tools").description)
        findings = {f.code for f in self.report.findings}
        self.assertIn("grub_unstable_resume", findings)
        self.assertNotIn("fstab_unstable_names", findings)
        self.assertFalse(self.report.blocked)  # /var found through the by-id name of /

    def test_apply_fstab_and_kdump(self):
        self.action("fstab_stable_names").apply()
        self.action("kdump_initrd_rebuild").apply()
        fstab = (self.root / "etc/fstab").read_text().splitlines()
        self.assertEqual([line.split()[0] for line in fstab], ["UUID=root-uuid", "UUID=root-uuid", "UUID=swap-uuid"])
        self.assertTrue((self.root / "etc/fstab.xo-repair.bak").is_file())
        self.assertFalse((self.root / "var/lib/kdump/initrd").exists())

    def test_apply_guest_agent(self):
        for directory in ("dev/pts", "proc", "sys"):
            (self.root / directory).mkdir(parents=True)
        commands = []

        def chroot_run(root, cmd, **kwargs):
            commands.append(cmd)
            staged = self.root / cmd[-1].lstrip("/")
            self.assertTrue(staged.is_file())  # the package is in the guest when rpm runs
            make_tree(self.root, {"etc/systemd/system/multi-user.target.wants/xe-linux-distribution.service":
                                  ("symlink", "/usr/lib/systemd/system/xe-linux-distribution.service")})

        with mock.patch("xo_repair.linux.chroot_run", chroot_run):
            self.action("install_guest_agent").apply()
        self.assertEqual(commands, [["rpm", "-U", "--replacepkgs", "/tmp/xo-repair/xe-guest-utilities-7.30.0-19.x86_64.rpm"]])
        self.assertFalse((self.root / "tmp/xo-repair").exists())

    def test_apply_guest_agent_not_enabled(self):
        for directory in ("dev/pts", "proc", "sys"):
            (self.root / directory).mkdir(parents=True)
        with mock.patch("xo_repair.linux.chroot_run"):
            with self.assertRaises(RepairError):
                self.action("install_guest_agent").apply()


class ReadonlyRootTest(unittest.TestCase):
    """SL Micro: read-only btrfs root snapshot, managed with transactional-update."""

    KVER = "6.12.0-160000.5-default"
    MODULES = f"lib/modules/{KVER}"

    def plan(self, initramfs_listing):
        with tempfile.TemporaryDirectory() as tmp:
            root = make_tree(Path(tmp) / "root", {
                "etc/os-release": 'NAME="SLES"\nVARIANT="Micro"\nID="sles"\nVERSION_ID="16.0"\n',
                "etc/fstab": "UUID=1ef4 / btrfs ro 0 0\nUUID=EB0F /boot/efi vfat defaults 0 0\n",
                "usr/sbin/transactional-update": "",
                "usr/bin/dracut": "",
                "usr/bin/rpm": "",
                "usr/lib/systemd/systemd": "",
                "bin/sh": ELF_X86_64,
                f"boot/vmlinuz-{self.KVER}": "",
                f"boot/initrd-{self.KVER}": "",
                f"{self.MODULES}/modules.dep": "kernel/drivers/block/xen-blkfront.ko.zst:\n"
                                               "kernel/drivers/net/xen-netfront.ko.zst:\n",
                "usr/lib/systemd/system/vmtoolsd.service": "",
            })
            tools_dir = make_tree(Path(tmp) / "tools", {f"Linux/{n}": "" for n in TOOLS_LINUX})
            devices = parse_lsblk(lsblk_json(dev("xvda", "disk", children=[dev("xvda3", fstype="ext4")])))
            report = Report("repair", "test")
            guest = LinuxGuest(OsCandidate("linux", devices[1]), devices, guest_disks(devices),
                               FakeMounts(root), report, readonly=False, tools=tools_dir)
            with mock.patch("xo_repair.linux.initramfs_files", return_value=initramfs_listing):
                guest.inspect()
                guest.finalize()
            return report

    def test_initramfs_already_has_the_drivers(self):
        report = self.plan([f"usr/lib/modules/{self.KVER}/kernel/drivers/block/xen-blkfront.ko.zst",
                            f"usr/lib/modules/{self.KVER}/kernel/drivers/net/xen-netfront.ko.zst"])
        self.assertEqual(report.actions, [])  # nothing is written offline
        codes = {f.code: f for f in report.findings}
        self.assertIn("initramfs_xen_drivers_present", codes)
        self.assertEqual(codes["readonly_root"].data["actions"], ["disable_vmware_tools", "install_guest_agent"])
        self.assertFalse(report.blocked)
        self.assertTrue(report.os["readonly_root"])

    def test_initramfs_without_the_drivers_is_blocking(self):
        report = self.plan([f"usr/lib/modules/{self.KVER}/kernel/drivers/net/xen-netfront.ko.zst"])
        errors = [f for f in report.findings if f.level == "error"]
        self.assertEqual([f.code for f in errors], ["readonly_root_initramfs"])
        self.assertEqual(errors[0].data["kernels"], {self.KVER: ["xen-blkfront"]})
        self.assertTrue(report.blocked)

    def test_missing_initramfs_modules(self):
        files = ["usr/lib/modules/6.1/kernel/drivers/block/xen-blkfront.ko.xz", "usr/bin/sh"]
        self.assertEqual(missing_initramfs_modules(files, ["xen-blkfront", "xen-netfront"]), ["xen-netfront"])
        self.assertEqual(missing_initramfs_modules([], ["xen_blkfront"]), ["xen_blkfront"])


class GuestAgentPlanTest(unittest.TestCase):
    def plan(self, files, tools):
        with tempfile.TemporaryDirectory() as tmp:
            root = make_tree(Path(tmp) / "root", {"etc/os-release": "ID=arch\n", "etc/fstab": "", **files})
            tools_dir = make_tree(Path(tmp) / "tools", {f"Linux/{n}": "" for n in TOOLS_LINUX}) if tools else None
            devices = parse_lsblk(lsblk_json(dev("xvda", "disk", children=[dev("xvda1", fstype="ext4")])))
            report = Report("diagnose", "test")
            guest = LinuxGuest(OsCandidate("linux", devices[1]), devices, guest_disks(devices),
                               FakeMounts(root), report, readonly=True, tools=tools_dir)
            guest.inspect()
            return report

    def codes(self, report):
        return {f.code for f in report.findings} | {a.code for a in report.actions}

    def test_already_installed(self):
        codes = self.codes(self.plan({"usr/sbin/xe-daemon": ""}, tools=True))
        self.assertFalse(codes & {"install_guest_agent", "guest_agent_missing", "guest_agent_unsupported"})

    def test_no_tools_disk(self):
        self.assertIn("guest_agent_missing", self.codes(self.plan({}, tools=False)))

    def test_rhel_kdump_image_deleted(self):
        report = self.plan({"boot/initramfs-3.10.0-514.el7.x86_64kdump.img": ""}, tools=False)
        action = next(a for a in report.actions if a.code == "kdump_initrd_rebuild")
        self.assertIn("/boot/initramfs-3.10.0-514.el7.x86_64kdump.img", action.description)
        self.assertFalse(action.critical)

    def test_no_package_manager_nor_systemd(self):
        report = self.plan({"bin/sh": ELF_X86_64, "usr/bin/pacman": ""}, tools=True)
        self.assertIn("guest_agent_unsupported", self.codes(report))
        self.assertNotIn("install_guest_agent", self.codes(report))

    def test_no_package_manager_with_systemd(self):  # Arch Linux: generic tarball
        report = self.plan({"bin/sh": ELF_X86_64, "usr/lib/systemd/systemd": ""}, tools=True)
        self.assertIn("install_guest_agent", self.codes(report))
        self.assertEqual(report.os["guest_agent"], "xe-guest-utilities_7.30.0-19_x86_64.tgz")


class AgentTarballTest(unittest.TestCase):
    def test_extract_follows_merged_usr_and_enables_unit(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = make_tree(Path(tmp) / "root", {"usr/bin/bash": ELF_X86_64, "usr/sbin": ("symlink", "bin"),
                                                  "etc/hostname": ""})
            tgz = Path(tmp) / "agent.tgz"
            with tarfile.open(tgz, "w:gz") as archive:
                for name, data, mode in (("usr/sbin/xe-daemon", b"ELF", 0o755),
                                         ("etc/init.d/xe-linux-distribution", b"#!/bin/sh", 0o755),
                                         ("../escape", b"x", 0o644)):
                    info = tarfile.TarInfo(name)
                    info.size, info.mode = len(data), mode
                    archive.addfile(info, io.BytesIO(data))
                link = tarfile.TarInfo("usr/bin/xenstore-read")
                link.type, link.linkname = tarfile.SYMTYPE, "xenstore"
                archive.addfile(link)
            installed = extract_agent_tgz(root, tgz)
            self.assertEqual(installed, ["/usr/sbin/xe-daemon", "/usr/bin/xenstore-read"])
            self.assertTrue((root / "usr/bin/xe-daemon").is_file())  # through the /usr/sbin link
            self.assertTrue(os.access(root / "usr/bin/xe-daemon", os.X_OK))
            self.assertFalse((root / "etc/init.d").exists())
            self.assertFalse((Path(tmp) / "escape").exists())
            self.assertEqual(os.readlink(root / "usr/bin/xenstore-read"), "xenstore")
            enable_unit(root, "xe-linux-distribution.service")
            self.assertTrue(agent_enabled(root))


if __name__ == "__main__":
    unittest.main()
