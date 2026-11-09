> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

- Fix authentication token validation

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Header] On mobile, the XO 5 link and third party apps are grouped in a "More actions" menu (PR [#10744](https://github.com/vatesfr/xen-orchestra/pull/10744))
- [Mobile] Menus open in full page, "Change state" and "Manage in XO-5" move into the "More actions" menu of VMs and hosts, and an action closes the side panel or the treeview (PR [#10745](https://github.com/vatesfr/xen-orchestra/pull/10745))
- [Side panels] When the actions don't fit anymore, they move one by one into a "More actions" menu (PR [#10745](https://github.com/vatesfr/xen-orchestra/pull/10745))
- [VMs/Hosts] Lighter "Change state" button, and "Manage VM lifecycle in XO-5" is renamed "Manage in XO-5" (PR [#10745](https://github.com/vatesfr/xen-orchestra/pull/10745))
- [Side panels] Side panels can be resized like the treeview, whose default width now adapts to the screen size (PR [#10725](https://github.com/vatesfr/xen-orchestra/pull/10725))
- [Side panels] Values stay next to their label when they fit and move below it otherwise, fields with several values (IP addresses, report recipients…) get a copy button per value and a "Copy all" action, and rows, links and statuses are more evenly spaced and sized (PR [#10733](https://github.com/vatesfr/xen-orchestra/pull/10733))
- [Treeview] A more compact tree, so that names get more room: lower rows running edge to edge and a smaller indent per level; hovering a quick actions button no longer highlights its whole row (PR [#10727](https://github.com/vatesfr/xen-orchestra/pull/10727))
- [Pool/Network] Add network dedicated page, with General and PIFs tabs (PR [#10704](https://github.com/vatesfr/xen-orchestra/pull/10704))
- [Pool/Traffic rules] Display traffic rules by priority within their network (PR [#10688](https://github.com/vatesfr/xen-orchestra/pull/10688))
- [VMs/Hosts] Show a loader in VM and host icons while their power state is changing, with the operation in progress in the tooltip, and move the header loader next to the name (PR [#10720](https://github.com/vatesfr/xen-orchestra/pull/10720))
- [REST API] Create, update and delete backup jobs and schedules (admin only): `POST /rest/v0/backup-jobs`, `PATCH|DELETE /rest/v0/backup-jobs/:id`, `POST /rest/v0/schedules`, `PATCH|DELETE /rest/v0/schedules/:id` (PR [#10595](https://github.com/vatesfr/xen-orchestra/pull/10595))
- [Web-Core/UiDropdownButton] Update dropdown buttons design and add a smaller size (PR [#9850](https://github.com/vatesfr/xen-orchestra/pull/9850))
- [REST API] `PUT /rest/v0/acl-roles/:id/users/:userId` refuses to attach a role to an admin, and `GET /rest/v0/users/:id/acl-privileges` returns no privileges for an admin (PR [#10694](https://github.com/vatesfr/xen-orchestra/pull/10694))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Side panels] Fix the side panel showing up for a moment when switching tabs (PR [#10745](https://github.com/vatesfr/xen-orchestra/pull/10745))
- [Menus] Fix menus being shifted from their button and submenus opening on top of their parent menu (PR [#10745](https://github.com/vatesfr/xen-orchestra/pull/10745))
- [Pools] Pool side panel now shows the same pool name, UUID and icon as the pools table, and keeps the pool card when the pool is disconnected or unreachable (PR [#10714](https://github.com/vatesfr/xen-orchestra/pull/10714))
- [Treeview] Fix translations of the tooltip for VM and host statuses in treeview (PR [#10643](https://github.com/vatesfr/xen-orchestra/pull/10643))

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
- @xen-orchestra/backups minor
- @xen-orchestra/qa-test patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server minor
- xo-server-load-balancer patch
- xo-web minor

<!--packages-end-->
