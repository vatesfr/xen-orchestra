> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Continuous Replication] Fix `VDI_IO_ERROR` when after a VDI has been resized
- [REST API] Fix VDI import
- Fix failing imports (REST API and web UI) [Forum#58146](https://xcp-ng.org/forum/post/58146)
- [Pool/License] Fix license expiration on license binding modal (PR [#6666](https://github.com/vatesfr/xen-orchestra/pull/6666))

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
- xen-api patch
- xo-server patch
- xo-web patch

<!--packages-end-->
