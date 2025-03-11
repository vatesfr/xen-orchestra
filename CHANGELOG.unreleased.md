> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **Migrated REST API endpoints**:
  - `/rest/v0/vms/<vm-id>/stats` (PR [#8359](https://github.com/vatesfr/xen-orchestra/pull/8359))
  - `/rest/v0/vms/<vm-id>/actions/start` (PR [#8379](https://github.com/vatesfr/xen-orchestra/pull/8379))
  - `/rest/v0/hosts` (PR [#8372](https://github.com/vatesfr/xen-orchestra/pull/8372))
  - `/rest/v0/hosts/<host-id>` (PR [#8372](https://github.com/vatesfr/xen-orchestra/pull/8372))
  - `/rest/v0/hosts/<host-id>/stats` (PR [#8372](https://github.com/vatesfr/xen-orchestra/pull/8372))
  - `/rest/v0/srs` (PR [#8419](https://github.com/vatesfr/xen-orchestra/pull/8419))
  - `/rest/v0/srs/<sr-id>` (PR [#8419](https://github.com/vatesfr/xen-orchestra/pull/8419))
- [New VM] Configure ACLs directly from VM creation form [#6996](https://github.com/vatesfr/xen-orchestra/issues/6996) (PR [#8412](https://github.com/vatesfr/xen-orchestra/pull/8412))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM/New] Fix _OTHER_OPERATION_IN_PROGRESS_ when creating a VM that requires a VDI migration (PR [#8399](https://github.com/vatesfr/xen-orchestra/pull/8399))
- [REST API] Fix _Internal Error_ when importing a VM without default SR on the pool (PR [#8409](https://github.com/vatesfr/xen-orchestra/pull/8409))
- [REST API] Fix the SR ID ignored when importing a VM (PR [#8409](https://github.com/vatesfr/xen-orchestra/pull/8409))
- [Plugins/Perf-alert] Fixing alert email notifications to be resent every minute for no reason [Forum#9658](https://xcp-ng.org/forum/topic/9658/lots-of-performance-alerts-after-upgrading-xo-to-commit-aa490) [Forum#10447](https://xcp-ng.org/forum/topic/10447/perf-alert-plugin-lots-of-alerts-but-no-option-to-exclude-sr) (PR [#8408](https://github.com/vatesfr/xen-orchestra/pull/8408))
- [Netbox] Fix synchronization not working if `checkNetboxVersion` is disabled in the config (PR [#8416](https://github.com/vatesfr/xen-orchestra/pull/8416))
- [Continuous replication]: Fix `"Expected "actual" to be strictly unequal to: undefined"` when adding a new disk to an already replicated VM (PR [#8400](https://github.com/vatesfr/xen-orchestra/pull/8400))

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
- @xen-orchestra/rest-api minor
- @xen-orchestra/xapi patch
- xo-server minor
- xo-server-netbox patch
- xo-server-perf-alert patch
- xo-web minor

<!--packages-end-->
