> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

- [OpenMetrics] Add 9 missing host RRD metrics: `hostload`, `memory_reclaimed`, `memory_reclaimed_max`, `running_vcpus`, `pif_aggr_rx`, `pif_aggr_tx`, `iops_total`, `io_throughput_total`, `latency` per SR (PR [#9696](https://github.com/vatesfr/xen-orchestra/pull/9696))

> Users must be able to say: "Nice enhancement, I'm eager to test it"

### Bug fixes

- [Header]: Fix `Unable to connect to XO server` falshing every 30 secondes (PR [#9681](https://github.com/vatesfr/xen-orchestra/pull/9681))

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

- @xen-orchestra/immutable-backups patch
- @xen-orchestra/web patch
- @xen-orchestra/web-core patch
- xo-server minor
- xo-server-openmetrics minor

<!--packages-end-->
