> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [IPMI-Plugin] Add default outlet regex to the dell preset (PR [#9884](https://github.com/vatesfr/xen-orchestra/pull/9884))
- [REST API] Expose `POST /backup-repositories` and `PATCH /backup-repositories/:id` REST routes (PR [#9852](https://github.com/vatesfr/xen-orchestra/pull/9852))
- [SDN Controller] Replace xapi.objects.all with specified object types to avoid filtering through all objects each time (PR [#9886](https://github.com/vatesfr/xen-orchestra/pull/9886))
- **RBAC** check for REST API endpoints:
  - `POST /vbds` (PR [#9904](https://github.com/vatesfr/xen-orchestra/pull/9904))
  - `DELETE /vbds/:id` (PR [#9904](https://github.com/vatesfr/xen-orchestra/pull/9904))
  - `POST vbds/:id/actions/connect` (PR [#9904](https://github.com/vatesfr/xen-orchestra/pull/9904))
  - `POST vbds/:id/actions/disconnect` (PR [#9904](https://github.com/vatesfr/xen-orchestra/pull/9904))
  - `POST /vifs` (PR [#9889](https://github.com/vatesfr/xen-orchestra/pull/9889))
  - `DELETE /vifs/:id` (PR [#9889](https://github.com/vatesfr/xen-orchestra/pull/9889))
  - `POST /vifs/:id/actions/connect` (PR [#9889](https://github.com/vatesfr/xen-orchestra/pull/9889))
  - `POST /vifs/:id/actions/disconnect` (PR [#9889](https://github.com/vatesfr/xen-orchestra/pull/9889))
  - `POST /srs/:id/actions/reclaim_space` (PR [#9896](https://github.com/vatesfr/xen-orchestra/pull/9896))
  - `POST /srs/:id/actions/scan` (PR [#9896](https://github.com/vatesfr/xen-orchestra/pull/9896))
  - `POST /srs/:id/actions/forget` (PR [#9896](https://github.com/vatesfr/xen-orchestra/pull/9896))
  - `POST /pbds/:id/actions/plug` (PR [#9888](https://github.com/vatesfr/xen-orchestra/pull/9888))
  - `POST /pbds/:id/actions/unplug` (PR [#9888](https://github.com/vatesfr/xen-orchestra/pull/9888))
  - `GET /vdi-snapshots/{id}.{format}` (PR [#9906](https://github.com/vatesfr/xen-orchestra/pull/9906))
  - `GET /vdi-snapshots/{id}` (PR [#9906](https://github.com/vatesfr/xen-orchestra/pull/9906))
  - `DELETE /vdi-snapshots/{id}` (PR [#9906](https://github.com/vatesfr/xen-orchestra/pull/9906))
  - `PUT /vdi-snapshots/{id}/tags/{tag}` (PR [#9906](https://github.com/vatesfr/xen-orchestra/pull/9906))
  - `DELETE /vdi-snapshots/{id}/tags/{tag}` (PR [#9906](https://github.com/vatesfr/xen-orchestra/pull/9906))/vdi-snapshots/{id}.{format}` (PR [#9906](https://github.com/vatesfr/xen-orchestra/pull/9906))
  - `POST /vdis` (PR [#9908](https://github.com/vatesfr/xen-orchestra/pull/9908))
  - `/vdis/:id/actions/migrate` (PR [#9908](https://github.com/vatesfr/xen-orchestra/pull/9908))
  - `/vms/:id/actions/clone` (PR [#9910](https://github.com/vatesfr/xen-orchestra/pull/9910))
  - `/vms/:id/actions/migrate` (PR [#9910](https://github.com/vatesfr/xen-orchestra/pull/9910))

- [XO6] live update XO tasks (PR [#9901](https://github.com/vatesfr/xen-orchestra/pull/9901))
- [XO6/Backup] add progress for backups tasks (PR [#9901](https://github.com/vatesfr/xen-orchestra/pull/9901))
- [REST API] add `hosts/:id/actions/join_pool` REST route (PR [#9876](https://github.com/vatesfr/xen-orchestra/pull/9876))
- [VM/Network] Add VIF column to table (PR [#9959](https://github.com/vatesfr/xen-orchestra/pull/9959))
- [Rest Api] Ask for user credentials for unauthenticated users (PR [#9938](https://github.com/vatesfr/xen-orchestra/pull/9938))
- [Pool/System] Add `Reboot VM on internal shutdown` in pool's system tab (PR [#9962](https://github.com/vatesfr/xen-orchestra/pull/9962))
- [Netbox] Support Netbox v4.6.x [#9818](https://github.com/vatesfr/xen-orchestra/issues/9818) (PR [#9939](https://github.com/vatesfr/xen-orchestra/pull/9939))
- [Icons] Updated connect/disconnect icons to use a plug icon (PR [#9942](https://github.com/vatesfr/xen-orchestra/pull/9942))
- [Modal] Updated modal windows with a border and unified backgound color for better readability (PR [#9825](https://github.com/vatesfr/xen-orchestra/pull/9825))
- [XO6/VDI] Update actions name to be more consistent (PR [#9968](https://github.com/vatesfr/xen-orchestra/pull/9968))
- [SR] Storage repositories can now be deleted from the Pool/Host Storage tab (PR [#9853](https://github.com/vatesfr/xen-orchestra/pull/9853))
- [SR] Storage repositories can now be disconnected from the Pool/Host Storage tab (PR [#9856](https://github.com/vatesfr/xen-orchestra/pull/9856))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Qcow2] Fix initialization Map range error for big (>1 TB) Qcow2 disks (PR [#9940](https://github.com/vatesfr/xen-orchestra/pull/9940))
- **XO 5**:
  - [Jobs] fix array values being incorrectly handled (used for instance on job.runSequence) (PR [#9928](https://github.com/vatesfr/xen-orchestra/pull/9928))
- [Backups] Remove now useless warnign if folders are orphaned from old jobs (PR [#9958](https://github.com/vatesfr/xen-orchestra/pull/9958))
- [V2V] Fix stream issue for large disks used with smaller blocks (PR [#9948](https://github.com/vatesfr/xen-orchestra/pull/9948))
- xo-server-sdn-controller: apply/clean network rules on VIF update (PR [#9933](https://github.com/vatesfr/xen-orchestra/pull/9933))
- [Rest Api] Fix `possibly unhandled rejection invalid crendentials` (PR [#9938](https://github.com/vatesfr/xen-orchestra/pull/9938))
- [Backups] Fixed "Cannot read properties of undefined" issues (PR [#9944](https://github.com/vatesfr/xen-orchestra/pull/9944))
- [REST API] `GET /vms/:id.:format`, `GET /vm-templates/:id.:format`, `GET /vm-snapshots/:id.:format` now correctly support explicit compress query param (`zstd` | `gzip`). Still support `true` | `false` as deprecated value (PR [#9960](https://github.com/vatesfr/xen-orchestra/pull/9960))
- [Backup/Restore] Fix file-level restore of VMs whose disks use LVM (e.g. the default Ubuntu install layout): logical volumes are now listed and can be restored, including when restoring several copies of the same VM at once — previously failed with `unknown filesystem type 'LVM2_member'` (PR [#9776](https://github.com/vatesfr/xen-orchestra/pull/9776))
- [Backup/Restore] Fix file-level restore hanging when downloading large folders, and high memory use when downloading a folder as a zip (PR [#9776](https://github.com/vatesfr/xen-orchestra/pull/9776))

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

- @vates/fuse-vhd patch
- @vates/types minor
- @xen-orchestra/acl minor
- @xen-orchestra/backup-archive patch
- @xen-orchestra/backups patch
- @xen-orchestra/disk-transform patch
- @xen-orchestra/qa-test minor
- @xen-orchestra/qcow2 patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi minor
- xo-common minor
- xo-server minor
- xo-server-ipmi-sensors patch
- xo-server-netbox minor
- xo-server-sdn-controller patch
- xo-web patch

<!--packages-end-->
