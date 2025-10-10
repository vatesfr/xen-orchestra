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
  - `GET /rest/v0/pifs/<pif-id>/tasks` (PR [#9078](https://github.com/vatesfr/xen-orchestra/pull/9078))
  - `GET /rest/v0/networks/<network-id>/tasks` (PR [#9076](https://github.com/vatesfr/xen-orchestra/pull/9076))
  - `GET /rest/v0/hosts/<host-id>/tasks` (PR [#9074](https://github.com/vatesfr/xen-orchestra/pull/9074))
  - `GET /rest/v0/vbds/<vbd-id>/messages` (PR [#9029](https://github.com/vatesfr/xen-orchestra/pull/9029))
  - `GET /rest/v0/vdis/<vdi-id>/tasks` (PR [#9079](https://github.com/vatesfr/xen-orchestra/pull/9079))
  - `GET /rest/v0/vdi-snapshots/<vdi-snaphot-id>/tasks` (PR [#9082](https://github.com/vatesfr/xen-orchestra/pull/9082))
  - `PUT /rest/v0/hosts/<host-id>/tags/:tag` (PR [#9037](https://github.com/vatesfr/xen-orchestra/pull/9037))
  - `DELETE /rest/v0/hosts/<host-id>/tags/:tag` (PR [#9037](https://github.com/vatesfr/xen-orchestra/pull/9037))
  - `PUT /rest/v0/networks/<network-id>/tags/:tag` (PR [#9087](https://github.com/vatesfr/xen-orchestra/pull/9087))
  - `DELETE /rest/v0/networks/<network-id>/tags/:tag` (PR [#9087](https://github.com/vatesfr/xen-orchestra/pull/9087))
  - `PUT /rest/v0/pools/<pool-id>/tags/:tag` (PR [#9088](https://github.com/vatesfr/xen-orchestra/pull/9088))
  - `DELETE /rest/v0/pools/<pool-id>/tags/:tag` (PR [#9088](https://github.com/vatesfr/xen-orchestra/pull/9088))
  - `GET /rest/v0/pools/<pool-id>/tasks` (PR [#9080](https://github.com/vatesfr/xen-orchestra/pull/9080))
  - `GET /rest/v0/vbds/<vbd-id>/tasks` (PR [#9085](https://github.com/vatesfr/xen-orchestra/pull/9085))
  - `GET /rest/v0/srs/<sr-id>/tasks` (PR [#9086](https://github.com/vatesfr/xen-orchestra/pull/9086))
  - `PUT /rest/v0/vms/<vm-id>/tags/:tag` (PR [#9092](https://github.com/vatesfr/xen-orchestra/pull/9092))
  - `DELETE /rest/v0/vms/<vm-id>/tags/:tag` (PR [#9092](https://github.com/vatesfr/xen-orchestra/pull/9092))
  - **removed** `PUT /rest/v0/vbds/<vbd-id>/tags/:tag` (PR [#9090](https://github.com/vatesfr/xen-orchestra/pull/9090))
  - **removed** `DELETE /rest/v0/vbds/<vbd-id>/tags/:tag` (PR [#9090](https://github.com/vatesfr/xen-orchestra/pull/9090))
  - **removed** `PUT /rest/v0/vifs/<vif-id>/tags/:tag` (PR [#9096](https://github.com/vatesfr/xen-orchestra/pull/9096))
  - **removed** `DELETE /rest/v0/vifs/<vif-id>/tags/:tag` (PR [#9096](https://github.com/vatesfr/xen-orchestra/pull/9096))
  - `PUT /rest/v0/vdi-snapshots/<vdi-snapshot-id>/tags/:tag` (PR [#9091](https://github.com/vatesfr/xen-orchestra/pull/9087))
  - `DELETE /rest/v0/vdi-snapshots/<vdi-snapshot-id>/tags/:tag` (PR [#9091](https://github.com/vatesfr/xen-orchestra/pull/9091))
  - `PUT /rest/v0/vdis/<vdi-id>/tags/:tag` (PR [#9094](https://github.com/vatesfr/xen-orchestra/pull/9094))
  - `DELETE /rest/v0/vdis/<vdi-id>/tags/:tag` (PR [#9094](https://github.com/vatesfr/xen-orchestra/pull/9094))
  - `PUT /rest/v0/srs/<sr-id>/tags/:tag` (PR [#9089](https://github.com/vatesfr/xen-orchestra/pull/9089))
  - `DELETE /rest/v0/srs/<sr-id>/tags/:tag` (PR [#9089](https://github.com/vatesfr/xen-orchestra/pull/9089))
  - `PUT /rest/v0/vm-snapshots/<vm-snapshot-id>/tags/:tag` (PR [#9098](https://github.com/vatesfr/xen-orchestra/pull/9098))
  - `DELETE /rest/v0/vm-snapshots/<vm-snapshot-id>/tags/:tag` (PR [#9098](https://github.com/vatesfr/xen-orchestra/pull/9098))
  - `DELETE /rest/v0/vm-templates/<vm-template-id>/tags/:tag` (PR [#9099](https://github.com/vatesfr/xen-orchestra/pull/9099))
  - `GET /rest/v0/vm-templates/<vm-template-id>/tasks` (PR [#9099](https://github.com/vatesfr/xen-orchestra/pull/9099))
  - `PUT /rest/v0/vm-controllers/<vm-controller-id>/tags/:tag` (PR [#9097](https://github.com/vatesfr/xen-orchestra/pull/9097))
  - `DELETE /rest/v0/vm-controllers/<vm-controller-id>/tags/:tag` (PR [#9097](https://github.com/vatesfr/xen-orchestra/pull/9097))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM] Fix some action buttons being hidden from admin users when VM had been created with Self Service (PR [#9061](https://github.com/vatesfr/xen-orchestra/pull/9061))
- [Copy to clipboard] Fix button sometimes disappearing when trying to reach it (PR [#9059](https://github.com/vatesfr/xen-orchestra/pull/9059))

- **XO 6**:
  - [Site/Backups] Fix an issue properties of undefined in backups tab (PR [#9064](https://github.com/vatesfr/xen-orchestra/pull/9064))

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
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server patch
- xo-web patch

<!--packages-end-->
