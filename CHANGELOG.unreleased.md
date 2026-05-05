> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [System] Update system pages layout ([user feedback](https://feedback.vates.tech/posts/37/xo6-ui-very-messy-columns-width-in-vm-system-far-better-in-xo5)) (PR [#9746](https://github.com/vatesfr/xen-orchestra/pull/9746))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

### Packages to release

- [immutable backups] Fix error while locking vhd files (PR [#9767](https://github.com/vatesfr/xen-orchestra/pull/9767))

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

- @xen-orchestra/immutable-backups patch
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor


<!--packages-end-->
