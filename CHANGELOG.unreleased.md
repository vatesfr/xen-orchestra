> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **Migrated REST API endpoints**:
  - `DELETE /rest/v0/tasks` (PR [#8905](https://github.com/vatesfr/xen-orchestra/pull/8905))
  - `DELETE /rest/v0/tasks/<task-id>` (PR [#8905](https://github.com/vatesfr/xen-orchestra/pull/8905))
  - `DELETE /rest/v0/vms/<vm-id>` (PR [#8938](https://github.com/vatesfr/xen-orchestra/pull/8938))
  - `DELETE /rest/v0/vm-templates/<vm-template-id>` (PR [#8938](https://github.com/vatesfr/xen-orchestra/pull/8938))
  - `DELETE /rest/v0/vm-snapshots/<vm-snapshot-id>` (PR [#8938](https://github.com/vatesfr/xen-orchestra/pull/8938))
  - `DELETE /rest/v0/vdis/<vdi-id>` (PR [#8961](https://github.com/vatesfr/xen-orchestra/pull/8961))
  - `DELETE /rest/v0/vdi-snapshots/<vdi-snapshot-id>` (PR [#8961](https://github.com/vatesfr/xen-orchestra/pull/8961))
  - `POST /rest/v0/tasks/<task-id>/actions/abort` (PR [#8908](https://github.com/vatesfr/xen-orchestra/pull/8908))
  - `POST /rest/v0/srs/<sr-id>/vdis` (PR [#8984](https://github.com/vatesfr/xen-orchestra/pull/8984))
  - `GET /rest/v0/vdis/<vdi-id>.(raw|vhd)` (PR [#8923](http://github.com/vatesfr/xen-orchestra/pull/8923))
  - `GET /rest/v0/vdi-snapshots/<vdi-snapshot-id>.(raw|vhd)` (PR [#8923](http://github.com/vatesfr/xen-orchestra/pull/8923))
  - `GET /rest/v0/vms/<vm-id>.(xva|ova)` (PR [#8929](https://github.com/vatesfr/xen-orchestra/pull/8929))
  - `GET /rest/v0/vm-templates/<vm-template-id>.(xva|ova)` (PR [#8929](https://github.com/vatesfr/xen-orchestra/pull/8929))
  - `GET /rest/v0/vm-snapshots/<vm-snapshot-id>.(xva|ova)` (PR [#8929](https://github.com/vatesfr/xen-orchestra/pull/8929))
  - `GET /rest/v0/groups/<group-id>/users` (PR [#8932](https://github.com/vatesfr/xen-orchestra/pull/8932))
  - `GET /rest/v0/users/<user-id>/groups` (PR [#8936](https://github.com/vatesfr/xen-orchestra/pull/8936))
  - `GET /rest/v0/users/me` (PR [#8985](https://github.com/vatesfr/xen-orchestra/pull/8985))
  - `GET /rest/v0/users/me/*` (PR [#8985](https://github.com/vatesfr/xen-orchestra/pull/8985))
  - **deprecated** `GET /rest/v0/backup/jobs/vm` (PR [#8970](https://github.com/vatesfr/xen-orchestra/pull/8970))
  - **deprecated** `GET /rest/v0/backup/jobs/vm/<backup-job-id>` (PR [#8970](https://github.com/vatesfr/xen-orchestra/pull/8970))
  - **deprecated** `GET /rest/v0/backup/jobs/metadata` (PR [#8970](https://github.com/vatesfr/xen-orchestra/pull/8970))
  - **deprecated** `GET /rest/v0/backup/jobs/metadata/<backup-job-id>` (PR [#8970](https://github.com/vatesfr/xen-orchestra/pull/8970))
  - **deprecated** `GET /rest/v0/backup/jobs/mirror` (PR [#8970](https://github.com/vatesfr/xen-orchestra/pull/8970))
  - **deprecated** `GET /rest/v0/backup/jobs/mirror/<backup-job-id>` (PR [#8970](https://github.com/vatesfr/xen-orchestra/pull/8970))

- [REST API] Expose `/rest/v0/proxies` and `/rest/v0/proxies/<proxy-id>` (PR [#8920](https://github.com/vatesfr/xen-orchestra/pull/8920))
- [XO5/Templates] Show template id when expanded the templates list (PR [#8949](https://github.com/vatesfr/xen-orchestra/pull/8949))
- [REST API] Expose `/rest/v0/vms/<vm-id>/backup-jobs` (PR [#8948](https://github.com/vatesfr/xen-orchestra/pull/8948))
- [SR/Advanced] Add a security to prevent accidentally reclaiming freed space during backups (PR [#8947](https://github.com/vatesfr/xen-orchestra/pull/8947))
- [New VM] Add a new variable in custom cloud config to easily add SSH keys (PR [#8968](https://github.com/vatesfr/xen-orchestra/pull/8968))
- [REST API] Expose `/rest/v0/backup-jobs` and `/rest/v0/backup-jobs/<backup-job-id>` (PR [#8970](https://github.com/vatesfr/xen-orchestra/pull/8970))

- **XO 6:**
  - [VM/dashboard] Update QuickInfo card in dashboard to show more information (PR [#8952](https://github.com/vatesfr/xen-orchestra/pull/8952))
  - [StateHero] Update VtsStateHero component and modify usages in every component (PR [#8910](https://github.com/vatesfr/pull/8910))
  - [VM] Add Backup Jobs page (PR [#8976](https://github.com/vatesfr/xen-orchestra/pull/8976))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Task/Schedule] Set sequences as completely done on success (PR [#8527](https://github.com/vatesfr/xen-orchestra/pull/8527))
- [Pool/HA] Prevent SRs from other pools to be selectable on HA enabling modal (PR [#8924](https://github.com/vatesfr/xen-orchestra/pull/8924))
- [VIFs] Fix sorting by VIF device (PR [#8877](https://github.com/vatesfr/xen-orchestra/pull/8877))
- [Home/Pool] Fix "an error has occurred" for non-admin users (PR [#8946](https://github.com/vatesfr/xen-orchestra/pull/8946))
- [Backup] Fix VDI_NOT_MANAGED error during incremental replication (PR [#8935](https://github.com/vatesfr/xen-orchestra/pull/8935))
- [Backup] Fix replication delta always falling back to full [Forum#11261](https://xcp-ng.org/forum/topic/11261/continuous-replication-jobs-creates-full-backups-every-time-since-2025-09-06-xo-from-source) (PR [#8971](https://github.com/vatesfr/xen-orchestra/pull/8971))
- [API] Fix resource set limits being deleted when calling `resourceSet.set` on the API (PR [#8979](https://github.com/vatesfr/xen-orchestra/pull/8979))

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
- @xen-orchestra/backups patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server minor
- xo-web minor

<!--packages-end-->
