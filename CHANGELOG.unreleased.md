> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup] Fix `incorrect backup size in metadata` on each merged VHD (PR [#6331](https://github.com/vatesfr/xen-orchestra/pull/6331))
- [Backup] Fix `assertionError [ERR_ASSERTION]: Expected values to be strictly equal` when resuming a merge (PR [#6349](https://github.com/vatesfr/xen-orchestra/pull/6349))

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

- @xen-orchestra/backups patch
- @xen-orchestra/fs minor
- @xen-orchestra/mixins patch
- vhd-cli minor
- vhd-lib patch
- xo-web patch
- xo-server-auth-saml minor

<!--packages-end-->
