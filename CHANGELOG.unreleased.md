> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [About] Clicking on commit version number opens a new tab [#7427](https://github.com/vatesfr/xen-orchestra/issues/7427) (PR [#7430](https://github.com/vatesfr/xen-orchestra/pull/7430))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Jobs] Fix `t.value is undefined` when saving a new job (broken in XO 5.91)
- [XOSTOR] Move `ignore file sytems` outside of advanced settings (PR [#7429](https://github.com/vatesfr/xen-orchestra/pull/7429))

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
