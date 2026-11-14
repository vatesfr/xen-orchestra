import unittest
from unittest import mock

from helpers import dev, lsblk_json

from xo_docking import __main__ as main
from xo_docking.blockdev import activate_storage, guest_disks, parse_lsblk
from xo_docking.report import Report
from xo_docking.util import DockingError


class ParseLsblkTest(unittest.TestCase):
    def setUp(self):
        text = lsblk_json(
            dev("sr0", "rom", rm=True, fstype="iso9660"),
            dev("loop0", "loop", fstype="squashfs"),
            dev("xvdb", "disk", pttype="gpt", children=[
                dev("xvdb1", fstype="LVM2_member", children=[
                    dev("vg-data", "lvm", path="/dev/mapper/vg-data", fstype="xfs", uuid="U-DATA"),
                ]),
            ]),
            dev("xvda", "disk", pttype="gpt", children=[
                dev("xvda1", fstype="vfat", parttype="C12A7328-F81F-11D2-BA4B-00A0C93EC93B"),
                dev("xvda2", fstype="ext4", uuid="U-ROOT"),
            ]),
            dev("nvme0n1", "disk", children=[dev("nvme0n1p3", fstype="ext4")]),
        )
        self.devices = {d.name: d for d in parse_lsblk(text)}

    def test_hierarchy(self):
        self.assertEqual(self.devices["vg-data"].disk, "xvdb")
        self.assertEqual(self.devices["vg-data"].parent, "xvdb1")
        self.assertEqual(self.devices["vg-data"].path, "/dev/mapper/vg-data")
        self.assertEqual(self.devices["xvda2"].disk, "xvda")

    def test_partition_number(self):
        self.assertEqual(self.devices["xvda2"].partition_number(), 2)
        self.assertEqual(self.devices["nvme0n1p3"].partition_number(), 3)
        self.assertIsNone(self.devices["vg-data"].partition_number())

    def test_esp(self):
        self.assertTrue(self.devices["xvda1"].is_esp)
        self.assertFalse(self.devices["xvda2"].is_esp)

    def test_guest_disks_order_and_filtering(self):
        names = [d.name for d in guest_disks(list(self.devices.values()))]
        self.assertEqual(names, ["xvda", "xvdb", "nvme0n1"])

    def test_guest_tools_disk_is_not_a_guest_disk(self):
        text = lsblk_json(dev("xvdz", "disk", fstype="iso9660", label="XCP-ng Tools"),
                          dev("xvda", "disk", children=[dev("xvda1", fstype="ext4")]))
        devices = parse_lsblk(text)
        self.assertEqual([d.name for d in guest_disks(devices)], ["xvda"])
        self.assertEqual([d.name for d in devices if d.is_medium], ["xvdz"])

    def test_disk_order_beyond_z(self):
        text = lsblk_json(dev("xvdaa", "disk"), dev("xvdz", "disk"), dev("xvda", "disk"))
        self.assertEqual([d.name for d in guest_disks(parse_lsblk(text))], ["xvda", "xvdz", "xvdaa"])


class ActivateStorageTest(unittest.TestCase):
    def test_returns_the_failures(self):
        def run(cmd, **kwargs):
            if cmd[0] == "vgchange":
                raise DockingError("command_failed", "vgchange exited with status 5: metadata unreadable")

        with mock.patch("xo_docking.blockdev.run", side_effect=run):
            self.assertEqual(activate_storage(readonly=True),
                             ["vgchange exited with status 5: metadata unreadable"])

    def test_reported_when_no_os_is_found(self):
        report = Report("diagnose", "dev")
        disks = parse_lsblk(lsblk_json(dev("xvda", "disk")))
        with mock.patch.object(main.efi, "firmware", return_value="bios"), \
                mock.patch.object(main, "activate_storage", return_value=["vgchange exited with status 5"]), \
                mock.patch.object(main, "list_block_devices", return_value=[]), \
                mock.patch.object(main, "guest_disks", return_value=disks), \
                mock.patch.object(main, "find_tools", return_value=None), \
                mock.patch.object(main, "probe", return_value=[]):
            main.execute(report, mock.Mock(), None, "standard", {}, {})
        self.assertEqual([(f.level, f.code, f.message) for f in report.findings], [
            ("warning", "storage_activation_failed", "vgchange exited with status 5"),
            ("error", "no_os_found", "no Linux or Windows installation found on the disks"),
        ])


if __name__ == "__main__":
    unittest.main()
