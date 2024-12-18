> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST/Dashboard] Add the number of connected/unreachable/unknown pools in the `/dashboard` endpoint (PR [#8203](https://github.com/vatesfr/xen-orchestra/pull/8203))
- [VM/Advanced] Ability to create/edit/delete XenStore entries (PR [#8174](https://github.com/vatesfr/xen-orchestra/pull/8174))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [New/Network] Fix `Pool is undefined` when creating a private network (PR [#8188](https://github.com/vatesfr/xen-orchestra/pull/8188))

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

- @xen-orchestra/web-core minor
- xo-server minor
- xo-web minor

<!--packages-end-->
