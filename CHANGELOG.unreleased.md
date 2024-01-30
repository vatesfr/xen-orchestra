> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Pool/Advanced] Show pool backup/migration network even if they no longer exist (PR [#7303](https://github.com/vatesfr/xen-orchestra/pull/7303))
- [Import/disk] Couldn't update 'name' field when importing from a URL [#7326](https://github.com/vatesfr/xen-orchestra/issues/7326) (PR [#7332](https://github.com/vatesfr/xen-orchestra/pull/7332))
- [Pool/patches] Disable Rolling Pool Update button if some powered up VMs are using a non-shared storage [#6415](https://github.com/vatesfr/xen-orchestra/issues/6415) (PR [#7294](https://github.com/vatesfr/xen-orchestra/pull/7294))

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
