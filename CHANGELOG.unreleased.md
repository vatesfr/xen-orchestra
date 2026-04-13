> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Pool] Add new Network creation forms (normal, Bonded and Internal) (PR [#9629](https://github.com/vatesfr/xen-orchestra/pull/9629))

### Bug fixes

- [Header]: Fix `Unable to connect to XO server` falshing every 30 secondes (PR [#9681](https://github.com/vatesfr/xen-orchestra/pull/9681))
- [Backups]: Fix regression on cleanVM speed (PR [#9692](https://github.com/vatesfr/xen-orchestra/pull/9692))

> Users must be able to say: “I had this issue, happy to know it's fixed”

- Focus lost on vdi name input in new VM form [\#9685](https://github.com/vatesfr/xen-orchestra/issues/9685)

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
- @xen-orchestra/immutable-backups patch
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor

<!--packages-end-->
