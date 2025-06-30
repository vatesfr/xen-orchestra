> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **XO 6:**
  - [i18n] Update Czech, German, Spanish, Dutch, Russian translations (PR [#8643](https://github.com/vatesfr/xen-orchestra/pull/8643))
  - [Host/system] Display pGpu name in hardware specifications card in host/system tab (PR [#8740](https://github.com/vatesfr/xen-orchestra/pull/8740))
  - [Table] add pagination on table (PR [#8573](https://github.com/vatesfr/xen-orchestra/pull/8573))

### Bug fixes

- **XO 6:**
  - [XO6/stats] Fix graphs that were sometimes not displayed or displayed incorrectly (PR [#8722](https://github.com/vatesfr/xen-orchestra/pull/8722))

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

- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi patch

<!--packages-end-->
