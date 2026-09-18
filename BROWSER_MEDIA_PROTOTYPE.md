# Browser-backed virtual ISO prototype

Branches: `feat/browser-virtual-media` in SM and xen-orchestra. No xen-api
modifications are needed by this implementation. The local xen-api checkout
already consumes NBD-only storage attachments and passes a connected Unix socket
to QEMU when changing CD media. NBD-only attachment was verified on the XCP-ng 8.3 lab host; both UEFI and BIOS boot have reached the Debian installer menu.

## Data path

Browser File.slice(offset, offset + length) -> binary WebSocket reply -> XO
HTTPS Range response -> host nbdkit curl plugin -> Unix NBD socket -> read-only tapdisk -> Xen PV CD and QEMU CD.

There is no full ISO upload and no ISO file/cache on the host or XO server.
XO forwards at most 1 MiB per browser read, with at most 16 outstanding reads per
session and 16 sessions per XO process. The OS and nbdkit may have their own
small buffers. The browser file remains open across navigation inside XO 5;
reload, close, sleep or a prolonged connectivity loss disconnects the medium.

## Components

- SM `BrowserISOSR`: `browseriso` driver, read-only VDI metadata and transient
  systemd/nbdkit instances. The Makefile installs its launcher and Python module.
- `SRCommand`: explicit `direct_nbd` opt-in bypasses the tapdisk attachment wrapper.
  The driver explicitly manages a read-only NBD-backed tapdisk for the PV path and returns its NBD endpoint for QEMU. SM tapdisk enumeration accepts the nbd driver type. Existing drivers retain the existing path. This backend advertises no separate
  activation capability; attach starts the adapter and detach stops it.
- XO `browser-media.mjs`: capability-protected HTTP Range and WebSocket relay.
  Separate random capabilities authorize the browser producer and host reader.
- XO `api/browser-media.mjs`: admin-only creation/attachment/disconnection,
  automatically managed pool-shared SR/VDI, rollback and cleanup retries.
- XO 5 `local-iso.js`: file picker beside the CD selector on console/disks pages.
  The control is hidden unless the server explicitly enables the experiment.

## Lab setup

1. Build/install SM from this branch on every host in a disposable test pool. This changes
   shared storage dispatch code, so use normal package deployment and retain the
   previous package for rollback. The new driver must be registered with XAPI;
   follow the host's normal SM plugin discovery/restart procedure and confirm
   `xe sm-list type=browseriso` lists it before trying attachment.
2. Install `nbdkit` and its curl plugin on every pool host. The prototype needs the
   `protocols`, `followlocation`, `timeout`, Unix socket and export-name options.
   In particular, use nbdkit >= 1.26 for `followlocation=false`. This is an
   optional prototype prerequisite, not a new mandatory dependency for every SM
   installation. `nbdkit curl --dump-plugin` should succeed. Verify availability
   in the target host distribution. The lab host needed a separate nbdkit 1.48.1 build with curl support (its repository package lacks the required plugin).
3. Build both xo-server and xo-web from the XO branch with the usual workspace
   build. The xo-server build generates the API index, including `browser-media`.
4. Set `XO_BROWSER_MEDIA_ORIGIN=https://xo.example` in xo-server's environment and
   restart it. This must be the HTTPS origin reachable from every pool host. No path,
   userinfo or query string. Keep TLS verification enabled; the host must trust
   the XO certificate. A reverse proxy must forward WebSocket upgrades and Host
   correctly and allow long-lived WebSockets. Disable access logging for
   `/api/browser-media/` or redact the capability segment.
5. Sign in as an administrator. Use a halted test HVM VM, choose
   **Connect local ISO (experimental)**, and select a local sector-aligned ISO.
   No SR/share setup is required in the UI. If a CD is already inserted, eject it
   first. Connecting while halted is supported and allows creating a missing CD drive. A running VM must already have an attached, empty CD drive; only media insertion/ejection is used, never HVM CD hotplug.
6. Once the filename appears, start the guest and select CD in its firmware boot
   menu (or configure CD-first boot before starting the VM). Keep the browser tab
   open. Browser navigation inside XO does not intentionally close the session.
7. Use **Disconnect ISO**, or eject normally. Normal external ejection is checked
   every 15 seconds. Socket loss revokes the read capability immediately when
   detected; heartbeat/read timeout is 30 seconds. Cleanup ejects this VDI only,
   destroys its metadata, unplugs/destroys its PBDs and forgets its temporary SR.

The SR is named `Browser media: <filename>` and is shared within the pool. XAPI
creates/attaches PBDs on all pool hosts; each PBD plug checks nbdkit/curl and probes
the HTTPS endpoint for the expected size and range support. XO rejects partial
attachment. An adapter starts lazily on each host only when its VDI is attached.
Detaching the source adapter does not revoke the browser session. This enables
the intended shared-media access model, but does not establish migration safety. Do not migrate, suspend, snapshot, or back up a test VM with this
prototype attached. Cold-start and live insertion/ejection have been exercised on one host. UEFI boot is now enabled by the PV backend; resume, HA recovery, migration and other released QEMU/XAPI versions require explicit host tests. This is not a persistent ISO library.

## Failure and cleanup

Read failure returns HTTP 503 (or aborts an already-started response) and becomes
an NBD I/O error. It never substitutes zeroes or silently switches content.
There is no browser reconnection protocol in this version: select the file again.

While XO remains up, cleanup is serialized with attachment and retries every
30 seconds if XAPI/host is unavailable. The browser owns a lease, not permanent
storage. XO restart loses in-memory sessions/cleanup state and invalidates all
capabilities. After an XO crash, inspect `Browser media:` SRs: eject their VDIs,
destroy those VDIs, unplug/destroy their PBDs, then forget the SR. Check
`systemctl list-units 'sm-browseriso-*'` for abandoned adapters and stop only
those belonging to the abandoned session. Never remove unrelated SRs/VDIs.

The media URL is a bearer credential valid only while its session exists. It is
stored in PBD configuration and passed to nbdkit; host/root administrators and
some XAPI/debug logs can see it. SM's normal command log redacts this driver's
configuration, but this is not comprehensive secret handling. Use a trusted lab
and avoid collecting capability URLs in proxy logs. The API is intentionally
admin-only. Production work includes secret storage, unprivileged adapter
execution, persistent crash reconciliation, installation packaging, quotas and
account/session revocation policy.

## Local validation

SM (with the normal bitarray test dependency):

```sh
PYTHONPATH=mocks:libs:misc/fairlock:tests python3 -m unittest test_BrowserISOSR test_SRCommand
```

XO:

```sh
node --test --test-timeout=15000 packages/xo-server/src/browser-media.test.mjs packages/xo-server/src/browser-media-api.test.mjs
```

The relay tests use real local HTTP/WebSocket connections and a simulated browser
that serves deterministic byte ranges. They cover HEAD without upload, concurrent
random reads, bounded large reads, invalid ranges/capabilities, disconnects,
timeouts, malformed responses, attachment rollback and cleanup races. SM tests
mock systemd/nbdkit and verify read-only attachment and dispatch. They do not prove
an actual installer boots.

## Lab findings (2026-09-18)

Host: XCP-ng 8.3, xapi-core 26.1.16, SM 3.2.12, QEMU 4.2.1.
The adapter uses nbdkit 1.48.1 built under `/opt/browser-media-prototype/nbdkit`.
The reversible flat-layout installer is `scripts/prototypes/install-browser-media.py`;
backups of the original dispatcher and XAPI configuration are in
`/root/browser-media-prototype/backup/`. The host also needs `browseriso` in
`/etc/xapi.conf`'s `sm-plugins` allowlist and XAPI plugin discovery/restart.
Subsequent driver updates load on the next SM invocation.

For this trusted LAN lab only, XO runs on HTTP:

```sh
XO_BROWSER_MEDIA_ORIGIN=http://xo.example:8080 XO_BROWSER_MEDIA_ALLOW_HTTP=1 yarn workspace xo-server start
```

Without the explicit opt-in, HTTPS is required. Build xo-server and xo-web,
restart the server, and refresh the browser after UI changes. The experimental
picker appears below the usual CD dropdown.

Verified: shared SR/PBD on the single-host pool, NBD-only QEMU attachment,
byte-exact adapter reads including the final sector, live insert/eject/reinsert,
bounded adapter teardown, cold-start attachment, and BIOS Debian 13 installer
menu and installer kernel/initrd through the language-selection screen from the user's actual browser file. HTTP ranges past EOF must be clamped:
nbdkit curl can request an inclusive end one byte beyond the requested payload.

**UEFI fix verified:** Xen OVMF uses `XenPvBlkDxe` for the CD.
Its `BlockFront.c` publishes a ring, sets frontend state to Connected (4), and
waits for the backend to reach Connected. A fresh UEFI reproduction on this host
showed frontend state 4 with ring-ref/event-channel present, but backend
`vbd3` state 2 (InitWait). The SMAPIv1 wrapper advertises a vbd3 XenDisk alongside
the NBD attachment, while the initial prototype bypassed tapdisk and started only
nbdkit. Consequently there is no PV backend serving the firmware's ring.
QEMU's zero guest-read counters are expected: firmware has not used its emulated
CD. BIOS reaches the installer through QEMU instead. Disabling structured NBD
replies had no effect and is not a fix.

The fix starts a read-only tapdisk using its existing NBD client and returns
that tapdisk's NBD endpoint. The vbd3 backend now reaches Connected (4) and the
UEFI Debian graphical installer reaches language selection from the browser stream. Live eject/reinsert and a hard reboot back to the UEFI menu also passed; eject removed both processes in 0.38 seconds. All 106 targeted SM tests passed. nbdkit uses the
old-style handshake on its private socket for tapdisk compatibility; QEMU uses
tapdisk's ordinary new-style NBD server. Teardown stops tapdisk before nbdkit.
The host's SM parser also needs `nbd` in `Tapdisk.TYPES`; the installer preserves
its existing `qcow2` entry. The original `blktap2.py` is backed up alongside
`SRCommand.py`. Existing attached sessions must be disconnected/reconnected
while halted to adopt this new path. No XO or XAPI restart is needed for this
driver update. This was an integration gap in the prototype, not an established
QEMU/UEFI bug.

Sources:

- https://github.com/tianocore/edk2/blob/edk2-stable202208/OvmfPkg/XenPvBlkDxe/BlockFront.c
- https://github.com/xcp-ng-rpms/edk2/blob/8.3/SPECS/edk2.spec
- Local xen-api: `ocaml/xapi/storage_smapiv1.ml` (`VDI.attach2` implementations).

Rollback: disconnect prototype sessions, stop their adapters, restore the backed-up
SM dispatcher, `blktap2.py`, and `xapi.conf`, remove only the two installed BrowserISOSR driver
files, and perform XAPI plugin rediscovery/restart during a suitable maintenance
window. The isolated nbdkit prefix can be removed once no adapter uses it.

## Host acceptance checks still required

- Verify NBD-only attachment support in the installed XAPI/xenopsd version.
- Shared PBD attach on all hosts, partial failure rollback, and simultaneous
  reads from source/destination adapters without source detach revoking media.
- Live insert/eject and repeated reconnect, with no orphan service/socket/VDI/SR.
- BIOS and UEFI installer boots; guest reboot during installation.
- Byte-exact read/hash through a real nbdkit curl adapter, including the last sector.
- Tab close, browser sleep, proxy disconnect and host/XO restart behavior.
- Unavailable host during cleanup, and failed insertion after SR/VDI creation.
- Record bytes transferred and peak memory; large ISOs must not trigger full
  upload or an unbounded cache. Measure latency before adding read-ahead/caching.
