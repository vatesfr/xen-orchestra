import re
import unittest

from helpers import PACKAGE_DIR

SCRIPT = PACKAGE_DIR / "xo_repair/assets/windows/firstboot.ps1"
# "$name:" in a double-quoted string is parsed as a scope-qualified variable
# ($env:X): anything but a real scope is a parse error that rejects the whole script.
SCOPES = {"env", "script", "global", "local", "private", "using", "function", "variable"}
STRING_RE = re.compile(r'"(?:[^"`]|`.)*"')
SCOPED_RE = re.compile(r"\$(\w+):")


def function_body(name: str) -> str:
    match = re.search(rf"^function {re.escape(name)}\b.*?^}}$", SCRIPT.read_text(), re.MULTILINE | re.DOTALL)
    assert match, f"no function {name} in {SCRIPT.name}"
    return match.group(0)


class FirstbootScriptTest(unittest.TestCase):
    def test_no_invalid_scoped_variable(self):
        errors = []
        for lineno, line in enumerate(SCRIPT.read_text().splitlines(), start=1):
            if line.lstrip().startswith("#"):
                continue
            for string in STRING_RE.findall(line):
                for name in SCOPED_RE.findall(string):
                    if name.lower() not in SCOPES:
                        errors.append(f"line {lineno}: ${name}: (use ${{{name}}}:)")
        self.assertEqual(errors, [])

    def test_xenstore_classes(self):
        text = SCRIPT.read_text()
        self.assertIn("'XenProjectXenStoreBase'", text)
        self.assertIn("'vm-data/xo-repair/out/firstboot'", text)

    def test_reboot_left_to_xo(self):
        # a VM started by hand is never left stopped: the guest reboots by default
        self.assertIn("'reboot' = 'guest'", function_body("Read-Config"))
        body = function_body("Restart-Now")
        xo_branch, guest_branch = body.split("if ($script:Config['reboot'] -eq 'xo')")[1].split("exit 0", 1)
        # XO starts the VM again: the guest shuts down; otherwise it reboots itself
        self.assertIn("shutdown.exe /s ", xo_branch)
        self.assertNotIn("shutdown.exe /r", xo_branch)
        self.assertIn("shutdown.exe /r ", guest_branch)
        self.assertNotIn("shutdown.exe /s", guest_branch)

    def test_folder_restricted_before_anything_is_read(self):
        body = function_body("Protect-Base")
        # by SID: the names of the groups are localized
        self.assertIn("'*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F'", body)
        self.assertIn("/inheritance:r", body)
        main = SCRIPT.read_text().split("# -- main --", 1)[1]
        self.assertLess(main.index("Protect-Base"), main.index("Read-Config"))

    def test_packages_only_from_the_restricted_folder(self):
        body = function_body("Find-Package")
        self.assertIn("Join-Path $Base 'packages'", body)
        self.assertNotIn("Win32_LogicalDisk", body)

    def test_failed_attempt_retried_at_once_when_xo_follows(self):
        body = function_body("Stop-Attempt")
        retry = body[body.index("elseif ($script:Config['reboot'] -eq 'xo')"):]
        # a reboot: a shut down would be taken by XO for the end of the phase
        self.assertIn("shutdown.exe /r ", retry)
        self.assertNotIn("shutdown.exe /s", body)


if __name__ == "__main__":
    unittest.main()
