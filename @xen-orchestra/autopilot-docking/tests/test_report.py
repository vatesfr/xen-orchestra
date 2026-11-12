import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import helpers  # noqa: F401  # sets the import path

from xo_repair.mounts import Mounts, is_readonly_mount, mount_options
from xo_repair.util import RepairError
from xo_repair.report import Report


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
        report = Report("repair", "dev")
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

    def test_compact_json_small_report_is_complete(self):
        report = Report("repair", "dev")
        report.warning("windows_static_ip", "static IP", addresses=["10.0.0.5"])
        data = json.loads(report.compact_json())
        self.assertEqual(data["findings"][0]["data"], {"addresses": ["10.0.0.5"]})
        self.assertNotIn("truncated", data)


class MountOptionsTest(unittest.TestCase):
    def test_is_readonly_mount(self):
        with tempfile.TemporaryDirectory() as tmp:
            mounts = Path(tmp) / "mounts"
            mounts.write_text("/dev/xvda3 /run/xo-repair/mnt/m1 fuseblk ro,relatime,user_id=0 0 0\n"
                              "/dev/xvda2 /run/xo-repair/mnt/m2 fuseblk rw,relatime,user_id=0 0 0\n")
            self.assertTrue(is_readonly_mount(Path("/run/xo-repair/mnt/m1"), str(mounts)))
            self.assertFalse(is_readonly_mount(Path("/run/xo-repair/mnt/m2"), str(mounts)))
            self.assertFalse(is_readonly_mount(Path("/run/xo-repair/mnt/m3"), str(mounts)))

    def test_ntfs_read_only_fallback_is_an_error(self):
        """ntfs-3g mounts an unclean volume read-only, with success."""
        with tempfile.TemporaryDirectory() as tmp:
            mounts = Mounts(Path(tmp))
            ok = mock.Mock(returncode=0, stdout="", stderr="")
            with mock.patch("xo_repair.mounts.run", return_value=ok), \
                    mock.patch("xo_repair.mounts.is_readonly_mount", return_value=True):
                with self.assertRaises(RepairError) as caught:
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
        with tempfile.TemporaryDirectory() as tmp, mock.patch("xo_repair.mounts.run", return_value=ok):
            mounts = Mounts(tmp)
            target = mounts.mount("/dev/xvda1", "vfat", Path(tmp) / "boot-efi")
            self.assertEqual(mounts.mounted("/dev/xvda1"), target)
            self.assertIsNone(mounts.mounted("/dev/xvda2"))
            mounts.close()
            self.assertIsNone(mounts.mounted("/dev/xvda1"))


if __name__ == "__main__":
    unittest.main()
