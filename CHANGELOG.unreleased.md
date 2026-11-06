> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

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

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [XO6/Pools] Pool side panel now shows the same pool name, UUID and icon as the pools table, and keeps the pool card when the pool is disconnected or unreachable (PR [#10714](https://github.com/vatesfr/xen-orchestra/pull/10714))

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
- @xen-orchestra/rest-api patch
- @xen-orchestra/web patch
- @xen-orchestra/web-core minor
- xo-server minor
- xo-web minor

<!--packages-end-->
