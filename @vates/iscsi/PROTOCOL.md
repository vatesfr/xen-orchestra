# Protocol coverage

`@vates/iscsi` implements a deliberately narrow subset of iSCSI (RFC 7143, formerly RFC 3720) and the SCSI
command set it carries (SPC-3 primary commands, SBC-3 block commands) — enough to serve or consume exactly one
read/write LUN over a single connection, not a general-purpose iSCSI stack. This is the detailed companion to
the README's "Scope" section, verified directly against the source (`constants.mts`, `login.mts`,
`connection.mts`, `types.mts`, `initiator.mts`, `chap.mts`) rather than inferred.

The package has two independent roles with very different maturity:

- **Target** (`IscsiTarget`) — the primary, production-used role (backs `@xen-orchestra/mixins/live-mount`).
  Handles real-world Linux/XCP-ng initiators robustly: concurrent commands, real write ordering, keepalives,
  connection recovery.
- **Initiator** (`IscsiInitiator`) — a minimal, read-only client used to read from a third-party array as a
  disk source. Built against `IscsiTarget` and standard-tooling targets (`tgt`); interop testing this session
  found it does **not** complete login against a LIO kernel target (see below) — a real, previously-unknown
  gap, not yet fixed.

## Session and connection

| Aspect                          | Target                                                                                                                                                                                                                                                                                           | Initiator                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| Connections per session         | `MaxConnections=1`, enforced                                                                                                                                                                                                                                                                     | opens exactly one            |
| Session reinstatement           | **no** — no ISID tracking; a new connection always tears down and replaces whatever connection currently exists, rather than RFC 7143's ISID-matched reinstatement (see `index.mts`'s class doc for the reasoning: safe here because the target is ephemeral, single-consumer, and CHAP-guarded) | n/a (single connection)      |
| Multiple LUNs                   | **no** — exactly one LUN, always LUN 0                                                                                                                                                                                                                                                           | reads are hardcoded to LUN 0 |
| `ErrorRecoveryLevel`            | `0` only                                                                                                                                                                                                                                                                                         | requests `0`                 |
| Header/data digests             | `HeaderDigest=None`, `DataDigest=None` — no CRC32C on the wire                                                                                                                                                                                                                                   | same                         |
| Markers (`IFMarker`/`OFMarker`) | not offered (RFC-deprecated)                                                                                                                                                                                                                                                                     | not offered                  |

## Login / text negotiation

**Target** (`login.mts`) reactively answers whatever the initiator proposes, fixed to:
`HeaderDigest=None`, `DataDigest=None`, `MaxConnections=1`, `InitialR2T=Yes`, `ImmediateData=No`,
`ErrorRecoveryLevel=0`, `DataPDUInOrder=Yes`, `DataSequenceInOrder=Yes`, `DefaultTime2Wait=2`,
`DefaultTime2Retain=0`, `MaxOutstandingR2T=1` — `MaxBurstLength`/`FirstBurstLength` are the only two keys
actually negotiated down from the initiator's offer (capped at an internal maximum). Both `Normal` and
`Discovery` session types are supported (`SessionType`), with CHAP skipped for `Discovery` per RFC — text-mode
negotiation beyond that is limited to `SendTargets` discovery (`#handleText`), not general text negotiation.

**Initiator** (`initiator.mts#operationalLogin`) sends exactly **one** operational-stage login PDU proposing
its own fixed key set (`HeaderDigest=None`, `DataDigest=None`, `InitialR2T=Yes`, `ImmediateData=No`,
`ErrorRecoveryLevel=0`, `MaxRecvDataSegmentLength`) with the transit bit (`T=1`) set immediately, and only
checks whether the reply also has `T=1` — there is no second round to answer a target's own counter-proposed
keys if it declines transit on the first exchange.

- Works against `tgt` and against this package's own `IscsiTarget` — both transit on the first round.
- **Does not complete against a LIO kernel target** (`targetcli-fb`): LIO counter-proposes its own operational
  keys (`MaxBurstLength`, `DefaultTime2Wait`, `DefaultTime2Retain`, `MaxOutstandingR2T`) in the same response
  and withholds transit until they're answered — confirmed directly via `dmesg`:
  ```
  No response for proposed key "MaxBurstLength".
  iSCSI Login negotiation failed.
  ```
  This is a real, previously-unexercised limitation of the initiator's login state machine (single
  operational round-trip only), not a bug on LIO's side. Worth weighing given the initiator's real intended
  use — reading from unknown-strictness third-party array software, not `tgt`/this package's own target.

## Authentication (CHAP)

- One-way only (RFC 1994, algorithm MD5 — the only one RFC 7143 defines, so this isn't a partial
  implementation of a wider set).
- **Target as authenticator**: when `chap` is configured, every login must present the right `CHAP_N`/`CHAP_R`
  or the login is rejected (`INITIATOR_ERROR`/`AUTHENTICATION_FAILURE`). Interop-tested against the real
  `open-iscsi` kernel initiator (both correct-secret and wrong-secret paths).
- **Initiator as responder**: when `chap` is configured, answers a target's challenge with the same MD5
  scheme. Never issues its own challenge.
- **Not supported**: mutual (two-way) CHAP in either role — a target that _requires_ mutual auth will reject
  the initiator's login, surfaced as a normal login failure rather than attempted.

## SCSI commands

Decoded explicitly (`types.mts#decodeCdb`); anything else maps to `unsupported` → `CHECK CONDITION` /
`ILLEGAL_REQUEST` / `INVALID COMMAND OPERATION CODE`:

| Command             | Variants                                                         |
| ------------------- | ---------------------------------------------------------------- |
| `INQUIRY`           | standard + EVPD (vendor/product/revision/serial from `identity`) |
| `REPORT LUNS`       |                                                                  |
| `READ CAPACITY`     | `(10)` and `(16)`                                                |
| `READ`              | `(10)` and `(16)`                                                |
| `WRITE`             | `(10)` and `(16)`                                                |
| `TEST UNIT READY`   |                                                                  |
| `REQUEST SENSE`     |                                                                  |
| `MODE SENSE`        | `(6)` and `(10)`                                                 |
| `SYNCHRONIZE CACHE` | `(10)` and `(16)` — flushes the backing `BlockDevice`            |

**Not implemented**: persistent reservations, VAAI/thin-provisioning primitives (`UNMAP`, `WRITE SAME`, `COMPARE
AND WRITE`, ...), any vendor-specific commands — anything beyond the ~10 commands a Linux initiator actually
issues to attach and use a plain block device.

## Data transfer

- **Read**: `Data-In`, concurrent commands dispatched up to `readConcurrency` (default 16) regardless of the
  advertised command window — bounds how many `lun.read()` calls run at once against the real backend.
  Residual under/overflow reported against the CDB's requested transfer length.
- **Write**: always solicited (`InitialR2T=Yes`, `ImmediateData=No`) — every write goes through `R2T` →
  `Data-Out`, one outstanding R2T at a time (`MaxOutstandingR2T=1`). `Data-Out` PDUs are routed by Initiator
  Task Tag, so writes/reads for different commands can interleave; within one write, out-of-order or
  overlapping `Data-Out` segments are rejected outright (`writePath.mts`) rather than silently accepted, to
  avoid leaking uninitialized staging-buffer memory to the LUN (a real bug this was hardened against — see
  `VALIDATION.md`).
- **Not implemented**: unsolicited/immediate data, `MaxOutstandingR2T > 1`.

## Task management, error recovery, keepalives

- **SCSI Task Management** (`ABORT TASK`, `LUN RESET`, etc.) — not implemented; any `SCSI Task Mgmt Request`
  is rejected (`COMMAND_NOT_SUPPORTED`).
- **SNACK** (retransmission requests, part of `ErrorRecoveryLevel > 0`) — not implemented; rejected the same
  way. Consistent with `ErrorRecoveryLevel=0` — nothing should ever need to SNACK.
- **NOP / keepalives**:
  - Target replies to an initiator-sent `NOP-Out` ping, but does **not** proactively send its own periodic
    `NOP-In` probes (no `nop_interval` equivalent) — it relies entirely on the initiator (or TCP-level
    connection loss) to notice a dead peer.
  - Initiator answers a target-initiated `NOP-In` ping with `NOP-Out` and keeps its read loop draining for the
    life of the connection specifically so it never misses one (this was a real, fixed bug — see
    `VALIDATION.md`, item 5).

## Summary: not implemented

Mutual (two-way) CHAP · SCSI Task Management (abort/reset) · target-initiated NOP-In keepalives · multiple
connections per session · multiple LUNs · session reinstatement (ISID) · header/data digests · unsolicited
data / `MaxOutstandingR2T>1` · SNACK/error recovery beyond level 0 · persistent reservations and VAAI-style
primitives · general text-mode negotiation beyond `SendTargets` · initiator-side multi-round operational login
negotiation (works against this package's own target and `tgt`; does not against LIO — see above).
