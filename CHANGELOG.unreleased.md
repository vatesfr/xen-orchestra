> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST] Ability to add a new server `POST rest/v0/servers` (PR [#8564](https://github.com/vatesfr/xen-orchestra/pull/8564))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backups] mirror full backup bigger han 50GB from encrypted source (PR [#8570](https://github.com/vatesfr/xen-orchestra/pull/8570))
- [ACLs] Fix ACLs not being assigned properly when resource set is assigned to a VM (PR [#8571](https://github.com/vatesfr/xen-orchestra/pull/8571))

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

- @xen-orchestra/backups patch
- @xen-orchestra/fs patch
- @xen-orchestra/rest-api minor
- xo-server patch
- xo-server-auth-oidc patch

<!--packages-end-->
