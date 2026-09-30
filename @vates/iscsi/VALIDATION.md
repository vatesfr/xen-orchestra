# Validation notes

Extracted from a longer production-readiness pass covering both this package and the `LiveMount` mixin that
consumes it; this file keeps only what's specific to `@vates/iscsi` itself — protocol-level correctness,
concurrency, and interop with standard tooling. Local testing notes covering the LiveMount/XAPI integration,
VM boot mechanics, and deployment specifics live elsewhere and aren't reproduced here.

## Bugs found and fixed

### In this validation pass

1. **Read-path error isolation** (`scsi.mts`) — `lun.read()` failures were previously uncaught, killing the
   whole connection for one bad block. Now wrapped in try/catch, reporting `CHECK_CONDITION`/`MEDIUM_ERROR` for
   that command only, mirroring the write path's existing `#handleDataOut` error handling.
   - Unit test: `scsi.test.mts` — "reports a failed lun.read() as CHECK CONDITION / MEDIUM ERROR, not an
     uncaught throw".
   - Regression test: `loopback.integ.mts`, `describe('READ error isolation', ...)` — a LUN whose `read()`
     throws for one LBA still returns `CHECK_CONDITION` for that command; the connection stays alive and a
     different, healthy LBA read afterward still succeeds.

2. **Connection replacement instead of refusal** (`index.mts`) — found via a real end-to-end guest-boot test
   against an S3-backed backup repository: `IscsiTarget#onConnection` used to permanently _refuse_ any new
   connection while an existing one was tracked (`MaxConnections=1` enforcement), with no way to tell a
   genuinely stale/abandoned connection (initiator gave up and reconnected without ever closing the old TCP
   socket) from a healthy one still in use. Under a slow backend this wedges the mount forever: the host's
   initiator times out and retries, gets refused, retries again, forever — reproduced live as an 8+ minute
   guest boot stall, `WARN refusing concurrent connection (MaxConnections=1)` repeating in the log the whole
   time. Now a new connection always tears down whatever connection currently exists and takes over, rather
   than being refused. Deliberately not full RFC 7143 session reinstatement (no ISID matching) — chosen as the
   simpler, sufficient fix for this target's single-consumer, ephemeral, CHAP-guarded design; see the class doc
   comment in `index.mts` for the reasoning and the more rigorous alternative considered.
   - Regression test: `loopback.integ.mts`, `describe('connection replacement', ...)` — a second connection is
     accepted (not refused) while the first is still open, the first's socket gets torn down, and the new
     connection is fully usable (read + logout succeed).
   - Re-verified end-to-end after deploying the fix: same S3-backed boot scenario completed successfully
     (~5 min total, vs ~20-25s for the equivalent local-storage boot — S3 itself is slow, but the mount no
     longer wedges).

### Independently landed, cross-referenced against this pass's coverage

Five more fixes landed on this branch outside this validation effort. Read in full and checked against what
had (and hadn't) actually been exercised black-box, since two are severe:

1. **`CachedDiskBlockDevice.mts` — acknowledged writes silently and permanently reverted.** A write fully
   covering a not-yet-cached block used to skip fetching the source (an "optimization" — the write supplies
   all the bytes anyway). But if a _read_ to that same block had already triggered an in-flight fetch, that
   fetch could land **after** the write and silently overwrite it with stale source data — guest gets `GOOD`,
   data reverts moments later. Fixed by always joining any in-flight fetch before writing. Has a white-box
   regression test (pauses a fake disk mid-fetch to force the race). This is exactly the class of bug this
   whole effort was looking for, and its vulnerable path — read+write racing on the same never-touched block —
   was never actually exercised by this pass's own earlier black-box testing (sequential `dd` and single-job
   `fio` both avoid same-offset self-overlap by construction), so the "clean" results up to that point were
   consistent with the bug being present, not proof of its absence. Closed that gap afterward (see below).

2. **`connection.mts`/`writePath.mts` — uninitialized heap memory leaked to the LUN on a malformed Data-Out.**
   Staging buffer is `Buffer.allocUnsafe`, never zeroed; the old completion check summed received bytes, but
   `Buffer.copy` silently clamps on out-of-range/overlapping offsets — a malformed/out-of-order Data-Out
   sequence could reach "totalLength received" with gaps of recycled heap memory that then get written to the
   LUN and read back by any guest. Real info-disclosure bug, needs a misbehaving/malicious initiator to trigger
   (a well-behaved one never sends malformed Data-Out). Fixed with strict contiguity validation; extensively
   tested (`connection.test.mts` +586 lines, `writePath.test.mts` +168 lines, both white-box, covering the
   malformed-input space directly — not something black-box testing with real tooling can easily reach at all).

3. **`connection.mts` — CmdSN window corrupted by every Data-Out (i.e. every write).** Command-window tracking
   read bytes 24-27 as CmdSN off every inbound PDU, but those bytes are reserved on Data-Out per RFC 7143
   §11.7 — every write rewound the advertised window. Benign at normal scale (initiators discard the rewind as
   stale via serial-number comparison until session CmdSN passes 2³¹) — none of this pass's testing came close
   to that scale, so nothing here calls prior results into question. Fixed with an opcode allowlist; has its
   own regression test.

4. **`CachedDiskBlockDevice.hydrate()` — no longer throws/orphans on a concurrent unmount.** `hydrate()` now
   accepts an `AbortSignal`, stopping at the next block boundary and rejecting cleanly once in-flight blocks
   settle, rather than the caller having to serialize hydrate against unmount itself (the orchestration half of
   this fix — not running hydrate inside the same long-lived task as the mount — lives in the LiveMount mixin,
   outside this package). Tested at the `CachedDiskBlockDevice` level: aborting mid-hydrate keeps everything
   already cached, rejects rather than silently returning partial success, and a fresh signal that's already
   aborted refuses to start at all.

5. **`initiator.mts` — went silent between commands, dropped by a target's ping timeout.** `IscsiInitiator`'s
   read loop used to stop once nothing was outstanding, so during any idle period a target's NOP-In keepalive
   sat unread — real targets (LIO's `nopin_response_timeout`, 30s by default) drop sessions with unanswered
   pings, with no reconnect logic to recover. Fixed with a loop that keeps draining for the life of the
   connection and replies to NOP-In pings (`#pump`/`#replyNop`); added `initiator.integ.mts` (white-box,
   real loopback). Never exercised by this pass's own black-box testing at all — the whole effort was
   LiveMount-focused, which only ever uses the _target_ role. Attempting to close that gap surfaced two
   further, independent findings — see "Initiator interop findings" below.

## Black-box protocol-level testing (standalone target, real tooling)

- **Data integrity under concurrent load**: 30-minute `fio --rw=randrw --bs=4k --iodepth=64 --numjobs=1
--verify=crc32c` soak against the standalone target over real `iscsiadm` loopback — 0 verify errors, ~16.4k
  read + ~10.6k write IOPS sustained throughout. (An earlier `numjobs=4` run produced ~116 "bad header"
  errors; bisected and reproduced identically against plain local file I/O with zero iSCSI involvement —
  a known fio limitation where independent jobs pointed at the same file race each other's own bookkeeping,
  not a target bug. `numjobs=1` at higher `iodepth` avoids the false positive while still exercising real
  queue depth.)
- **Filesystem round-trip across a full session teardown**: real corpus (2419 files, 53 MB) written, hashed,
  then a full cold logout/login cycle plus a host-side page-cache drop before re-reading — all 2419 files
  byte-identical.
- **Kill the target process mid-write**: `kill -9`'d mid-transfer with a direct-I/O write in flight. The write
  correctly blocked (not a fast, silent "success") until the session recovered, then completed with the exact
  intended pattern across the full range — no silent data loss, no torn/partial write at the interruption point.
- **Real cross-machine network partition** (two separate VMs, not loopback): a mid-transfer `iptables DROP`
  held for 15s against the target's own port. Compared directly to `tgt` as a baseline over the identical
  topology — both stalled through the outage and completed with 0 corrupted bytes once restored; no divergent
  behavior from a mature reference implementation.
- **Sequential throughput vs `tgt`** (same two-VM link, plain iSCSI, no XAPI/SM in the path): `@vates/iscsi`
  reached ~70% (write) / ~76% (read) of `tgt`'s numbers — noticeably slower but the same order of magnitude,
  not a large gap. (A separate, much larger ~10x slowdown measured through the full LiveMount/XAPI/SM stack
  was isolated to the host's own `iscsi` SM/tapdisk driver by elimination — outside this package.)
- **Targeted regression testing for bug 1 above**, using a single-job, high-`iodepth`, small-range `fio`
  pattern (deliberately avoiding the `numjobs>1` false-positive from the first bullet) to force many concurrent
  operations onto the same underlying cache block without needing multiple uncoordinated processes: clean
  (0 verify errors) against local storage, against a slow S3-backed remote (a wider fetch-latency window gives
  a racing write far more time to land mid-fetch — the exact scenario the bug was about), and against an
  actively-running `hydrate()` sweep overlapping guest I/O on the same disk. All three passed.

## Flagged, not fixed

- **`FileBlockDevice.read()` zero-fills past a short/EOF read instead of throwing** — unlike `LocalBlockDevice`
  (the actual production cache backend), which throws on the identical condition. Confirmed via grep: only the
  standalone CLI tool and this package's own tests use `FileBlockDevice` today, so there's no reachable data-
  loss path in production right now — but it's a public export, so a future feature backing a LUN directly
  with a file would silently inherit the zero-fill-over-error behavior. This is a design-intent question (is
  the CLI tool's "sparse tail" leniency deliberate?), not a clear bug — flagging for a decision rather than
  silently changing it.

## Initiator interop findings (this session)

Bug 5's fix (above) had never been exercised against a real target under real conditions — only the white-box
`initiator.integ.mts`. Attempting to close that gap with a live idle-period/NOP-In test against two different
real target implementations surfaced two independent, real findings before the actual keepalive behavior could
be exercised:

- **`tgt` reserves LUN 0 as a built-in, zero-size "controller" device** on every target, and this is not
  removable via `tgtadm` (`tgtadm: this logical unit number already exists` / `invalid request` on any attempt
  to delete or replace it). `IscsiInitiator.connect()`/`read()` are hardcoded to LUN 0 (matching this package's
  own single-LUN-at-0 target design), so `connect()` fails immediately with `CHECK_CONDITION` against `tgt`
  regardless of where a real data LUN is added (tried LUN 1). Pure tooling mismatch — `tgt`'s own convention
  doesn't fit a client that only ever speaks to LUN 0 — not a bug in either side.

- **LIO (`targetcli-fb`/kernel target) does complete login differently, and `IscsiInitiator` can't get through
  it.** With a real data LUN at LUN 0 (LIO doesn't reserve it), `connect()` still fails — `#operationalLogin`
  (`initiator.mts`) sends exactly one operational-stage login PDU, requests immediate transit (`T=1`), and only
  checks the transit bit on the reply; there's no second round to answer a target's own counter-proposal if it
  declines transit on the first exchange. LIO's kernel target does exactly that: it counter-proposes several of
  its own operational keys (`MaxBurstLength`, `DefaultTime2Wait`, `DefaultTime2Retain`, `MaxOutstandingR2T`) in
  the same response and withholds transit until they're answered, confirmed directly in `dmesg`:
  ```
  No response for proposed key "MaxBurstLength".
  No response for proposed key "DefaultTime2Wait".
  No response for proposed key "DefaultTime2Retain".
  No response for proposed key "MaxOutstandingR2T".
  iSCSI Login negotiation failed.
  ```
  This works fine against `tgt` and against this package's own `IscsiTarget` (both transit on the first round),
  so it's never been visible before — but it's a **real, previously-unknown limitation of `IscsiInitiator`'s
  login state machine**: single operational round-trip only, no handling for a target that insists on its own
  multi-round negotiation before agreeing to transit. Worth knowing given the initiator role's real intended
  use (reading from a third-party storage array as an initiator) targets unknown-strictness third-party target
  software, not `tgt` or this package's own target.

Given both blockers are about _login/LUN setup_, not the keepalive mechanism itself, the actual idle-period/
NOP-In behavior could not be exercised live this session. The white-box `initiator.integ.mts` coverage for
bug 5 stands as the only current test of that specific fix.
