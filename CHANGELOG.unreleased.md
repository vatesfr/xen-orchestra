> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup/Restore] Fix backup list not loading on page load (PR [#6364](https://github.com/vatesfr/xen-orchestra/pull/6364))
- [Host] Fix `should not contains property ["ignoreBackup"]` on some host operations (PR [#6362](https://github.com/vatesfr/xen-orchestra/pull/6362))

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
- @xen-orchestra/fs major
- vhd-lib major
- xo-vmdk-to-vhd patch
- xo-server minor
- xo-web patch

<!--packages-end-->
