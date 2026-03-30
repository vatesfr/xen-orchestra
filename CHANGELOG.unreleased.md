> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [QA Test] Add end-to-end QA test suite `@xen-orchestra/qa-test` for VM, backup and export testing (PR [#9626](https://github.com/vatesfr/xen-orchestra/pull/9626))
- [i18n] Add Portuguese and Slovak and update Chinese (Simplified Han script), Czech, Dutch, German, Italian, Norwegian, Persian, Portuguese (Brasil), Russian, Spanish, Swedish and Ukrainian translations (PR [#9554](https://github.com/vatesfr/xen-orchestra/pull/9554))
- [Treeview/Pool/Host] Add button to download bugtools (PR [#9419](https://github.com/vatesfr/xen-orchestra/pull/9419))
- [Incremental Replication] show the schedule used and data volume read on each snapshot (PR [#9635](https://github.com/vatesfr/xen-orchestra/pull/9635))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [XO5/XO6/Stats] Return `null` instead of `0` when no stats available (PR [#9634](https://github.com/vatesfr/xen-orchestra/pull/9634))
- [i18n] Fix English grammar issues on Site Dashboard, contribution by [@DustyArmstrong](https://github.com/DustyArmstrong) (PR [#9647](https://github.com/vatesfr/xen-orchestra/pull/https://github.com/vatesfr/xen-orchestra/pull/9647))
- [Incremental Replication] fix the disk target and cleanup to ensure replications and backups can be chained (PR [#9635](https://github.com/vatesfr/xen-orchestra/pull/9635))
- [REST-API/VM/Dashboard] Fix _cannot read properties of undefined, (reading vms)_ [Forum#12031](https://xcp-ng.org/forum/topic/12031/backup-info-under-vm-tab-in-v6-never-loads...) (PR [#9650](https://github.com/vatesfr/xen-orchestra/pull/9650))

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

- @xen-orchestra/backups minor
- @xen-orchestra/rest-api patch
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server patch
- xo-server-netbox patch

<!--packages-end-->
