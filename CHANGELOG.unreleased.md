> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VDI Import] Fix `this._getOrWaitObject is not a function`
- [VM delete] In case the "Protect from accidental deletion" is set to `true` on a VM, a force modal is displayed when trying to delete it. [#6283](https://github.com/vatesfr/xen-orchestra/issues/6283) (PR [#6290](https://github.com/vatesfr/xen-orchestra/pull/6290))

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

- @vates/read-chunk major
- @xen-orchestra patch
- xo-server patch

<!--packages-end-->
