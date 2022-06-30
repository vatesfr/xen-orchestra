> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Restore backup] Clearer error message when importing a VM backup requires restoration of CH >= 8.1 (PR [#6304](https://github.com/vatesfr/xen-orchestra/pull/6304))
- [Backup] Users can use VHD directory on any remote type (PR [#6273](https://github.com/vatesfr/xen-orchestra/pull/6273))
- [SR/advanced] Ability to enable/disable a maintenance mode for an SR [#6215](https://github.com/vatesfr/xen-orchestra/issues/6215) (PRs [#6308](https://github.com/vatesfr/xen-orchestra/pull/6308), [#6297](https://github.com/vatesfr/xen-orchestra/pull/6297))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

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

- vhd-lib patch
- xo-remote-parser patch
- xo-server minor
- xo-web minor

<!--packages-end-->
