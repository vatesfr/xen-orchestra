> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Backups] Add UserAgent in s3 client ([#9815](https://github.com/vatesfr/xen-orchestra/pull/9815))
- [xo-web] support qcow2 format in disk > import (PR [#9817](https://github.com/vatesfr/xen-orchestra/pull/9817))
- [xo-server] support qcow2 format in `disk.importContent` and `disk.import` jsonRPC api (PR [#9817](https://github.com/vatesfr/xen-orchestra/pull/9817))
- [web-core] Update `UiTag` and parse tag for detecting tags with `=` (PR [#9811](https://github.com/vatesfr/xen-orchestra/pull/9811))
- [Encryption] Implement encryption and decryption feature for redis (PR [#9735](https://github.com/vatesfr/xen-orchestra/pull/9735))
- [REST API] Implemented registerRestRoutes function for plugins (PR [#9553](https://github.com/vatesfr/xen-orchestra/pull/9553))
- **XO 5**:
  - [Export config] Hide passphrase by default (PR [#9824](https://github.com/vatesfr/xen-orchestra/pull/9824))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [REST] Fixed ignored parameters in request body due to a tsoa bug (see https://github.com/lukeautry/tsoa/pull/1858) (PR [#9793](https://github.com/vatesfr/xen-orchestra/pull/9793))
- **XO 5**:
  - [Job] Error while using vm.set with `cpuMask` in job view (PR [#9823](https://github.com/vatesfr/xen-orchestra/pull/9823))

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

- @vates/types minor
- @xen-orchestra/fs minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server minor
- xo-web minor

<!--packages-end-->
