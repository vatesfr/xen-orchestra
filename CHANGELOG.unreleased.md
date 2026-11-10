> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

- Fix authentication token validation

> Security fixes and new features should go in this section

- [Backup/File restore] Symbolic links are no longer followed: browsing or downloading a path that goes through one is refused, and the links met inside a restored folder are skipped (PR [#9941](https://github.com/vatesfr/xen-orchestra/pull/9941))

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Header] On mobile, the XO 5 link and third party apps are grouped in a "More actions" menu (PR [#10744](https://github.com/vatesfr/xen-orchestra/pull/10744))
- [Mobile/Side panels] Full-page menus on mobile with "Change state" and "Manage in XO-5" in "More actions", side panel actions shown as buttons when there is room, and fixes for long names in headers and menu placement (PR [#10745](https://github.com/vatesfr/xen-orchestra/pull/10745))
- [Side panels] Side panels can be resized like the treeview, whose default width now adapts to the screen size (PR [#10725](https://github.com/vatesfr/xen-orchestra/pull/10725))
- [Side panels] Values stay next to their label when they fit and move below it otherwise, fields with several values (IP addresses, report recipients…) get a copy button per value and a "Copy all" action, and rows, links and statuses are more evenly spaced and sized (PR [#10733](https://github.com/vatesfr/xen-orchestra/pull/10733))
- [Treeview] A more compact tree, so that names get more room: lower rows running edge to edge and a smaller indent per level; hovering a quick actions button no longer highlights its whole row (PR [#10727](https://github.com/vatesfr/xen-orchestra/pull/10727))
- [Pool/Network] Add network dedicated page, with General and PIFs tabs (PR [#10704](https://github.com/vatesfr/xen-orchestra/pull/10704))
- [Pool/Traffic rules] Display traffic rules by priority within their network (PR [#10688](https://github.com/vatesfr/xen-orchestra/pull/10688))
- [VMs/Hosts] Show a loader in VM and host icons while their power state is changing, with the operation in progress in the tooltip, and move the header loader next to the name (PR [#10720](https://github.com/vatesfr/xen-orchestra/pull/10720))
- [REST API] Create, update and delete backup jobs and schedules (admin only): `POST /rest/v0/backup-jobs`, `PATCH|DELETE /rest/v0/backup-jobs/:id`, `POST /rest/v0/schedules`, `PATCH|DELETE /rest/v0/schedules/:id` (PR [#10595](https://github.com/vatesfr/xen-orchestra/pull/10595))
- [Web-Core/UiDropdownButton] Update dropdown buttons design and add a smaller size (PR [#9850](https://github.com/vatesfr/xen-orchestra/pull/9850))
- [REST API] `PUT /rest/v0/acl-roles/:id/users/:userId` refuses to attach a role to an admin, and `GET /rest/v0/users/:id/acl-privileges` returns no privileges for an admin (PR [#10694](https://github.com/vatesfr/xen-orchestra/pull/10694))
- [REST API/V2V] `POST /rest/v0/v2v/inventory` reads the inventory of a vCenter or ESXi (datacenters, clusters, hosts, datastores, networks and VMs with their disks and network cards), and `POST /rest/v0/pools/:id/actions/import_vms_from_vmware` imports a list of VMs into the pool, with an SR per disk and a network per network card, resuming partial imports with a delta. Restricted to administrators, credentials are never stored (PR [#10597](https://github.com/vatesfr/xen-orchestra/pull/10597))

- [REST API] Expose `GET /rest/v0/backup-archives/:id/disks/:diskId/partitions` (PR [#9941](https://github.com/vatesfr/xen-orchestra/pull/9941))
- [REST API] Expose `GET /rest/v0/backup-archives/:id/disks/:diskId/partitions/:partitionId/files` (PR [#9941](https://github.com/vatesfr/xen-orchestra/pull/9941))
- [REST API] Expose `GET /rest/v0/backup-archives/:id/disks/:diskId/files` (PR [#9941](https://github.com/vatesfr/xen-orchestra/pull/9941))
- [REST API] Expose `GET /rest/v0/backup-archives/:id/disks/:diskId/partitions/:partitionId/files.:format` to get file(s) from a partition (PR [#9941](https://github.com/vatesfr/xen-orchestra/pull/9941))
- [REST API] Expose `GET /rest/v0/backup-archives/:id/disks/:diskId/files.:format` to get file(s) from a bare disk (PR [#9941](https://github.com/vatesfr/xen-orchestra/pull/9941))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Pools] Pool side panel now shows the same pool name, UUID and icon as the pools table, and keeps the pool card when the pool is disconnected or unreachable (PR [#10714](https://github.com/vatesfr/xen-orchestra/pull/10714))
- [Treeview] Fix translations of the tooltip for VM and host statuses in treeview (PR [#10643](https://github.com/vatesfr/xen-orchestra/pull/10643))
- [V2V] Keep the MAC address of a network card set by hand on VMware, instead of generating a new one, and no longer create a network interface for a card which is not present (PR [#10597](https://github.com/vatesfr/xen-orchestra/pull/10597))

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
- @xen-orchestra/backups minor
- @xen-orchestra/qa-test minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/vmware-explorer minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server minor
- xo-server-load-balancer patch
- xo-web minor

<!--packages-end-->
