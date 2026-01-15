> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup] snapshots of VM with a CDROM mounted are not removed (PR [#9570](https://github.com/vatesfr/xen-orchestra/pull/9570))
- [OpenMetrics] Fix plugin failing to auto-start after xo-server restart due to XOA WebSocket connection race condition (PR [#9402](https://github.com/vatesfr/xen-orchestra/pull/9402))

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

- @xen-orchestra/backups patch
- xo-server patch
<!--packages-end-->
