"""Mount tracking: every mount is undone in reverse order on exit."""

from __future__ import annotations

import logging
import time
from pathlib import Path

from .util import RepairError, run

log = logging.getLogger("xo-repair")

# ntfs-3g exit codes worth explaining to the user
NTFS3G_ERRORS = {
    14: ("windows_hibernated",
         "Windows is hibernated or was stopped with Fast Startup; do a full shutdown on the source"),
    15: ("ntfs_unclean",
         "the NTFS volume was not cleanly unmounted; run chkdsk on the source"),
}


def mount_options(fstype: str, readonly: bool, extra=()) -> list[str]:
    """Options guaranteeing a read-only mount does not write (no journal replay)."""
    if fstype == "ntfs":
        options = ["ro"] if readonly else []
    else:
        options = ["ro" if readonly else "rw"]
        if readonly:
            if fstype in ("ext3", "ext4"):
                options.append("noload")
            elif fstype == "xfs":
                options.append("norecovery")
            elif fstype == "btrfs":
                options.append("rescue=nologreplay")
    options.extend(o for o in extra if o)
    return options


def is_readonly_mount(target: Path, mounts_file: str = "/proc/self/mounts") -> bool:
    """Whether the filesystem mounted on `target` is read-only."""
    try:
        lines = Path(mounts_file).read_text().splitlines()
    except OSError:
        return False
    wanted = str(Path(target).resolve())
    for line in reversed(lines):  # the last mount on a path hides the others
        fields = line.split()
        if len(fields) >= 4 and fields[1].replace("\\040", " ") == wanted:
            return "ro" in fields[3].split(",")
    return False


class Mounts:
    def __init__(self, base: str | Path = "/run/xo-repair/mnt"):
        self.base = Path(base)
        self._stack: list[tuple[Path, bool]] = []  # (target, is_fuse)
        self._devices: dict[Path, str] = {}  # target -> device, bind mounts excluded
        self._counter = 0

    def __enter__(self) -> "Mounts":
        return self

    def __exit__(self, *exc) -> None:
        self.close()

    def new_dir(self, label: str = "m") -> Path:
        self._counter += 1
        path = self.base / f"{label}{self._counter}"
        path.mkdir(parents=True, exist_ok=True)
        return path

    def mount(self, device: str, fstype: str, target: Path | None = None, *,
              readonly: bool = True, options=()) -> Path:
        target = Path(target) if target else self.new_dir()
        opts = mount_options(fstype, readonly, options)
        if fstype == "ntfs":
            cmd = ["ntfs-3g"] + (["-o", ",".join(opts)] if opts else []) + [device, str(target)]
            proc = run(cmd, check=False)
            if proc.returncode != 0:
                code, message = NTFS3G_ERRORS.get(
                    proc.returncode,
                    ("ntfs_mount_failed", f"ntfs-3g exited with status {proc.returncode}"),
                )
                raise RepairError(code, f"{device}: {message}")
        else:
            proc = run(["mount", "-t", fstype, "-o", ",".join(opts), device, str(target)], check=False)
            if proc.returncode != 0:
                raise RepairError("mount_failed", f"cannot mount {device} ({fstype}) on {target}")
        self._stack.append((target, fstype == "ntfs"))
        self._devices[target] = device
        if fstype == "ntfs" and not readonly and is_readonly_mount(target):
            # ntfs-3g falls back to read-only, with success, on a volume left unclean by a power off:
            # every later write would fail, after the hives were already changed in memory
            self.umount(target)
            raise RepairError("ntfs_unclean",
                              f"{device}: the NTFS volume was not cleanly shut down (powered off, or the VM was "
                              "imported while running), ntfs-3g only mounts it read-only. Shut Windows down "
                              "cleanly on the source, or boot it once, then import it again")
        return target

    def mounted(self, device: str) -> Path | None:
        """Where `device` is already mounted by us (e.g. the ESP under the guest's /boot/efi)."""
        real = Path(device).resolve()
        return next((t for t, d in self._devices.items() if Path(d).resolve() == real), None)

    def bind(self, source: str | Path, target: Path) -> Path:
        run(["mount", "--bind", str(source), str(target)])
        self._stack.append((Path(target), False))
        return Path(target)

    def umount(self, target: Path) -> None:
        for index in range(len(self._stack) - 1, -1, -1):
            if self._stack[index][0] == Path(target):
                entry = self._stack.pop(index)
                self._devices.pop(entry[0], None)
                self._umount(*entry)
                return

    def close(self) -> None:
        while self._stack:
            self._umount(*self._stack.pop())
        self._devices.clear()
        run(["sync"], check=False)

    @staticmethod
    def _umount(target: Path, fuse: bool) -> None:
        if run(["umount", str(target)], check=False).returncode != 0:
            log.warning("umount %s failed, detaching lazily", target)
            run(["umount", "-l", str(target)], check=False)
        if fuse:
            _wait_fuse_exit(target)


def _wait_fuse_exit(target: Path, timeout: int = 120) -> None:
    """ntfs-3g flushes after umount returns: wait for its process to exit."""
    deadline = time.monotonic() + timeout
    needle = str(target).encode() + b"\x00"  # cmdline arguments are NUL-terminated
    while time.monotonic() < deadline:
        busy = False
        for cmdline in Path("/proc").glob("[0-9]*/cmdline"):
            try:
                content = cmdline.read_bytes()
            except OSError:
                continue
            if b"ntfs-3g" in content and needle in content:
                busy = True
                break
        if not busy:
            return
        time.sleep(0.5)
    log.warning("ntfs-3g for %s still running after %ss", target, timeout)
