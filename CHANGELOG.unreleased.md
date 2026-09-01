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

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

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
