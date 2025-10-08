> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **Migrated REST API endpoints**:
  - `GET /rest/v0/pifs/<pif-id>/messages` (PR [#9021](https://github.com/vatesfr/xen-orchestra/pull/9021))
  - `GET /rest/v0/networks/<network-id>/messages` (PR [#9023](https://github.com/vatesfr/xen-orchestra/pull/9023))
  - `GET /rest/v0/vdi-snapshots/<vdi-snapshot-id>/messages` (PR [#9043](https://github.com/vatesfr/xen-orchestra/pull/9043))
  - `GET /rest/v0/vdis/<vdi-id>/messages` (PR [#9044](https://github.com/vatesfr/xen-orchestra/pull/9044))
  - `GET /rest/v0/vifs/<vif-id>/messages` (PR [#9049](https://github.com/vatesfr/xen-orchestra/pull/9049))
  - `GET /rest/v0/vm-controllers/<vm-controller-id>/messages` (PR [#9050](https://github.com/vatesfr/xen-orchestra/pull/9050))
  - `GET /rest/v0/vm-snapshots/<vm-snapshot-id>/tasks` (PR [#9005](https://github.com/vatesfr/xen-orchestra/pull/9005))
  - `GET /rest/v0/servers/<server-id>/tasks` (PR [#9065](https://github.com/vatesfr/xen-orchestra/pull/9065))
  - `GET /rest/v0/vm-templates/<vm-template-id>/tasks` (PR [#9004](https://github.com/vatesfr/xen-orchestra/pull/9004))
  - `GET /rest/v0/users/<user-id>/tasks` (PR [#9066](https://github.com/vatesfr/xen-orchestra/pull/9066))
  - `GET /rest/v0/groups/<group-id>/tasks` (PR [#9072](https://github.com/vatesfr/xen-orchestra/pull/9072))
  - `GET /rest/v0/vm-controllers/<vm-controller-id>/tasks` (PR [#9069](https://github.com/vatesfr/xen-orchestra/pull/9069))
  - `GET /rest/v0/vifs/<vif-id>/tasks` (PR [#9075](https://github.com/vatesfr/xen-orchestra/pull/9075))
  - `GET /rest/v0/pools/<pool-id>/tasks` (PR [#9080](https://github.com/vatesfr/xen-orchestra/pull/9080))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM] Fix some action buttons being hidden from admin users when VM had been created with Self Service (PR [#9061](https://github.com/vatesfr/xen-orchestra/pull/9061))

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

- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server patch
- xo-web patch

<!--packages-end-->
