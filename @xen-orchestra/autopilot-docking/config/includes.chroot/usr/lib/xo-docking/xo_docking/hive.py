"""Small wrapper over python3-hivex (offline Windows registry hives)."""

from __future__ import annotations

import gc
import struct
from pathlib import Path

REG_SZ = 1
REG_EXPAND_SZ = 2
REG_DWORD = 4
REG_MULTI_SZ = 7


def _utf16(text: str) -> bytes:
    return (text + "\x00").encode("utf-16-le")


class Hive:
    def __init__(self, path: Path, write: bool = False):
        import hivex  # Debian package python3-hivex, imported lazily for unit tests

        self.path = Path(path)
        self._h = hivex.Hivex(str(path), write=write)

    def close(self) -> None:
        # hivex has no explicit close; the handle (and its mmap) goes with the object
        if self._h is not None:
            self._h = None
            gc.collect()

    # -- navigation --
    def root(self) -> int:
        return self._h.root()

    def child(self, node: int, name: str) -> int | None:
        return self._h.node_get_child(node, name)  # case-insensitive, None if missing

    def node(self, *path: str) -> int | None:
        current = self.root()
        for name in path:
            current = self.child(current, name)
            if current is None:
                return None
        return current

    def children(self, node: int) -> list[tuple[str, int]]:
        return [(self._h.node_name(c), c) for c in self._h.node_children(node)]

    def add_child(self, node: int, name: str) -> int:
        existing = self.child(node, name)
        return existing if existing is not None else self._h.node_add_child(node, name)

    def delete_child(self, node: int) -> None:
        self._h.node_delete_child(node)

    # -- values --
    def _value(self, node: int, key: str) -> int | None:
        wanted = key.lower()
        for value in self._h.node_values(node):
            if self._h.value_key(value).lower() == wanted:
                return value
        return None

    def dword(self, node: int, key: str) -> int | None:
        value = self._value(node, key)
        if value is None or self._h.value_type(value)[0] != REG_DWORD:
            return None
        return self._h.value_dword(value)

    def string(self, node: int, key: str) -> str | None:
        value = self._value(node, key)
        if value is None or self._h.value_type(value)[0] not in (REG_SZ, REG_EXPAND_SZ):
            return None
        return self._h.value_string(value)

    def strings(self, node: int, key: str) -> list[str]:
        value = self._value(node, key)
        if value is None:
            return []
        kind = self._h.value_type(value)[0]
        if kind == REG_MULTI_SZ:
            return [s for s in self._h.value_multiple_strings(value) if s]
        if kind in (REG_SZ, REG_EXPAND_SZ):
            text = self._h.value_string(value)
            return [text] if text else []
        return []

    def set_dword(self, node: int, key: str, number: int) -> None:
        self._h.node_set_value(node, {"key": key, "t": REG_DWORD, "value": struct.pack("<I", number)})

    def set_string(self, node: int, key: str, text: str, *, expand: bool = False) -> None:
        kind = REG_EXPAND_SZ if expand else REG_SZ
        self._h.node_set_value(node, {"key": key, "t": kind, "value": _utf16(text)})

    def set_strings(self, node: int, key: str, texts: list[str]) -> None:
        data = "".join(t + "\x00" for t in texts) + "\x00"
        self._h.node_set_value(node, {"key": key, "t": REG_MULTI_SZ, "value": data.encode("utf-16-le")})

    def commit(self) -> None:
        self._h.commit(None)
