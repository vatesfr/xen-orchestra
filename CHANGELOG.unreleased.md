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

[Treeview] fixed an issue where the selected item in the treeview would scroll to the top [Forum#12329](https://xcp-ng.org/forum/topic/12329) (PR [#10052](https://github.com/vatesfr/xen-orchestra/pull/10052))

- [Backups] Improve resume of backup merge failure for VHD files (PR [#10053](https://github.com/vatesfr/xen-orchestra/pull/10053))

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
- @xen-orchestra/web patch

<!--packages-end-->
