> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] New pool action: `create_vm` [#6749](https://github.com/vatesfr/xen-orchestra/issues/6749)
- [Backup] Implement Backup Repository immutability (PR [#6928](https://github.com/vatesfr/xen-orchestra/pull/6928))

### Bug fixes

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

- @xen-orchestra/backups patch
- @xen-orchestra/immutable-backups major
- xo-cli minor
- xo-server minor
- xo-web minor

<!--packages-end-->
