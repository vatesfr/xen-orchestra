> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Mirror Backup] Fix `Cannot read properties of undefined (reading 'id')` [Forum#12043](https://xcp-ng.org/forum/topic/12043/mirror-backup-broken-since-xo-6.3.0-release-error-cannot-read-properties-of-undefined-reading-id) (PR [#9667](https://github.com/vatesfr/xen-orchestra/pull/9667))
- [Incremental Replication] Fix `VTPM_MAX_AMOUNT_REACHED` [Forum#12047](https://xcp-ng.org/forum/topic/12047/xoa-6.1.3-replication-fails-with-vtpm_max_amount_reached-1/) (PR [#9671](https://github.com/vatesfr/xen-orchestra/pull/9671))

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
<!--packages-end-->
