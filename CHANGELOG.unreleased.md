> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM] Display a confirmation modal when stopping/restarting a protected VM (PR [#6295](https://github.com/vatesfr/xen-orchestra/pull/6295))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VDI Import] Fix `this._getOrWaitObject is not a function`

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

- @vates/event-listeners-manager patch
- @vates/read-chunk major
- xo-server patch
- xo-web patch

<!--packages-end-->
