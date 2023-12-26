> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Host/Network/PIF] Display and ability to edit IPv6 field [#5400](https://github.com/vatesfr/xen-orchestra/issues/5400) (PR [#7218](https://github.com/vatesfr/xen-orchestra/pull/7218))
- [VM] Trying to increase the memory of a running VM will now propose the option to automatically restart it and increasing its memory [#7069](https://github.com/vatesfr/xen-orchestra/issues/7069) (PR [#7244](https://github.com/vatesfr/xen-orchestra/pull/7244))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

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

- vhd-lib minor
- xo-server minor
- xo-web minor

<!--packages-end-->
