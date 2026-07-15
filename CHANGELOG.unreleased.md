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
- [XO6/VIF] Add possibility to create VIF from network tab in VM page (PR [#9677](https://github.com/vatesfr/xen-orchestra/pull/9677))
- [vm stats] Reduce the memory consumption of the rrd stats (PR [#10039](https://github.com/vatesfr/xen-orchestra/pull/10039))
- [XO6/Site] Add "New VM" and "Connect pool" actions to the site infrastructure tree (PR [#10047](https://github.com/vatesfr/xen-orchestra/pull/10047))
- [XO5/Hub] Recipes are now available to all plans, not just Premium (PR [#10117](https://github.com/vatesfr/xen-orchestra/pull/10117))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [XO6] Fix negative "other" value in backup repository dashboard (PR [#10044](https://github.com/vatesfr/xen-orchestra/pull/10044))
- [Backups] Fix missing transfer size (PR [#10106](https://github.com/vatesfr/xen-orchestra/pull/10106))
- [Host/dashboard] Switch CPU and RAM panels order to match Pool dashboard layout (PR [#10059](https://github.com/vatesfr/xen-orchestra/pull/10059))

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
- @xen-orchestra/backup-archive patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- vhd-lib patch
- xapi-explore-sr patch
- xen-api minor
- xo-server minor
- xo-web minor

<!--packages-end-->
