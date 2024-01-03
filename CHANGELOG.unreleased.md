> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

[VM/Advanced] Admin can change VM creator [Forum#7313](https://xcp-ng.org/forum/topic/7313/change-created-by-and-date-information) (PR [#7276](https://github.com/vatesfr/xen-orchestra/pull/7276))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Proxies] Fix `this.getObject` is not a function during deployment

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

- xo-server patch
- xo-web minor

<!--packages-end-->
