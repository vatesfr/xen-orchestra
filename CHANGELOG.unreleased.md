> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [OpenMetrics] Add `is_control_domain` label to VM metrics to differentiate dom0 VMs from regular VMs (PR [#9474](https://github.com/vatesfr/xen-orchestra/pull/9474))
- [REST API] Add `objectType` to tasks for resolved object references (PR [#9429](https://github.com/vatesfr/xen-orchestra/pull/9429))
- [Warm Migration] the api call now return the new VM uuid (PR [#94653](https://github.com/vatesfr/xen-orchestra/pull/9465))
- [Warm Migration] stopped VM can be warm migrated (PR [#94653](https://github.com/vatesfr/xen-orchestra/pull/9465))

- [Plugins/load balancer] Add configurable VM migration cooldown to prevent oscillation (default 30min) (PR [#9388](https://github.com/vatesfr/xen-orchestra/pull/9388))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

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

- @xen-orchestra/fs patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web patch
- xo-server minor
- xo-server-load-balancer minor
- xo-server-openmetrics minor

<!--packages-end-->
