> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Settings/Logs] Use GitHub issue form with pre-filled fields when reporting a bug [#7142](https://github.com/vatesfr/xen-orchestra/issues/7142) (PR [#7274](https://github.com/vatesfr/xen-orchestra/pull/7274))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Proxies] Fix `this.getObject` is not a function during deployment
- [Settings/Logs] Fix `sr.getAllUnhealthyVdiChainsLength: not enough permissions` error with non-admin users (PR [#7265](https://github.com/vatesfr/xen-orchestra/pull/7265))
- [Settings/Logs] Fix `proxy.getAll: not enough permissions` error with non-admin users (PR [#7249](https://github.com/vatesfr/xen-orchestra/pull/7249))
- [Replication/Health Check] Fix `healthCheckVm.add_tag is not a function` error [Forum#69156](https://xcp-ng.org/forum/post/69156)
- [Plugin/load-balancer] Prevent unwanted migrations to hosts with low free memory (PR [#7288](https://github.com/vatesfr/xen-orchestra/pull/7288))
- [Pool/patches] Resolves [#6415] disable Rolling Pool Update button if host is alone in its pool (PR [#7286](https://github.com/vatesfr/xen-orchestra/pull/7286))

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
- @xen-orchestra/xapi patch
- xo-cli patch
- xo-server patch
- xo-server-load-balancer patch
- xo-web minor

<!--packages-end-->
