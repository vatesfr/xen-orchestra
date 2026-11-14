"""Test helpers: import path, fake guest trees, empty registry hive."""

import base64
import json
import logging
import sys
import zlib
from pathlib import Path

PACKAGE_DIR = Path(__file__).resolve().parents[1] / "config/includes.chroot/usr/lib/xo-docking"
sys.path.insert(0, str(PACKAGE_DIR))

# keep test output readable
logging.getLogger("xo-docking").addHandler(logging.NullHandler())

# Empty registry hive ("minimal" image from the hivex test suite), zlib + base64.
MINIMAL_HIVE = (
    "eNrt2LtKA0EUBuB/Ehdh8bJIiggWK1mwEWu74JUIwUiIgpBK8RIWg0QfYEsfwMZCsPA9tBQrH8EH8AlSOM7ZmSWuScBS8P+W"
    "2Tln+PdCSLPTOzk7hQJkvN+83U8/vippPVhSh1IEtm6jao429rGLDTNfo4cOjhGn9QUuzbyJLWxjzWTqaIH+qqfD1T5/BSIi"
    "IiIiov/h/KjThfu+z2T7AFI/aK278TLCpfW7bO15cpDVTlYnbh71rCkzoijaazZajZXazoGsvXxqfRUDcl3i9hsWlMwTt9IE"
    "yl5bMqOAD/hpV8a86VQhbTzZn1iU2i9Lnwytj8hXxuQrLl/FbC4fDvLB0Lp5uzRv39Wbk7Nfstnva2Pvm8sW5fQzk78PUJvh"
    "f5eIiIiIiIh+7wuThkCS"
)


def write_empty_hive(path: Path) -> Path:
    path.write_bytes(zlib.decompress(base64.b64decode(MINIMAL_HIVE)))
    return path


def make_tree(root: Path, files: dict) -> Path:
    """Create files ({"etc/fstab": "..."}) and symlinks ({"lib": ("symlink", "usr/lib")})."""
    for relpath, content in files.items():
        path = root / relpath
        path.parent.mkdir(parents=True, exist_ok=True)
        if isinstance(content, tuple) and content[0] == "symlink":
            path.symlink_to(content[1])
        elif isinstance(content, bytes):
            path.write_bytes(content)
        else:
            path.write_text(content)
    return root


def lsblk_json(*nodes) -> str:
    return json.dumps({"blockdevices": list(nodes)})


def dev(name, type_="part", children=None, **fields):
    node = {"name": name, "path": f"/dev/{name}", "type": type_, "rm": False, "size": 1 << 30}
    node.update(fields)
    if children:
        node["children"] = children
    return node
