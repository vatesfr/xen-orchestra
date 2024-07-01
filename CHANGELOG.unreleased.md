> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [SR/XOSTOR] Add _State_ column to the _Resource List_ table (PR [#7784](https://github.com/vatesfr/xen-orchestra/pull/7784))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM/Advanced] Fix `not enought permission` for admin users who wanted to attach PCIs when the VM was on a shared SR [#9260](https://xcp-ng.org/forum/topic/9260/attach-pcis-not-enough-permissions?_=1719393396541) (PR [#7793](https://github.com/vatesfr/xen-orchestra/pull/7793))

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

- xo-web minor

<!--packages-end-->
