> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Network/NBD] Add the possibility to add and change the NBD connection associated to a Network (PR [#6646](https://github.com/vatesfr/xen-orchestra/pull/6646))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Ova export] Better computation of overprovisioning for very sparse disks (PR [#6639](https://github.com/vatesfr/xen-orchestra/pull/6639))

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

- xo-vmdk-to-vhd patch
- xo-server-upload-ova patch
- xo-web minor

<!--packages-end-->
