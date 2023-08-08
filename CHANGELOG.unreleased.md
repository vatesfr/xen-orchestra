> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Pool/Advanced] Ability to set a crash dump SR [#5060](https://github.com/vatesfr/xen-orchestra/issues/5060) (PR [#6973](https://github.com/vatesfr/xen-orchestra/pull/6973))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [LDAP] Mark the _Id attribute_ setting as required
- [Incremental Replication] Fix `TypeError: Cannot read properties of undefined (reading 'uuid') at #isAlreadyOnHealthCheckSr` [Forum#7492](https://xcp-ng.org/forum/topic/7492) (PR [#6969](https://github.com/vatesfr/xen-orchestra/pull/6969))

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
- xen-api patch
- xo-server patch
- xo-server-auth-ldap patch
- xo-web minor

<!--packages-end-->
