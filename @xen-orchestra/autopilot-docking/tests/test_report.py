import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import helpers  # noqa: F401  # sets the import path

from xo_docking.mounts import Mounts, is_readonly_mount, mount_options
from xo_docking.util import DockingError
from xo_docking.report import Report


class ReportTest(unittest.TestCase):
    def test_result(self):
        report = Report("diagnose", "dev")
        self.assertEqual(report.result(), "ok")
        report.warning("w", "warning")
        self.assertEqual(report.result(), "warning")
        report.error("e", "error")
        self.assertEqual(report.result(), "error")
        self.assertTrue(report.blocked)

    def test_critical_failure_stops(self):
        report = Report("dock", "dev")
        applied = []

        def boom():
            raise RuntimeError("boom")

        report.plan("first", "ok", lambda: applied.append("first"))
        report.plan("optional", "fails", boom, critical=False)
        report.plan("critical", "fails", boom)
        report.plan("last", "never", lambda: applied.append("last"))
        report.apply_actions()
        self.assertEqual(applied, ["first"])
        self.assertEqual([a.status for a in report.actions], ["applied", "failed", "failed", "skipped"])
        self.assertEqual(report.result(), "error")

    def test_compact_json_fits_and_keeps_errors(self):
        report = Report("diagnose", "20261011-abcdef12")
        for i in range(200):
            report.info(f"info_{i}", "x" * 100)
            report.warning(f"warn_{i}", "y" * 100, details=list(range(20)))
        report.error("blocking", "the one that matters")
        text = report.compact_json()
        self.assertLessEqual(len(text.encode()), 1900)
        data = json.loads(text)
        self.assertTrue(data["truncated"])
        self.assertIn("blocking", [f["code"] for f in data["findings"]])
        self.assertEqual(data["result"], "error")

    def test_compact_json_drops_what_xo_does_not_read_first(self):
        report = Report("diagnose", "dev")
        report.os = {"kind": "linux", "name": "Debian 12", "kernels": [f"6.1.0-{i}-amd64" for i in range(100)]}
        report.error("boot_disk_not_first", "the OS is not on the first disk", os_disk="xvdb")
        data = json.loads(report.compact_json())
        self.assertEqual(data["os"], {"kind": "linux", "name": "Debian 12"})
        # the details XO reads in a finding are kept longer than those of the OS
        self.assertEqual(data["findings"][0]["data"], {"os_disk": "xvdb"})
        self.assertNotIn("truncated", data)

    def test_compact_json_keeps_what_xo_relies_on(self):
        report = Report("dock", "dev")
        report.os = {"kind": "windows", "rtc_timeoffset": 3600, "vmware_services": [f"vm{i}" for i in range(100)]}
        report.network = [
            {"adapter": "vmxnet3 Ethernet Adapter " * 4, "guid": f"{{guid-{i}}}", "dhcp": i % 2 == 0,
             "addresses": [f"10.0.0.{i}"], "masks": ["255.255.255.0"], "gateways": ["10.0.0.1"],
             "dns": ["10.0.0.2", "10.0.0.3"]}
            for i in range(10)
        ]
        report.warning("pv_drivers_unsupported", "too old")
        for i in range(100):
            report.warning(f"warn_{i}", "y" * 100)
        report.plan("install_firstboot", "first boot", lambda: None)
        for i in range(100):
            report.plan(f"action_{i}", "x" * 100, lambda: None)
        report.apply_actions()
        text = report.compact_json()
        self.assertLessEqual(len(text.encode()), 1900)
        data = json.loads(text)
        self.assertTrue(data["truncated"])
        self.assertEqual(data["os"], {"kind": "windows", "rtc_timeoffset": 3600})
        self.assertEqual(data["network"], [
            {"guid": f"{{guid-{i}}}", "dhcp": False, "addresses": [f"10.0.0.{i}"]} for i in range(1, 10, 2)
        ])
        self.assertIn("pv_drivers_unsupported", [f["code"] for f in data["findings"]])
        self.assertIn({"code": "install_firstboot", "status": "applied"}, data["actions"])

    def test_compact_json_keeps_the_info_xo_acts_on(self):
        report = Report("dock", "dev")
        report.info("guest_agent_missing", "no guest tools disk")
        for i in range(100):
            report.info(f"info_{i}", "x" * 100)
        data = json.loads(report.compact_json())
        self.assertEqual([f["code"] for f in data["findings"]], ["guest_agent_missing"])

    def test_compact_json_small_report_is_complete(self):
        report = Report("dock", "dev")
        report.warning("windows_static_ip", "static IP", addresses=["10.0.0.5"])
        data = json.loads(report.compact_json())
        self.assertEqual(data["findings"][0]["data"], {"addresses": ["10.0.0.5"]})
        self.assertNotIn("truncated", data)


class MountOptionsTest(unittest.TestCase):
    def test_is_readonly_mount(self):
        with tempfile.TemporaryDirectory() as tmp:
            mounts = Path(tmp) / "mounts"
            mounts.write_text("/dev/xvda3 /run/xo-docking/mnt/m1 fuseblk ro,relatime,user_id=0 0 0\n"
                              "/dev/xvda2 /run/xo-docking/mnt/m2 fuseblk rw,relatime,user_id=0 0 0\n")
            self.assertTrue(is_readonly_mount(Path("/run/xo-docking/mnt/m1"), str(mounts)))
            self.assertFalse(is_readonly_mount(Path("/run/xo-docking/mnt/m2"), str(mounts)))
            self.assertFalse(is_readonly_mount(Path("/run/xo-docking/mnt/m3"), str(mounts)))

    def test_ntfs_read_only_fallback_is_an_error(self):
        """ntfs-3g mounts an unclean volume read-only, with success."""
        with tempfile.TemporaryDirectory() as tmp:
            mounts = Mounts(Path(tmp))
            ok = mock.Mock(returncode=0, stdout="", stderr="")
            with mock.patch("xo_docking.mounts.run", return_value=ok), \
                    mock.patch("xo_docking.mounts.is_readonly_mount", return_value=True):
                with self.assertRaises(DockingError) as caught:
                    mounts.mount("/dev/xvda2", "ntfs", readonly=False)
            self.assertEqual(caught.exception.code, "ntfs_unclean")
            self.assertEqual(mounts._stack, [])  # unmounted again

    def test_readonly_never_replays_journals(self):
        self.assertEqual(mount_options("ext4", True), ["ro", "noload"])
        self.assertEqual(mount_options("xfs", True), ["ro", "norecovery"])
        self.assertEqual(mount_options("btrfs", True, ["subvol=@"]), ["ro", "rescue=nologreplay", "subvol=@"])
        self.assertEqual(mount_options("ntfs", True), ["ro"])

    def test_readwrite(self):
        self.assertEqual(mount_options("ext4", False), ["rw"])
        self.assertEqual(mount_options("ntfs", False), [])


class MountsTest(unittest.TestCase):
    def test_mounted_reuses_existing_mount(self):
        ok = mock.Mock(returncode=0)
        with tempfile.TemporaryDirectory() as tmp, mock.patch("xo_docking.mounts.run", return_value=ok):
            mounts = Mounts(tmp)
            target = mounts.mount("/dev/xvda1", "vfat", Path(tmp) / "boot-efi")
            self.assertEqual(mounts.mounted("/dev/xvda1"), target)
            self.assertIsNone(mounts.mounted("/dev/xvda2"))
            mounts.close()
            self.assertIsNone(mounts.mounted("/dev/xvda1"))


if __name__ == "__main__":
    unittest.main()
