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

- [XO6] live update XO tasks (PR [#9901](https://github.com/vatesfr/xen-orchestra/pull/9901))
- [XO6/Backup] add progress for backups tasks(PR [#9901](https://github.com/vatesfr/xen-orchestra/pull/9901))
- [REST API] add `hosts/:id/actions/join_pool` REST route (PR [#9876](https://github.com/vatesfr/xen-orchestra/pull/9876))

- [Rest Api] Ask for user credentials for unauthenticated users (PR [#9938](https://github.com/vatesfr/xen-orchestra/pull/9938))

- [Netbox] Support Netbox v4.6.x [#9818](https://github.com/vatesfr/xen-orchestra/issues/9818) (PR [#9939](https://github.com/vatesfr/xen-orchestra/pull/9939))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Qcow2] Fix initialization Map range error for big (>1 TB) Qcow2 disks (PR [#9940](https://github.com/vatesfr/xen-orchestra/pull/9940))
- **XO 5**:
  - [Jobs] fix array values being incorrectly handled (used for instance on job.runSequence) (PR [#9928](https://github.com/vatesfr/xen-orchestra/pull/9928))
- [V2V] Fix stream issue for large disks used with smaller blocks (PR [#9948](https://github.com/vatesfr/xen-orchestra/pull/9948))
- xo-server-sdn-controller: apply/clean network rules on VIF update (PR [#9933](https://github.com/vatesfr/xen-orchestra/pull/9933))
- [Rest Api] Fix `possibly unhandled rejection invalid crendentials` (PR [#9938](https://github.com/vatesfr/xen-orchestra/pull/9938))
- [Backups] Fixed "Cannot read properties of undefined" issues (PR [#9944](https://github.com/vatesfr/xen-orchestra/pull/9944))

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
- @xen-orchestra/disk-transform patch
- @xen-orchestra/qcow2 patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/xapi minor
- xo-common minor
- xo-server minor
- xo-server-ipmi-sensors patch
- xo-server-netbox minor
- xo-server-sdn-controller patch
- xo-web patch

<!--packages-end-->
