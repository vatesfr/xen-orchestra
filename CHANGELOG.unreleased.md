> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [xo-web] support qcow2 format in disk > import (PR [#9817](https://github.com/vatesfr/xen-orchestra/pull/9817))
- [xo-server] support qcow2 format in `disk.importContent` and `disk.import` jsonRPC api (PR [#9817](https://github.com/vatesfr/xen-orchestra/pull/9817))
- [web-core] Update `UiTag` and parse tag for detecting tags with `=` (PR [#9811](https://github.com/vatesfr/xen-orchestra/pull/9811))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [REST] Fixed ignored parameters in request body due to a tsoa bug (see https://github.com/lukeautry/tsoa/pull/1858) (PR [#9793](https://github.com/vatesfr/xen-orchestra/pull/9793))

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

- @xen-orchestra/rest-api patch
- @xen-orchestra/web-core minor
- xo-server minor
- xo-web minor

<!--packages-end-->
