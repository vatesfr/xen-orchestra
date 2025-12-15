> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Plugins/Backup-reports] Add optional context in email subject and Pool ID in summary [#8544](https://github.com/vatesfr/xen-orchestra/issues/8544) (PR [#8973](https://github.com/vatesfr/xen-orchestra/pull/8973))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”
- [Backups] Don't fail backup with memory on "INVALID_UUID" error (PR [#9308](https://github.com/vatesfr/xen-orchestra/pull/9308))
- [Plugins/Perf-alert] Unload configuration when the plugin is disabled (PR [#9306](https://github.com/vatesfr/xen-orchestra/pull/9306))

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
- @xen-orchestra/xapi patch
- xo-server-backup-reports minor
- xo-server-perf-alert minor
<!--packages-end-->
