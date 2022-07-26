> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] VDI import now also supports the raw format
- Embedded HTTP/HTTPS proxy is now enabled by default

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Home/VM] Show error when deleting VMs failed (PR [#6323](https://github.com/vatesfr/xen-orchestra/pull/6323))
- [REST API] Fix broken VDI after VHD import [#6327](https://github.com/vatesfr/xen-orchestra/issues/6327) (PR [#6326](https://github.com/vatesfr/xen-orchestra/pull/6326))

### Packages to release

> When modifying a package, add it here with its release type.
>
> The format is the following: - `$packageName` `$releaseType`
>
> Where `$releaseType` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> Keep this list alphabetically ordered to avoid merge conflicts

<!--packages-start-->

- @vates/async-each major
- @xen-orchestra/fs major
- @xen-orchestra/mixins minor
- @xen-orchestra/proxy minor
- @xen-orchestra/xapi patch
- xo-cli patch
- xo-server minor
- xo-web patch

<!--packages-end-->
