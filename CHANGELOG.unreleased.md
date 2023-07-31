> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Settings/Users] Show users authentication methods (PR [#6962](https://github.com/vatesfr/xen-orchestra/pull/6962))
- [Settings/Users] User external authentication methods can be manually removed (PR [#6962](https://github.com/vatesfr/xen-orchestra/pull/6962))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [New VM] Order interfaces by device as done on a VM Network tab (PR [#6944](https://github.com/vatesfr/xen-orchestra/pull/6944))
- Users can no longer sign in using their XO password if they are using other authentication providers (PR [#6962](https://github.com/vatesfr/xen-orchestra/pull/6962))

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

- xo-server minor
- xo-server-auth-github minor
- xo-server-auth-google minor
- xo-web patch

<!--packages-end-->
