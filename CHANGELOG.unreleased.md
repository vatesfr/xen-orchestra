> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Plugin/auth-oidc] Support `email` for _username field_ setting [Forum#59587](https://xcp-ng.org/forum/post/59587)
- [Plugin/auth-oidc] Well-known suffix is now optional in _auto-discovery URL_
- [PIF selector] Display the VLAN number when displaying a VLAN PIF [#4697](https://github.com/vatesfr/xen-orchestra/issues/4697) (PR [#6714](https://github.com/vatesfr/xen-orchestra/pull/6714))
- [Home/pool, host] Grouping of alert icons (PR [#6655](https://github.com/vatesfr/xen-orchestra/pull/6655))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup/Restore] Fix restore via a proxy showing as interupted (PR [#6702](https://github.com/vatesfr/xen-orchestra/pull/6702))
- [REST API] Backup logs are now available at `/rest/v0/backups/logs`
- [Plugin/auth-oidc] Fix empty user names when using default config [Forum#59587](https://xcp-ng.org/forum/post/59587)

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

- @xen-orchestra/backups minor
- xo-server minor
- xo-server-auth-oidc minor
- xo-web minor

<!--packages-end-->
