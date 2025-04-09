> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

- **XO6**:
  - [Host/Network]: Display pifs information in side panel (PR [#8287](https://github.com/vatesfr/xen-orchestra/pull/8287))
  - [VM/Network]: Display vifs table in VM network tab (PR [#8442](https://github.com/vatesfr/xen-orchestra/pull/8442))

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **Migrated REST API endpoints**:
  - `/rest/v0/vms/<vm-id>/stats` (PR [#8359](https://github.com/vatesfr/xen-orchestra/pull/8359))
  - `/rest/v0/vms/<vm-id>/actions/start` (PR [#8379](https://github.com/vatesfr/xen-orchestra/pull/8379))
  - `/rest/v0/hosts` (PR [#8372](https://github.com/vatesfr/xen-orchestra/pull/8372))
  - `/rest/v0/hosts/<host-id>` (PR [#8372](https://github.com/vatesfr/xen-orchestra/pull/8372))
  - `/rest/v0/hosts/<host-id>/stats` (PR [#8372](https://github.com/vatesfr/xen-orchestra/pull/8372))
  - `/rest/v0/srs` (PR [#8419](https://github.com/vatesfr/xen-orchestra/pull/8419))
  - `/rest/v0/srs/<sr-id>` (PR [#8419](https://github.com/vatesfr/xen-orchestra/pull/8419))
  - `/rest/v0/vbds` (PR [#8404](https://github.com/vatesfr/xen-orchestra/pull/8404))
  - `/rest/v0/vbds/<vbd-id>` (PR [#8404](https://github.com/vatesfr/xen-orchestra/pull/8404))
- [New VM] Configure ACLs directly from VM creation form [#6996](https://github.com/vatesfr/xen-orchestra/issues/6996) (PR [#8412](https://github.com/vatesfr/xen-orchestra/pull/8412))
- [Netbox] Support version 4.2.x (PR [#8417](https://github.com/vatesfr/xen-orchestra/pull/8417))
- [Dashboard/Health] Display snapshots older than 30 days for which no schedules are enabled (PR [#8487](https://github.com/vatesfr/xen-orchestra/pull/8487))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM/New] Fix _OTHER_OPERATION_IN_PROGRESS_ when creating a VM that requires a VDI migration (PR [#8399](https://github.com/vatesfr/xen-orchestra/pull/8399))
- [REST API] Fix _Internal Error_ when importing a VM without default SR on the pool (PR [#8409](https://github.com/vatesfr/xen-orchestra/pull/8409))
- [REST API] Fix the SR ID ignored when importing a VM (PR [#8409](https://github.com/vatesfr/xen-orchestra/pull/8409))
- [Plugins/Perf-alert] Fixing alert email notifications to be resent every minute for no reason [Forum#9658](https://xcp-ng.org/forum/topic/9658/lots-of-performance-alerts-after-upgrading-xo-to-commit-aa490) [Forum#10447](https://xcp-ng.org/forum/topic/10447/perf-alert-plugin-lots-of-alerts-but-no-option-to-exclude-sr) (PR [#8408](https://github.com/vatesfr/xen-orchestra/pull/8408))
- [Netbox] Fix synchronization not working if `checkNetboxVersion` is disabled in the config (PR [#8416](https://github.com/vatesfr/xen-orchestra/pull/8416))
- [Continuous replication]: Fix `"Expected "actual" to be strictly unequal to: undefined"` when adding a new disk to an already replicated VM (PR [#8400](https://github.com/vatesfr/xen-orchestra/pull/8400))
- [Netbox] Fix `500 Internal Server Error` when 2 VMs have the same name but different case (PR [#8413](https://github.com/vatesfr/xen-orchestra/pull/8413))
- [V2V] Fix assert error on import delta from esxi < 7.5 (PR [#8422](https://github.com/vatesfr/xen-orchestra/pull/8422))
- [Backups] Fix `Unsupported header 'x-amz-checksum-mode' received for this API call.` on backblaze (PR [#8393](https://github.com/vatesfr/xen-orchestra/pull/8393))
- [Backup] Fix remove automatic disabling of CBT on export failure (PR [#8446](https://github.com/vatesfr/xen-orchestra/pull/8446))

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
- @xen-orchestra/backups patch
- @xen-orchestra/fs patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/vmware-explorer patch
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi patch
- xo-server minor
- xo-server-audit minor
- xo-server-netbox minor
- xo-server-perf-alert patch
- xo-web minor

<!--packages-end-->
