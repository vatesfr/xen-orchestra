"""Shared helpers: errors, command execution and guest path resolution."""

from __future__ import annotations

import logging
import os
import shlex
import subprocess
from pathlib import Path

log = logging.getLogger("xo-repair")

# Environment used for every command run inside the guest (chroot).
CHROOT_ENV = {
    "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
    "LANG": "C",
    "LC_ALL": "C",
    "HOME": "/root",
}


class RepairError(Exception):
    """Error carrying a stable, machine-readable code for the report."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


def _last_line(text: str) -> str:
    lines = [line for line in text.strip().splitlines() if line.strip()]
    return lines[-1] if lines else ""


def run(cmd, *, check: bool = True, timeout: int = 3600, env: dict | None = None):
    """Run a command, log its output at debug level, raise RepairError on failure."""
    cmd = [str(c) for c in cmd]
    log.info("$ %s", shlex.join(cmd))
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            errors="replace",
            timeout=timeout,
            env=env,
        )
    except FileNotFoundError as exc:
        raise RepairError("missing_tool", f"{cmd[0]} is not available") from exc
    except subprocess.TimeoutExpired as exc:
        raise RepairError("command_timeout", f"{cmd[0]} timed out after {timeout}s") from exc
    for stream in (proc.stdout, proc.stderr):
        for line in stream.splitlines():
            log.debug("  %s", line)
    if check and proc.returncode != 0:
        detail = _last_line(proc.stderr) or _last_line(proc.stdout)
        raise RepairError(
            "command_failed", f"{cmd[0]} exited with status {proc.returncode}: {detail}"
        )
    return proc


def chroot_run(root: Path, cmd, **kwargs):
    """Run a command with the guest's own binaries, inside its root."""
    return run(["chroot", str(root), *cmd], env=CHROOT_ENV, **kwargs)


def resolve_in_root(root: Path, path: str) -> Path:
    """Resolve `path` the way the guest would, following symlinks inside `root`.

    Absolute symlinks (e.g. /lib -> /usr/lib) must not escape to the live system.
    """
    pending = [p for p in path.split("/") if p and p != "."]
    resolved: list[str] = []
    hops = 0
    while pending:
        part = pending.pop(0)
        if part == "..":
            if resolved:
                resolved.pop()
            continue
        candidate = root.joinpath(*resolved, part)
        if candidate.is_symlink():
            hops += 1
            if hops > 40:
                raise RepairError("symlink_loop", f"too many symlinks while resolving {path}")
            target = os.readlink(candidate)
            if target.startswith("/"):
                resolved = []
            pending = [p for p in target.split("/") if p and p != "."] + pending
            continue
        resolved.append(part)
    return root.joinpath(*resolved)


def guest_read(root: Path, path: str) -> str | None:
    """Read a text file from the guest, or None if it does not exist."""
    target = resolve_in_root(root, path)
    try:
        return target.read_text(errors="replace")
    except (FileNotFoundError, IsADirectoryError, NotADirectoryError, PermissionError):
        return None


def guest_exists(root: Path, path: str) -> bool:
    return resolve_in_root(root, path).exists()


def find_ci(base: Path | None, *parts: str) -> Path | None:
    """Case-insensitive path lookup (NTFS and FAT content seen from Linux)."""
    current = base
    for part in parts:
        if current is None or not current.is_dir():
            return None
        exact = current / part
        if exact.exists():
            current = exact
            continue
        wanted = part.lower()
        try:
            current = next((c for c in current.iterdir() if c.name.lower() == wanted), None)
        except OSError:
            return None
    return current


def kernel_cmdline_param(name: str, cmdline_path: str = "/proc/cmdline") -> str | None:
    """Return the value of `name=value` on the kernel command line ("" for a bare flag)."""
    try:
        args = Path(cmdline_path).read_text().split()
    except OSError:
        return None
    for arg in args:
        key, sep, value = arg.partition("=")
        if key == name:
            return value if sep else ""
    return None
