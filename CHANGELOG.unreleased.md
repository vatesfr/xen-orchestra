> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Home/pool, host] Grouping of alert icons on the `Home` page for `Pool` and `Host` (PR [#6655](https://github.com/vatesfr/xen-orchestra/pull/6655))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Import VM] fix invalid parameters when importing a VM from VMware [Forum#6714](https://xcp-ng.org/forum/topic/6714/vmware-migration-tool-we-need-your-feedback/143) (PR [#6696](https://github.com/vatesfr/xen-orchestra/pull/6696))
- [Backup] Fix _A "socket" was not created for HTTP request before 300000ms_ error [Forum#59163](https://xcp-ng.org/forum/post/59163) [#6656](https://github.com/vatesfr/xen-orchestra/issues/6656)

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
- xo-web minor

<!--packages-end-->
