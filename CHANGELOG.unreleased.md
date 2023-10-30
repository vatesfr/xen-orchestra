> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Netbox] Fix "The selected cluster is not assigned to this site" error [Forum#7887](https://xcp-ng.org/forum/topic/7887) (PR [#7124](https://github.com/vatesfr/xen-orchestra/pull/7124))
- [Backups] Fix `MESSAGE_METHOD_UNKNOWN` during full backup [Forum#7894](https://xcp-ng.org/forum/topic/7894)(PR [#7139](https://github.com/vatesfr/xen-orchestra/pull/7139))

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
- xo-cli minor
- xo-server-netbox patch
- xo-web patch

<!--packages-end-->
