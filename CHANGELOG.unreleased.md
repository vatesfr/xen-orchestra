> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Replication] Reuse the same VM as an incremental replication target (PR [#9524](https://github.com/vatesfr/xen-orchestra/pull/9524))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup] Reduce backup memory consumption (PR [#9557](https://github.com/vatesfr/xen-orchestra/pull/9557))

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

- @vates/generator-toolbox patch
- @xen-orchestra/backups minor
- @xen-orchestra/disk-transform patch
- xo-server minor

<!--packages-end-->
