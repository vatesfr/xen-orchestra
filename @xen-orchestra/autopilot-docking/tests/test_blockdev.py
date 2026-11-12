import unittest

from helpers import dev, lsblk_json

from xo_repair.blockdev import guest_disks, parse_lsblk


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


if __name__ == "__main__":
    unittest.main()
