> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [MCP] Support token authentication via `XO_TOKEN` environment variable as an alternative to username/password (PR [#9577](https://github.com/vatesfr/xen-orchestra/pull/9577))
- [MCP] Add `list_vdis` tool to list virtual disks (PR [#9559](https://github.com/vatesfr/xen-orchestra/pull/9559))
- [Replication] Reuse the same VM as an incremental replication target (PR [#9524](https://github.com/vatesfr/xen-orchestra/pull/9524))
- [S3] add configuration for max/minPartSize and maxPartNumber in the API (PR [#9561](https://github.com/vatesfr/xen-orchestra/pull/9561))
- [REST API] Expose `/rest/v0/vms/:id/actions/clone` (PR [#9453](https://github.com/vatesfr/xen-orchestra/pull/9453))
- [REST API] Expose POST `/rest/v0/srs/:id/actions/forget` (PR [#9505](https://github.com/vatesfr/xen-orchestra/pull/9505))
- [REST API] Add `POST /hosts/{id}/actions/disable` and `POST /hosts/{id}/actions/enable` endpoints (PR [#9532](https://github.com/vatesfr/xen-orchestra/pull/9532))
- [OpenMetrics] Add missing VBD throughput, VBD average latency, and DCMI power consumption metrics (PR [#9563](https://github.com/vatesfr/xen-orchestra/pull/9563))
- [MCP] Add `list_networks` and `get_network_details` tools to query network resources (PR [#9595](https://github.com/vatesfr/xen-orchestra/pull/9595))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup] Reduce backup memory consumption (PR [#9557](https://github.com/vatesfr/xen-orchestra/pull/9557))
- [VM/New] VCPU was ignored [Forum#11954](https://xcp-ng.org/forum/topic/11954/unable-to-define-count-of-cpus-during-vm-create) (PR [#9591](https://github.com/vatesfr/xen-orchestra/pull/9591))
- [Backups/Runs] Fix transfer size calculation (PR [#9496](https://github.com/vatesfr/xen-orchestra/pull/9496))
- [S3] Check provider compatibility before using batch deletion (PR [#9598](https://github.com/vatesfr/xen-orchestra/pull/9598))

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

- @vates/generator-toolbox patch
- @vates/types minor
- @xen-orchestra/backups minor
- @xen-orchestra/disk-transform patch
- @xen-orchestra/fs minor
- @xen-orchestra/mcp minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web patch
- xo-server minor
- xo-server-openmetrics minor

<!--packages-end-->
