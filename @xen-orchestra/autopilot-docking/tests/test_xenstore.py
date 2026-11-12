import json
import os
import stat
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import helpers  # noqa: F401  # import path

from xo_repair.xenstore import STATUS_PREFIX, Xenstore

# Mimics the xenstore CLI: without -R, values are unescaped on write
# (\\ -> \, \xNN -> byte) and escaped on read.
FAKE = r'''#!/usr/bin/env python3
import json, re, sys
from pathlib import Path
store = Path(__file__).with_name("store.json")
data = json.loads(store.read_text()) if store.exists() else {}
cmd = Path(sys.argv[0]).name
args = sys.argv[1:]
raw = "-R" in args
args = [a for a in args if a != "-R"]
if cmd == "xenstore-write":
    value = args[1] if raw else re.sub(r"\\(x[0-9a-fA-F]{2}|.)",
        lambda m: chr(int(m.group(1)[1:], 16)) if m.group(1)[0] == "x" and len(m.group(1)) == 3 else m.group(1),
        args[1])
    data[args[0]] = value
elif cmd == "xenstore-read":
    if args[0] not in data:
        sys.exit(1)
    print(data[args[0]] if raw else data[args[0]].replace("\\", "\\\\"))
elif cmd == "xenstore-rm":
    data = {k: v for k, v in data.items() if not (k == args[0] or k.startswith(args[0] + "/"))}
store.write_text(json.dumps(data))
'''


class XenstoreTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        bindir = Path(self.tmp.name)
        for name in ("xenstore-read", "xenstore-write", "xenstore-rm"):
            path = bindir / name
            path.write_text(FAKE)
            path.chmod(path.stat().st_mode | stat.S_IXUSR)
        self.store = bindir / "store.json"
        env = mock.patch.dict(os.environ, {"PATH": f"{bindir}{os.pathsep}{os.environ['PATH']}"})
        env.start()
        self.addCleanup(env.stop)
        self.xs = Xenstore(True)

    def tearDown(self):
        self.tmp.cleanup()

    def test_report_with_backslashes_stays_valid_json(self):
        report = json.dumps({"message": r"the ESP already has \EFI\BOOT\BOOTX64.EFI", "x": r"C:\x41"})
        self.assertTrue(self.xs.status("report", report))
        stored = json.loads(self.store.read_text())[f"{STATUS_PREFIX}/report"]
        self.assertEqual(json.loads(stored)["message"], r"the ESP already has \EFI\BOOT\BOOTX64.EFI")
        self.assertEqual(stored, report)

    def test_config_with_backslash_read_raw(self):
        self.xs.write("vm-data/xo-repair/windows-msi-patterns", r"drivers\xen-*.msi")
        self.assertEqual(self.xs.config("windows-msi-patterns"), r"drivers\xen-*.msi")

    def test_clear_status(self):
        self.xs.status("state", "done")
        self.xs.write("vm-data/xo-repair/mode", "repair")
        self.xs.clear_status()
        self.assertEqual(json.loads(self.store.read_text()), {"vm-data/xo-repair/mode": "repair"})


if __name__ == "__main__":
    unittest.main()
