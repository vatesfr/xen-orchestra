> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM] Fix `VBD_IS_EMPTY` error when converting to template [Forum#61653](https://xcp-ng.org/forum/post/61653) (PR [#6808](https://github.com/vatesfr/xen-orchestra/pull/6808))
- -[New/Network] Fix `invalid parameter error` when not providing a VLAN [Forum#62090](https://xcp-ng.org/forum/post/62090) (PR [#6829](https://github.com/vatesfr/xen-orchestra/pull/6829))

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
- xo-web patch

<!--packages-end-->
