> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [XO6/Vm] Add the VM name to VM related actions that open a modal (PR [#10310](https://github.com/vatesfr/xen-orchestra/pull/10310))
- [XO6] Allow changing which PIF a host uses for its management interface, without deleting and recreating the network config (PR [#10110](https://github.com/vatesfr/xen-orchestra/pull/10110))
- [XO6/SR] Add dedicated Storage Repository page hosts sidepanel (PR [#10140](https://github.com/vatesfr/xen-orchestra/pull/10140))
- [Rolling pool update/reboot] A pool can now skip the phase which brings the VMs back to the host they were running on, which halves the migrations of the run (PR [#10295](https://github.com/vatesfr/xen-orchestra/pull/10295))
- [XO5/Backups] Open the backup job edition form in the same tab when editing a backup job from the VM page (PR [#10342](https://github.com/vatesfr/xen-orchestra/pull/10342))
- [Web-Core/TabItem] Update the component to remove uppercase for better readability (PR [#10338](https://github.com/vatesfr/xen-orchestra/pull/10338))
- [REST API] VDI can now be exported in qcow2 format, and the VHD export uses NBD when available. Both formats work whatever the format the disk is stored in. Every export format, raw included, now provides the size of the download (PR [#10350](https://github.com/vatesfr/xen-orchestra/pull/10350))
- [REST API] SSE now supports Non XAPI objects (user, group, acl-privilege, acl-role, proxy, server, backup-repository, backup-job, schedule) (PR [#10278](https://github.com/vatesfr/xen-orchestra/pull/10278))
- [REST API/SDN Controller, Audit] Traffic rule and audit record routes are now documented in the Swagger/OpenAPI spec (PR [#9895](https://github.com/vatesfr/xen-orchestra/pull/9895))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Web-core] Fix "console offline" illustration sparks color (PR [#10309](https://github.com/vatesfr/xen-orchestra/pull/10309))
- [Web-core] Fix 404 illustration color (PR [#10325](https://github.com/vatesfr/xen-orchestra/pull/10325))
- [Backup-archive] No longer create a `cache.json.gz` file on immutable/S3 remote during cleanup, which could not be deleted afterwards and stayed billed forever (PR [#10243](https://github.com/vatesfr/xen-orchestra/pull/10243))
- [Servers] Fix endless connection attempts to a pool which is already connected through another server entry (PR [#10355](https://github.com/vatesfr/xen-orchestra/pull/10355))
- [Servers] fix a mishandling in the grace period before marking a pool disconnected, this will keep the ui in sync AND not redownload all the xapi object for a transient issue (PR [#10355](https://github.com/vatesfr/xen-orchestra/pull/10355))
- [Rolling pool update/reboot] VMs are brought back to the host they were running on more reliably, and a VM that cannot be moved back no longer fails the whole operation (PR [#10295](https://github.com/vatesfr/xen-orchestra/pull/10295))
- [XO server] Fix current_operations format on host and pool objects (PR [#10283](https://github.com/vatesfr/xen-orchestra/pull/10283))
- [Web-core] Fix "no data" illustration stars color (PR [#10327](https://github.com/vatesfr/xen-orchestra/pull/10327))
- [Backup] Fix `uncaught exception AssertionError: assert(!this.paused)` in the logs, when a host closes a transfer while XO is writing to a slower destination (PR [#10282](https://github.com/vatesfr/xen-orchestra/pull/10282))
- [xo-server] If an HTTP proxy was configured, internal routes (`/openmetrics`, `/v5`) were wrongly routed through it when xo-server listened on a wildcard address. `localhost` targets are now always reached directly, bypassing the HTTP proxy, whether the configured listen address is a wildcard (`0.0.0.0`, `::`) or a specific one (PR [#10335](https://github.com/vatesfr/xen-orchestra/pull/10335))
- [Backups] Fix slow replication startup and fallback to full on qcow2 (PR [#10333](https://github.com/vatesfr/xen-orchestra/pull/10333))
- [REST API/SDN Controller] Fix deleting a non-existent traffic rule wrongly returning success instead of a 404 (PR [#9895](https://github.com/vatesfr/xen-orchestra/pull/9895))
- [xo-server] Fix a memory leak when a client stops reading a proxied response, e.g. a Prometheus scrape of `/openmetrics` reaching its timeout: the request to the proxied service was never closed and its whole response stayed in memory, which could end up in the appliance being OOM-killed (PR [#10388](https://github.com/vatesfr/xen-orchestra/pull/10388))

### Packages to release

> When modifying a package, add it here with its release type.
>
> The format is the following: `- $packageName $releaseType`
>
> Where `$releaseType` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> Keep this list alphabetically ordered to avoid merge conflicts

<!--packages-start-->

- @vates/types minor
- @xen-orchestra/backup-archive patch
- @xen-orchestra/backups patch
- @xen-orchestra/disk-cli patch
- @xen-orchestra/qcow2 minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi patch
- xen-api major
- xo-server minor
- xo-server-audit patch
- xo-server-sdn-controller patch
- xo-web minor

<!--packages-end-->
