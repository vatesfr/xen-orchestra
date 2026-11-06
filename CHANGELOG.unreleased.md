> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Servers] The objects of a pool which can no longer be reached are kept and flagged as disconnected, with the last time the pool was reached, instead of disappearing. They are flagged after 30 seconds instead of 5 minutes (`xapiMarkDisconnectedDelay`), and removed after 1 hour (`xapiStaleObjectsMaxAge`) (PR [#10611](https://github.com/vatesfr/xen-orchestra/pull/10611))
- [Servers] The time allowed to fetch the objects of a pool on connection is now set by `xapiObjectsFetchTimeout` (5 minutes), no longer by `xapiMarkDisconnectedDelay` (PR [#10611](https://github.com/vatesfr/xen-orchestra/pull/10611))

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
- xo-server-load-balancer patch
- xo-server-netbox patch
- xo-server-perf-alert patch
- xo-server-usage-report patch
- xo-web minor

<!--packages-end-->
