> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Host/Advanced] Allow to force _Smart reboot_ if some resident VMs have the suspend operation blocked [Forum#7136](https://xcp-ng.org/forum/topic/7136/suspending-vms-during-host-reboot/23) (PR [#7025](https://github.com/vatesfr/xen-orchestra/pull/7025))
- [Plugin/backup-report] Errors are now listed in XO tasks
- [PIF] Show network name in PIF selectors (PR [#7081](https://github.com/vatesfr/xen-orchestra/pull/7081))
- [VM/Advanced] Possibility to create/delete VTPM [#7066](https://github.com/vatesfr/xen-orchestra/issues/7066) [Forum#6578](https://xcp-ng.org/forum/topic/6578/xcp-ng-8-3-public-alpha/109) (PR [#7085](https://github.com/vatesfr/xen-orchestra/pull/7085))
- [VM/New] Possibility to create and attach a _VTPM_ to a VM [#7066](https://github.com/vatesfr/xen-orchestra/issues/7066) [Forum#6578](https://xcp-ng.org/forum/topic/6578/xcp-ng-8-3-public-alpha/109) (PR [#7077](https://github.com/vatesfr/xen-orchestra/pull/7077))
- [Dashboard/Health] Displays number of VDIs to coalesce (PR [#7111](https://github.com/vatesfr/xen-orchestra/pull/7111))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Rolling Pool Update] After the update, when migrating VMs back to their host, do not migrate VMs that are already on the right host [Forum#7802](https://xcp-ng.org/forum/topic/7802) (PR [#7071](https://github.com/vatesfr/xen-orchestra/pull/7071))
- [RPU] Fix "XenServer credentials not found" when running a Rolling Pool Update on a XenServer pool (PR [#7089](https://github.com/vatesfr/xen-orchestra/pull/7089))
- [Usage report] Fix "Converting circular structure to JSON" error
- [Home] Fix OS icons alignment (PR [#7090](https://github.com/vatesfr/xen-orchestra/pull/7090))
- [SR/Advanced] Fix the total number of VDIs to coalesce by taking into account common chains [#7016](https://github.com/vatesfr/xen-orchestra/issues/7016) (PR [#7098](https://github.com/vatesfr/xen-orchestra/pull/7098))
- Don't require to sign in again in XO after losing connection to XO Server (e.g. when restarting or upgrading XO) (PR [#7103](https://github.com/vatesfr/xen-orchestra/pull/7103))
- [Usage report] Fix "Converting circular structure to JSON" error (PR [#7096](https://github.com/vatesfr/xen-orchestra/pull/7096))
- [Usage report] Fix "Cannot convert undefined or null to object" error (PR [#7092](https://github.com/vatesfr/xen-orchestra/pull/7092))

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

- @xen-orchestra/mixins minor
- @xen-orchestra/xapi minor
- xo-server minor
- xo-server-backup-reports minor
- xo-server-netbox patch
- xo-server-usage-report patch
- xo-web minor

<!--packages-end-->
