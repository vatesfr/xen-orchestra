> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Backups] Show the space actually used by each backup on its backup repository, compression and encryption included (XO6 VM dashboard, XOA dashboard backup usage, REST API) (PR [#10685](https://github.com/vatesfr/xen-orchestra/pull/10685))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Backups] After a merge in the middle of a delta chain, its disks are no longer reported as full. (PR [#10685](https://github.com/vatesfr/xen-orchestra/pull/10685))

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

- @xen-orchestra/disk-cli minor
- @xen-orchestra/fs minor
- @xen-orchestra/qa-test minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor

<!--packages-end-->
