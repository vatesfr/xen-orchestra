> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Netbox] Synchronize VM tags [#5899](https://github.com/vatesfr/xen-orchestra/issues/5899) [Forum#6902](https://xcp-ng.org/forum/topic/6902) (PR [#6957](https://github.com/vatesfr/xen-orchestra/pull/6957))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [LDAP] Mark the _Id attribute_ setting as required
- [Incremental Replication] Fix `TypeError: Cannot read properties of undefined (reading 'uuid') at #isAlreadyOnHealthCheckSr` [Forum#7492](https://xcp-ng.org/forum/topic/7492) (PR [#6969](https://github.com/vatesfr/xen-orchestra/pull/6969))
- [File Restore] Increase timeout from one to ten minutes when restoring through XO Proxy

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
- @xen-orchestra/mixins minor
- xen-api patch
- xo-server patch
- xo-server-auth-ldap patch
- xo-server-netbox minor
- xo-web patch

<!--packages-end-->
