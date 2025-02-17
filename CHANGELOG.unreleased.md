> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **Migrated REST API endpoints**:

  - `GET /rest/v0/vm-controllers/<vm-controller-id>/alarms` (PR [#8826](http://github.com/vatesfr/xen-orchestra/pull/8826))
  - `GET /rest/v0/vifs/<vif-id>/alarms` (PR [#8825](http://github.com/vatesfr/xen-orchestra/pull/8825))
  - `GET /rest/v0/vbds/<vbd-id>/alarms` (PR [#8822](http://github.com/vatesfr/xen-orchestra/pull/8822))
  - `POST /rest/v0/groups` (PR [#8703](https://github.com/vatesfr/xen-orchestra/pull/8703))
  - `GET /rest/v0/vms/<vm-id>/alarms` (PR [#8829](http://github.com/vatesfr/xen-orchestra/pull/8829))
  - `GET /rest/v0/vm-snapshots/<vm-snapshot-id>/alarms` (PR [#8827](http://github.com/vatesfr/xen-orchestra/pull/8827))

- **XO 6:**

  - [Pool/connect] add page to connect new pool (PR [#8763](https://github.com/vatesfr/xen-orchestra/pull/8763))
  - [Pool/dashboard] add pool dashboard information (PR [#8791](https://github.com/vatesfr/xen-orchestra/pull/8791))

- [Backups] Extra confirmation step when deleting specific VM backups (PR [#8813](https://github.com/vatesfr/xen-orchestra/pull/8813))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [REST API/Dashboard] Consider a host disabled only if it is running ([#8833](https://github.com/vatesfr/xen-orchestra/pull/8833))

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

- @xen-orchestra/backups minor
- @xen-orchestra/proxy minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server minor
- xo-web minor

<!--packages-end-->
