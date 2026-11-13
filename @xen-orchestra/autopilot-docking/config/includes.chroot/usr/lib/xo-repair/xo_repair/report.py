"""Report model: findings, planned actions and their outcome.

Detection never modifies anything: it records findings and *plans* actions.
In diagnose mode the planned actions are only reported; in repair mode they
are applied in order.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from typing import Callable

log = logging.getLogger("xo-repair")

# oxenstored (XCP-ng) refuses guest values over quota-maxsize = 2048 bytes:
# the write fails and XO gets no report at all. Keep a safety margin.
XENSTORE_VALUE_LIMIT = 1900

# what XO reads in a report: the rest is only for humans, and dropped first when the report does not fit
XO_OS_KEYS = ("kind", "name", "rtc_timeoffset", "firstboot")
XO_NETWORK_KEYS = ("guid", "dhcp", "addresses")
XO_CODES = frozenset({
    "boot_disk_not_first",
    "install_firstboot",
    "pv_drivers_unsupported",
    "windows_firstboot_incomplete",
    "windows_static_ip_unmapped",
})


@dataclass
class Finding:
    level: str  # info | warning | error
    code: str
    message: str
    data: dict = field(default_factory=dict)


@dataclass
class Action:
    code: str
    description: str
    apply: Callable[[], None] = field(repr=False)
    critical: bool = True
    status: str = "planned"  # planned | applied | failed | skipped
    error: str | None = None


class Report:
    def __init__(self, mode: str, version: str):
        self.mode = mode
        self.version = version
        self.firmware: str | None = None
        self.disks: list[str] = []
        self.tools: str | None = None  # guest tools disk, see tools.py
        self.os: dict = {}
        # TCP/IP configuration of the old adapters (Windows), for XO to reapply
        self.network: list[dict] = []
        self.findings: list[Finding] = []
        self.actions: list[Action] = []

    # -- findings ---------------------------------------------------------
    def _add(self, level: str, code: str, message: str, data: dict) -> None:
        log.log(
            {"info": logging.INFO, "warning": logging.WARNING, "error": logging.ERROR}[level],
            "[%s] %s", code, message,
        )
        self.findings.append(Finding(level, code, message, data))

    def info(self, code: str, message: str, **data) -> None:
        self._add("info", code, message, data)

    def warning(self, code: str, message: str, **data) -> None:
        self._add("warning", code, message, data)

    def error(self, code: str, message: str, **data) -> None:
        self._add("error", code, message, data)

    @property
    def blocked(self) -> bool:
        return any(f.level == "error" for f in self.findings)

    # -- actions ----------------------------------------------------------
    def plan(self, code: str, description: str, apply: Callable[[], None], *, critical: bool = True) -> None:
        log.info("planned: %s (%s)", code, description)
        self.actions.append(Action(code, description, apply, critical))

    def apply_actions(self) -> None:
        for index, action in enumerate(self.actions):
            log.info("applying: %s", action.code)
            try:
                action.apply()
                action.status = "applied"
            except Exception as exc:  # noqa: BLE001 - every failure must be reported
                log.exception("action %s failed", action.code)
                action.status = "failed"
                action.error = str(exc)
                if action.critical:
                    self.error("action_failed", f"{action.code}: {exc}", action=action.code)
                    for remaining in self.actions[index + 1:]:
                        remaining.status = "skipped"
                    return
                self.warning("action_failed", f"{action.code}: {exc}", action=action.code)

    # -- output -----------------------------------------------------------
    def result(self) -> str:
        if self.blocked or any(a.status == "failed" and a.critical for a in self.actions):
            return "error"
        if any(f.level == "warning" for f in self.findings):
            return "warning"
        return "ok"

    def to_dict(self, *, with_details: bool = True, with_data: bool = True, with_messages: bool = True,
                with_info: bool = True) -> dict:
        findings = []
        for f in self.findings:
            if f.level == "info" and not with_info:
                continue
            entry = {"level": f.level, "code": f.code}
            if with_messages:
                entry["message"] = f.message
            if with_data and f.data:
                entry["data"] = f.data
            findings.append(entry)
        actions = []
        for a in self.actions:
            entry = {"code": a.code, "status": a.status}
            if with_messages:
                entry["description"] = a.description
            if a.error and with_messages:
                entry["error"] = a.error
            actions.append(entry)
        return {
            "version": self.version,
            "mode": self.mode,
            "result": self.result(),
            "firmware": self.firmware,
            "disks": self.disks,
            "tools": self.tools,
            "os": self.os if with_details else {k: self.os[k] for k in XO_OS_KEYS if k in self.os},
            "network": self.network if with_details else [
                {k: adapter[k] for k in XO_NETWORK_KEYS if k in adapter}
                # XO only matches the static adapters with the cards of the source
                for adapter in self.network if not adapter.get("dhcp") and adapter.get("addresses")
            ],
            "findings": findings,
            "actions": actions,
        }

    def full_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)

    def compact_json(self, limit: int = XENSTORE_VALUE_LIMIT) -> str:
        """Smallest faithful summary that fits in a xenstore value.

        Detail is dropped progressively; codes are always kept because XO
        relies on them, messages are only for humans.
        """
        variants = (
            {"with_details": True, "with_data": True, "with_messages": True, "with_info": True},
            {"with_details": False, "with_data": True, "with_messages": True, "with_info": True},
            {"with_details": False, "with_data": False, "with_messages": True, "with_info": True},
            {"with_details": False, "with_data": False, "with_messages": True, "with_info": False},
            {"with_details": False, "with_data": False, "with_messages": False, "with_info": False},
        )
        for options in variants:
            text = json.dumps(self.to_dict(**options), separators=(",", ":"))
            if len(text.encode()) <= limit:
                return text
        data = self.to_dict(with_details=False, with_data=False, with_messages=False, with_info=False)
        data["truncated"] = True
        while len(json.dumps(data, separators=(",", ":")).encode()) > limit:
            longest = max(("findings", "actions"), key=lambda k: len(data[k]))
            if not data[longest]:
                break
            _drop_one(data[longest])
        return json.dumps(data, separators=(",", ":"))


def _is_relied_on(entry: dict) -> bool:
    """A finding or an action XO acts on, or which tells why the run failed."""
    return entry.get("level") == "error" or entry.get("status") == "failed" or entry["code"] in XO_CODES


def _drop_one(entries: list[dict]) -> None:
    """Drops the last entry XO does not rely on, the last one when it relies on all of them."""
    for index in range(len(entries) - 1, -1, -1):
        if not _is_relied_on(entries[index]):
            del entries[index]
            return
    entries.pop()
