> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM Creation] Automatically create a VTPM if the template requests it (Windows templates starting from XCP-ng 8.3) (PR [#7436](https://github.com/vatesfr/xen-orchestra/pull/7436))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [ISO SR] During ISO migration, the destination SRs were not ISO SRs [#7392](https://github.com/vatesfr/xen-orchestra/issues/7392) (PR [#7431](https://github.com/vatesfr/xen-orchestra/pull/7431))
- [VM/Migration] Fix VDIs that were not migrated to the destination SR (PR [#7360](https://github.com/vatesfr/xen-orchestra/pull/7360))
- [Home/VM] VMs migration from the home view will no longer execute a [Migration with Storage Motion](https://github.com/vatesfr/xen-orchestra/blob/master/docs/manage_infrastructure.md#vm-migration-with-storage-motion-vmmigrate_send) unless it is necessary [Forum#8279](https://xcp-ng.org/forum/topic/8279/getting-errors-when-migrating-4-out-5-vmguest/)(PR [#7360](https://github.com/vatesfr/xen-orchestra/pull/7360))
- [VM/Migration] SR is no longer required if you select a migration network (PR [#7360](https://github.com/vatesfr/xen-orchestra/pull/7360))

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

- xo-server minor
- xo-web patch

<!--packages-end-->
