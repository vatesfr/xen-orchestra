> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **Migrated REST API endpoints**:
  - `/rest/v0/vms/<vm-id>/stats` (PR [#8359](https://github.com/vatesfr/xen-orchestra/pull/8359))
  - `/rest/v0/hosts` (PR [#8372](https://github.com/vatesfr/xen-orchestra/pull/8372))
  - `/rest/v0/hosts/<host-id>` (PR [#8372](https://github.com/vatesfr/xen-orchestra/pull/8372))
  - `/rest/v0/hosts/<host-id>/stats` (PR [#8372](https://github.com/vatesfr/xen-orchestra/pull/8372))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [REST API] Fix _Internal Error_ when importing a VM without default SR on the pool (PR [#8409](https://github.com/vatesfr/xen-orchestra/pull/8409))
- [REST API] Fix the SR ID ignored when importing a VM (PR [#8409](https://github.com/vatesfr/xen-orchestra/pull/8409))

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
- @xen-orchestra/rest-api minor
- @xen-orchestra/xapi patch
- xo-server patch

<!--packages-end-->
