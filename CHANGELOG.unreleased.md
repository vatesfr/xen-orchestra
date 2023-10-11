> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Host/Advanced] Allow to force _Smart reboot_ if some resident VMs have the suspend operation blocked [Forum#7136](https://xcp-ng.org/forum/topic/7136/suspending-vms-during-host-reboot/23) (PR [#7025](https://github.com/vatesfr/xen-orchestra/pull/7025))
- [Plugin/backup-report] Errors are now listed in XO tasks
- [PIF] Show network name in PIF selectors (PR [#7081](https://github.com/vatesfr/xen-orchestra/pull/7081))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Rolling Pool Update] After the update, when migrating VMs back to their host, do not migrate VMs that are already on the right host [Forum#7802](https://xcp-ng.org/forum/topic/7802) (PR [#7071](https://github.com/vatesfr/xen-orchestra/pull/7071))

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
- xo-web minor

<!--packages-end-->
