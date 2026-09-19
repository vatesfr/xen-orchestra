# Browser-backed ISO streaming prototype

This branch streams a browser-selected ISO through XO's existing iSCSI library to XCP-ng's stock `iscsi` SR driver. No host installation, custom SM driver, nbdkit, or XAPI restart is required. The earlier `browseriso`/`browsernbd` approaches are superseded.

## Data path

Browser `File.slice()` → WebSocket → XO `BrowserIsoDevice` → `@vates/iscsi` target → stock host iSCSI initiator → raw VDI → virtual CD.

The CD is read-only. The ISO stays in the browser; XO has no persistent ISO cache and does not upload the full file before attachment. Host and guest caches still apply. Browser reads are limited to 1 MiB each, target reads to 8 MiB per command, with eight target reads in flight. There are at most 16 sessions, including sessions awaiting cleanup.

The raw iSCSI VDI can back both QEMU's emulated CD and the stock Xen physical block backend. BIOS and UEFI installer startup were demonstrated on XCP-ng 8.3. The [spike report](BROWSER_MEDIA_SPIKE_REPORT.md) records the validation and its limits.

## Dependencies and overlapping work

The implementation uses `@vates/iscsi` from Florent's merged [#10242](https://github.com/vatesfr/xen-orchestra/pull/10242) and the raw-LUN introduction pattern validated in [#10302](https://github.com/vatesfr/xen-orchestra/pull/10302). These dependencies are already in the PR's base; no unmerged dependency is required.

The 185 open XO PRs were checked on 2026-09-19. [#10018](https://github.com/vatesfr/xen-orchestra/pull/10018) still contains writable caching and persistence work; its target/backend interface matches the merged implementation. [#10345](https://github.com/vatesfr/xen-orchestra/pull/10345) concerns restore UI. This PR changes neither the shared iSCSI implementation nor the live-mount mixin.

## Run it

1. Build XO normally, including workspace dependencies: `yarn install --frozen-lockfile`, then `TURBO_TELEMETRY_DISABLED=1 yarn turbo run build --filter xo-server --filter xo-web --filter @xen-orchestra/web`.
2. Set `XO_BROWSER_MEDIA_ENABLED=1` in xo-server's environment.
3. Configure `[iscsi] advertisedAddress` explicitly in xo-server's configuration to the XO address reachable from the XCP-ng hosts. Optionally set `bindAddress` to the local interface on which to listen. This is the same iSCSI configuration section used by live mount; browser media requires an explicit advertised address.
4. Allow the selected host to reach XO's temporary TCP listener. Each session uses an ephemeral port and unique CHAP credentials. This is a direct iSCSI connection, separate from XO's HTTP reverse proxy; ordinary iSCSI is authenticated but not encrypted.
5. Serve XO over HTTPS so browser media uses WSS. The proxy must forward `/api/browser-media/*/socket` WebSocket upgrades and the regular XO API/REST routes. There is no longer a host-facing HTTP range endpoint; `XO_BROWSER_MEDIA_ORIGIN` and `XO_BROWSER_MEDIA_ALLOW_HTTP` are obsolete.
6. As an administrator, select a local ISO from the experimental control in XO 5 or the **Local ISO** panel in XO 6's VM console. Eject any current CD first. A halted VM can have a CD drive created; a running VM needs an existing attached empty CD drive.
7. Start the VM with CD first in its boot order. Keep the browser tab open. Navigation inside the same XO application retains the session; closing/reloading the owning tab disconnects it.
8. Use **Disconnect ISO** or normal CD ejection when finished.

Example configuration:

```toml
[iscsi]
advertisedAddress = '192.168.1.30'
bindAddress = '192.168.1.30'
```

## Host selection and scope

Each session creates one non-shared SR, one PBD, and one raw VDI. A running VM uses its resident host; a halted VM uses a host from `VM.get_possible_hosts`, preferring its affinity when available. Attaching the non-shared media constrains placement to that host. Pool-wide media access and migration are not implemented; do not migrate a VM while it uses browser media.

The stock raw-LUN driver can report `VDI.read_only=false` even when introduction requested true. The CD VBD uses `mode=RO`, and the browser-backed target always rejects writes. Neither `SR.create`, `SR.destroy`, nor `VDI.destroy` is used on the raw LUN.

## Failure and cleanup

Browser loss rejects outstanding reads. The iSCSI target reports an I/O error; it never substitutes zeroes for unavailable content. The API serializes cleanup with attachment, ejects only this session's VDI, unplugs and destroys its PBDs, forgets its SR/VDI metadata, then closes the target. Failed detach is retried while XO remains running. Cleanup-pending sessions retain their resource references and count against the quota.

There is no browser reconnection or persistent crash reconciliation yet. XO restart invalidates sessions and can leave temporary metadata. SRs carry `other_config:xo:browser-media=<session-id>` and a `Browser media:` label. To clean an abandoned session, eject its CD, unplug/destroy its PBDs, and forget its SR. Do not destroy or format its raw LUN. CHAP credentials are ephemeral but visible in PBD configuration to host/pool administrators.

The initial prototype remains administrator-only and opt-in. Full OS installation, multi-host behavior, migration/HA, backup/snapshot interactions, Internet-latency performance, end-to-end memory bounds, and broad UI automation remain unvalidated.

## Checks

```sh
node packages/xo-server/src/browser-media-api.test.mjs
node packages/xo-server/src/browser-media.test.mjs
```

The first suite covers storage lifecycle and rollback with mocked XAPI. The second uses real WebSocket and CHAP-authenticated iSCSI connections, including random/final-sector reads, chunk limits, malformed replies, timeout, disconnect, read-only behavior, and quota retention. Host boot evidence is separate from these automated tests.
