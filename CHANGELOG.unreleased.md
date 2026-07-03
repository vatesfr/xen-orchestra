> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- **RBAC** check for REST API endpoints:
  - `/pools/:id/actions/create_bonded_network` (PR [#9891](https://github.com/vatesfr/xen-orchestra/pull/9891))
  - `/pools/:id/actions/create_internal_network` (PR [#9891](https://github.com/vatesfr/xen-orchestra/pull/9891))
  - `/pools/:id/actions/management-reconfigure` (PR [#9891](https://github.com/vatesfr/xen-orchestra/pull/9891))
- [REST API] Possibility of sending `autoEnable` in the body of the `/hosts/:id/actions/disable` endpoint (PR [#10040](https://github.com/vatesfr/xen-orchestra/pull/10040))
- [REST API] `PATCH /rest/v0/vdis/{id}` to update a VDI's name, description and size (PR [#9945](https://github.com/vatesfr/xen-orchestra/pull/9945))
- [Pool] XO now reconnects to a surviving pool member when the master becomes unreachable (e.g. HA promoted a new master after the old one died), instead of staying stuck on the dead master, including after an XO restart (PR [#10016](https://github.com/vatesfr/xen-orchestra/pull/10016))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [XO6] Fix negative "other" value in backup repository dashboard (PR [#10044](https://github.com/vatesfr/xen-orchestra/pull/10044))
- [Backups] Fix missing transfer size (PR [#10106](https://github.com/vatesfr/xen-orchestra/pull/10106))

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
- @xen-orchestra/web patch
- vhd-lib patch
- xen-api minor
- xo-server minor

<!--packages-end-->
