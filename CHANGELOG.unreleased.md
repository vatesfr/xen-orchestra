> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **XO 6:**
  - [i18n] Update some wordings in French translation (contribution by [@Luxinenglish](https://github.com/Luxinenglish)) (PR [#8983](https://github.com/vatesfr/xen-orchestra/pull/8983))
  - [i18n] Update Czech, Spanish, Italian, Dutch, Portuguese (Brazil), Russian and Ukrainian translations (PR [#8901](https://github.com/vatesfr/xen-orchestra/pull/8901))
  - [Site/Backups] Add side panel to backup jobs view (PR [#8966](https://github.com/vatesfr/xen-orchestra/pull/8966))
  - [VM/Backups] Add side panel to VM backup jobs view (PR [#8978](https://github.com/vatesfr/xen-orchestra/pull/8978))
  - [Site/Backups] Add backup runs view (PR [#9007](https://github.com/vatesfr/xen-orchestra/pull/9007))
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
  - **deprecated** `GET /rest/v0/backup/logs` (PR [#8987](https://github.com/vatesfr/xen-orchestra/pull/8987))
  - **deprecated** `GET /rest/v0/backup/logs/<backup-log-id>` (PR [#8987](https://github.com/vatesfr/xen-orchestra/pull/8987))
  - **deprecated** `GET /rest/v0/restore/logs` (PR [#8987](https://github.com/vatesfr/xen-orchestra/pull/8987))
  - **deprecated** `GET /rest/v0/restore/logs/<restore-log-id>` (PR [#8987](https://github.com/vatesfr/xen-orchestra/pull/8987))
  - `GET /rest/v0/vms/<vm-id>/messages` (PR [#8988](https://github.com/vatesfr/xen-orchestra/pull/8988))
  - `GET /rest/v0/users/<user-id>/authentication_tokens` (PR [#8865](https://github.com/vatesfr/xen-orchestra/pull/8865))
  - `GET /rest/v0/vms/<vm-id>/tasks` (PR[#8955](https://github.com/vatesfr/xen-orchestra/pull/8955))
  - `GET /rest/v0/vm-snapshots/<vm-snapshot-id>/messages` (PR [#8997](https://github.com/vatesfr/xen-orchestra/pull/8997))

- [REST API] Expose `/rest/v0/proxies` and `/rest/v0/proxies/<proxy-id>` (PR [#8920](https://github.com/vatesfr/xen-orchestra/pull/8920))
- [XO5/Templates] Show template id when expanded the templates list (PR [#8949](https://github.com/vatesfr/xen-orchestra/pull/8949))
- [REST API] Expose `/rest/v0/vms/<vm-id>/backup-jobs` (PR [#8948](https://github.com/vatesfr/xen-orchestra/pull/8948))
- [SR/Advanced] Add a security to prevent accidentally reclaiming freed space during backups (PR [#8947](https://github.com/vatesfr/xen-orchestra/pull/8947))
- [New VM] Add a new variable in custom cloud config to easily add SSH keys (PR [#8968](https://github.com/vatesfr/xen-orchestra/pull/8968))
- [REST API] Expose `/rest/v0/backup-jobs` and `/rest/v0/backup-jobs/<backup-job-id>` (PR [#8970](https://github.com/vatesfr/xen-orchestra/pull/8970))
- [Host/PIFs] Use a natural sort when sorting by device (eth9 < eth10) (PR [#8967](https://github.com/vatesfr/xen-orchestra/pull/8967))
- [REST API] Expose `/rest/v0/backup-logs` and `/rest/v0/backup-logs/<backup-log-id>` (PR [#8987](https://github.com/vatesfr/xen-orchestra/pull/8987))
- [REST API] Expose `/rest/v0/restore-logs` and `/rest/v0/restore-logs/<restore-log-id>` (PR [#8987](https://github.com/vatesfr/xen-orchestra/pull/8987))

- **XO 6:**
  - [VM/dashboard] Update QuickInfo card in dashboard to show more information (PR [#8952](https://github.com/vatesfr/xen-orchestra/pull/8952))
  - [StateHero] Update VtsStateHero component and modify usages in every component (PR [#8910](https://github.com/vatesfr/pull/8910))
  - [VM] Add Backup Jobs page (PR [#8976](https://github.com/vatesfr/xen-orchestra/pull/8976))
  - [Treeview] Add a debounce function to the search input to improve user experience (PR [#8892](https://github.com/vatesfr/xen-orchestra/pull/8892))
  - [Site/Backups] Add side panel to backup jobs view (PR [#8966](https://github.com/vatesfr/xen-orchestra/pull/8966))
  - [VM/Backups] Add side panel to VM backup jobs view (PR [#8978](https://github.com/vatesfr/xen-orchestra/pull/8978))
  - [Site/Backups] Add backup runs view (PR [#9007](https://github.com/vatesfr/xen-orchestra/pull/9007))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- **XO 6:**
  - [VM/New] Fix `auto_poweron is an excess property and therefore is not allowed` during VM creation (PR [#8998](https://github.com/vatesfr/xen-orchestra/pull/8998))

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

- @xen-orchestra/web minor
- @xen-orchestra/web-core minor

<!--packages-end-->
