> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"
- [REST API] Expose `GET /rest/v0/backup-archive/:id/disks` (PR [#9464](https://github.com/vatesfr/xen-orchestra/pull/9941))
- [REST API] Expose `GET /rest/v0/backup-archive/:id/disks/:diskId/partitions` (PR [#9464](https://github.com/vatesfr/xen-orchestra/pull/9941))
- [REST API] Expose `GET /rest/v0/backup-archive/:id/disks/:diskId/partitions/:partitionId/files` (PR [#9464](https://github.com/vatesfr/xen-orchestra/pull/9941))
- [REST API] Expose `GET /rest/v0/backup-archive/:id/disks/:diskId/files` (PR [#9464](https://github.com/vatesfr/xen-orchestra/pull/9941))
- [REST API] Expose `GET /rest/v0/backup-archive/:id/disks/:diskId/partitions/:partitionId/files.:format` (PR [#9464](https://github.com/vatesfr/xen-orchestra/pull/9941))
- [REST API] Expose `GET /rest/v0/backup-archive/:id/disks/:diskId/d/files.:format` (PR [#9464](https://github.com/vatesfr/xen-orchestra/pull/9941))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

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
- @vates/types minor
- @xen-orchestra/acl minor
- @xen-orchestra/rest-api minor
<!--packages-end-->
