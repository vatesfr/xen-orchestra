> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Side panels] Side panels can be resized like the treeview, whose default width now adapts to the screen size (PR [#10725](https://github.com/vatesfr/xen-orchestra/pull/10725))
- [Side panels] Values stay next to their label when they fit and move below it otherwise, fields with several values (IP addresses, report recipients…) get a copy button per value and a "Copy all" action, and rows, links and statuses are more evenly spaced and sized (PR [#10733](https://github.com/vatesfr/xen-orchestra/pull/10733))
- [Treeview] A more compact tree, so that names get more room: lower rows running edge to edge and a smaller indent per level; hovering a quick actions button no longer highlights its whole row (PR [#10727](https://github.com/vatesfr/xen-orchestra/pull/10727))
- [Pool/Network] Add network dedicated page, with General and PIFs tabs (PR [#10704](https://github.com/vatesfr/xen-orchestra/pull/10704))
- [Pool/Traffic rules] Display traffic rules by priority within their network (PR [#10688](https://github.com/vatesfr/xen-orchestra/pull/10688))
- [VMs/Hosts] Show a loader in VM and host icons while their power state is changing, with the operation in progress in the tooltip, and move the header loader next to the name (PR [#10720](https://github.com/vatesfr/xen-orchestra/pull/10720))
- [REST API] Create, update and delete backup jobs and schedules (admin only): `POST /rest/v0/backup-jobs`, `PATCH|DELETE /rest/v0/backup-jobs/:id`, `POST /rest/v0/schedules`, `PATCH|DELETE /rest/v0/schedules/:id` (PR [#10595](https://github.com/vatesfr/xen-orchestra/pull/10595))
- [XO6/Groups] Add a groups list in the user management page (PR [#10272](https://github.com/vatesfr/xen-orchestra/pull/10272))
- [XO6/Groups] Select a group in the list to see its details and the users it contains in a side panel (PR [#10291](https://github.com/vatesfr/xen-orchestra/pull/10291))
- [XO6/Users] The groups listed in a user's side panel now open that group in XO 6, instead of linking to the XO 5 settings page (PR [#10291](https://github.com/vatesfr/xen-orchestra/pull/10291))
- [XO6/Roles] Add a roles list in the user management page (PR [#10301](https://github.com/vatesfr/xen-orchestra/pull/10301))
- [XO6/Roles] Select a role in the list to see its details, its privileges and the users and groups it is assigned to, in a side panel (PR [#10330](https://github.com/vatesfr/xen-orchestra/pull/10330))
- [XO6/Roles] Delete a role from the roles list or its side panel in the user management page. A role assigned to users or groups cannot be deleted (PR [#10353](https://github.com/vatesfr/xen-orchestra/pull/10353))
- [XO6/Users] Delete a user from the users list or its side panel in the user management page. A user cannot delete itself (PR [#10356](https://github.com/vatesfr/xen-orchestra/pull/10356))
- [XO6/Roles] Create a role and its privileges from the roles list in the user management page (PR [#10605](https://github.com/vatesfr/xen-orchestra/pull/10605))
- [XO6/Users] Open a user's detail page from the users list or its side panel, to see its details
- [XO6/Users] List the groups of a user in its detail page, add the user to groups and detach it from them
- [XO6/Users] List the roles of a user in its detail page, whether assigned directly or inherited from its groups, assign roles to the user and detach its direct roles
- [XO6/Groups] Open a group's detail page from the groups list or its side panel, to see its details
- [XO6/Groups] List the roles of a group in its detail page, assign roles to the group and detach them from it
- [XO6/Groups] List the members of a group in its detail page, add users to the group and remove them from it
- [XO6/Roles] Open a role's detail page from the roles tables or its side panel, to see its details
- [XO6/Roles] List the users a role is assigned to in its detail page, whether directly or through their groups, assign the role to users and detach it from its direct users
- [XO6/Roles] List the groups a role is assigned to in its detail page, assign the role to groups and detach it from them
- [XO6/Roles] List the privileges of a role in its detail page, and see the objects each privilege currently applies to in a side panel
- [XO6/Privileges] Open a privilege's detail page from the privileges table of a role or its side panel, to see its details
- [XO6/Privileges] See the scope of a privilege in its detail page: its scope type, its query and the objects it currently applies to

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Pools] Pool side panel now shows the same pool name, UUID and icon as the pools table, and keeps the pool card when the pool is disconnected or unreachable (PR [#10714](https://github.com/vatesfr/xen-orchestra/pull/10714))
- [Treeview] Fix translations of the tooltip for VM and host statuses in treeview (PR [#10643](https://github.com/vatesfr/xen-orchestra/pull/10643))
- [XO6/Users] Fix the side panel of a user always showing "No role applied": it now lists the roles of the user, grouped by the group they are inherited from, then its direct roles

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
