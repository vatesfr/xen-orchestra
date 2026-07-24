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
- [Backups] Fix qcow2 transfer without NBD (PR [#10164](https://github.com/vatesfr/xen-orchestra/pull/10164))
- [Backups] Force a full backup if any suspect is detected on qcow2 without nbd (PR [#10164](https://github.com/vatesfr/xen-orchestra/pull/10164))
- [Backups] Fix aggregated backup failing instead of falling back to a full backup (PR [#10164](https://github.com/vatesfr/xen-orchestra/pull/10164))

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
- @xen-orchestra/backup-archive patch
- @xen-orchestra/backups patch
- @xen-orchestra/disk-transform patch
<!--packages-end-->
