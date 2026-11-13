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
        text = SCRIPT.read_text()
        # a VM started by hand is never left stopped: the guest reboots by default
        self.assertIn("'reboot' = 'guest'", text)
        self.assertIn("if ($script:Config['reboot'] -eq 'xo')", text)
        self.assertIn("shutdown.exe /s ", text)

    def test_failed_attempt_retried_at_once_when_xo_follows(self):
        body = function_body("Stop-Attempt")
        retry = body[body.index("elseif ($script:Config['reboot'] -eq 'xo')"):]
        # a reboot: a shut down would be taken by XO for the end of the phase
        self.assertIn("shutdown.exe /r ", retry)
        self.assertNotIn("shutdown.exe /s", body)


if __name__ == "__main__":
    unittest.main()
