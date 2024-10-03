> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Tooltip] Fix randomly disappearing tooltips (PR [#8031](https://github.com/vatesfr/xen-orchestra/pull/8031))
- Fix a memory leak mainly visible since XO 5.95.1 (PR [#8030](https://github.com/vatesfr/xen-orchestra/pull/8030))
- [Backup] Force an additional VDI disconnection before retrying on VDI_IN_USE error (PR [#8032](https://github.com/vatesfr/xen-orchestra/pull/8032))

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

- @vates/task patch
- @xen-orchestra/log minor
- @xen-orchestra/xapi minor
- xo-web patch

<!--packages-end-->
