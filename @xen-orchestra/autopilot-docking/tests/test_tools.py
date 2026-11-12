import tempfile
import unittest
from pathlib import Path

from helpers import dev, lsblk_json, make_tree

from xo_repair.blockdev import parse_lsblk
from xo_repair.report import Report
from xo_repair.tools import find_tools


class FakeMounts:
    """Each device "mounts" on a prepared directory."""

    def __init__(self, trees: dict):
        self.trees = trees
        self.unmounted = []

    def mount(self, device, fstype, target=None, *, readonly=True, options=()):
        assert readonly
        return self.trees[device]

    def umount(self, target):
        self.unmounted.append(target)


class FindToolsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        base = Path(self.tmp.name)
        self.trees = {
            "/dev/xvdy": make_tree(base / "other", {"README": ""}),
            "/dev/xvdz": make_tree(base / "tools", {"Linux/install.sh": "", "Windows/XenTools-x64.msi": ""}),
        }
        self.devices = parse_lsblk(lsblk_json(
            dev("xvda", "disk", children=[dev("xvda1", fstype="ext4")]),
            dev("xvdy", "disk", fstype="iso9660"),
            dev("xvdz", "disk", fstype="iso9660"),
        ))

    def tearDown(self):
        self.tmp.cleanup()

    def test_found(self):
        mounts = FakeMounts(self.trees)
        report = Report("diagnose", "test")
        self.assertEqual(find_tools(self.devices, mounts, report), self.trees["/dev/xvdz"])
        self.assertEqual(report.tools, "xvdz")
        self.assertEqual(mounts.unmounted, [self.trees["/dev/xvdy"]])  # not the guest tools
        self.assertEqual(report.to_dict()["tools"], "xvdz")

    def test_absent(self):
        report = Report("diagnose", "test")
        devices = [d for d in self.devices if d.name != "xvdz"]
        self.assertIsNone(find_tools(devices, FakeMounts(self.trees), report))
        self.assertIsNone(report.tools)


if __name__ == "__main__":
    unittest.main()
