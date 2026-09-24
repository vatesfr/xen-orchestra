> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

<<<<<<< HEAD
=======
- [Backups/Encryption] New error thrown when encryption key is removed from an encrypted remote url (PR [#10339](https://github.com/vatesfr/xen-orchestra/pull/10339))
- [Web-core] Fix "console offline" illustration sparks color (PR [#10309](https://github.com/vatesfr/xen-orchestra/pull/10309))
- [Web-core] Fix 404 illustration color (PR [#10325](https://github.com/vatesfr/xen-orchestra/pull/10325))
- [Backup-archive] No longer create a `cache.json.gz` file on immutable/S3 remote during cleanup, which could not be deleted afterwards and stayed billed forever (PR [#10243](https://github.com/vatesfr/xen-orchestra/pull/10243))
- [Backups] Fix orphaned VM on target after failed transfer (PR [#10369](https://github.com/vatesfr/xen-orchestra/pull/10369))
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
- [REST API] Rolling pool update and rolling pool reboot are now refused while a backup job runs on the pool, like their JSON-RPC counterparts, unless `bypassBackupCheck` is set in the request body (PR [#10313](https://github.com/vatesfr/xen-orchestra/pull/10313))
- [V2V] Consolidating or removing the snapshots of a VM no longer fails with `task execution failed` after one minute: an operation is now given the time it needs (PR [#10363](https://github.com/vatesfr/xen-orchestra/pull/10363))
- [V2V] Fix a failure to read the snapshots of a VM silently transferring the whole disk instead of a delta (PR [#10363](https://github.com/vatesfr/xen-orchestra/pull/10363))
- [V2V] Fix a VM whose controller has no disk on its first slot being imported with a duplicated disk, or in full instead of a delta (PR [#10363](https://github.com/vatesfr/xen-orchestra/pull/10363))
- [V2V] Fix a second import, or the final pass of a warm migration, failing on a disk export server which had already been stopped (PR [#10363](https://github.com/vatesfr/xen-orchestra/pull/10363))
- [V2V] Fix xo-server stopping when `nbdkit` is not installed, or when the connection to the source host is lost during a migration (PR [#10363](https://github.com/vatesfr/xen-orchestra/pull/10363))
- [V2V] Listing the VMs of a host no longer fails entirely when one of them is incomplete, e.g. while being created (PR [#10363](https://github.com/vatesfr/xen-orchestra/pull/10363))
- [V2V] The credentials are no longer sent again on every read of a disk, and a session expiring during a long import is renewed (PR [#10363](https://github.com/vatesfr/xen-orchestra/pull/10363))
- [V2V] The session opened on the source host is now closed when a listing, a migration or a disk export ends, instead of piling up until it expires — a host only accepts a limited number of them (PR [#10363](https://github.com/vatesfr/xen-orchestra/pull/10363))
- [V2V] Report what the source host complained about, instead of `task execution failed` or an assertion error, when an operation fails (PR [#10363](https://github.com/vatesfr/xen-orchestra/pull/10363))
- [xo-server] Set the VM topology to `1 core per socket` when a VM update attempts to apply a CPU static max configuration that is incompatible with the VM topology (PR [#10398](https://github.com/vatesfr/xen-orchestra/pull/10398))
- [Backup] Fix a job combining Rolling Snapshot with Disaster Recovery to an SR of the source VM's pool destroying its own snapshots: the job reported a success but kept fewer snapshots than the configured snapshot retention, usually none (PR [#10395](https://github.com/vatesfr/xen-orchestra/pull/10395))
- [OpenMetrics] Share metrics collection between requests to avoid filling up XOA memory (PR [10401](https://github.com/vatesfr/xen-orchestra/pull/10401))
- [Netbox] Fix IP addresses synced with an incorrect, less specific prefix (e.g. `/8` instead of `/24`) when a shorter container prefix also matched [#10240](https://github.com/vatesfr/xen-orchestra/issues/10240) (PR [#10297](https://github.com/vatesfr/xen-orchestra/pull/10297))
- [backup/restore] Fix backups of a repository randomly disappearing from the list after visiting a VM (PR [#10277](https://github.com/vatesfr/xen-orchestra/pull/10277))
- [Backups] Fix deleteFirst incorrectly disabled for non-distributed replication jobs (PR [#10452](https://github.com/vatesfr/xen-orchestra/pull/10452))
- **XO 5**:
  - [Netdata] Fix `You must enable Javascript` error due to CSP blocking Netdata's inline scripts (PR [#10275](https://github.com/vatesfr/xen-orchestra/pull/10275))

>>>>>>> 1c03d65eb (add changelog)
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

<!--packages-end-->
