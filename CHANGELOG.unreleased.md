> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **Migrated REST API endpoints**:
  - `GET /rest/v0/srs/<sr-id>/messages` (PR [#9028](https://github.com/vatesfr/xen-orchestra/pull/9028))
  - `GET /rest/v0/hosts/<host-id>/messages` (PR [#9027](https://github.com/vatesfr/xen-orchestra/pull/9027))
  - `GET /rest/v0/pools/<pool-id>/messages` (PR [#9022](https://github.com/vatesfr/xen-orchestra/pull/9022))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [V2V] Do not lock stopped VMs (PR [#9047](https://github.com/vatesfr/xen-orchestra/pull/9047))
- [Backups] Fix EEXIST error when retrying a backup (PR [#9039](https://github.com/vatesfr/xen-orchestra/pull/9039))

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

- @xen-orchestra/fs patch
- @xen-orchestra/rest-api minor
- xo-server patch

<!--packages-end-->
