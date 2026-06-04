> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [REST API] Expose `POST /backup-repositories` and `PATCH /backup-repositories/:id` REST routes (PR [#9852](https://github.com/vatesfr/xen-orchestra/pull/9852))
- **RBAC** check for REST API endpoints:
  - `POST /vbds` (PR [#9904](https://github.com/vatesfr/xen-orchestra/pull/9904))
  - `DELETE /vbds/:id` (PR [#9904](https://github.com/vatesfr/xen-orchestra/pull/9904))
  - `vbds/:id/actions/connect` (PR [#9904](https://github.com/vatesfr/xen-orchestra/pull/9904))
  - `vbds/:id/actions/disconnect` (PR [#9904](https://github.com/vatesfr/xen-orchestra/pull/9904))

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
