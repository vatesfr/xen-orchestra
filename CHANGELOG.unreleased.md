> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [OpenMetrics] Expose SR capacity metrics: `xcp_sr_virtual_size_bytes`, `xcp_sr_physical_size_bytes`, `xcp_sr_physical_usage_bytes` (PR [#9360](https://github.com/vatesfr/xen-orchestra/pull/9360))
- [REST API] Update `/dashboard` endpoint to also return disconnected servers, disabled hosts, the status of all VMs, and compute `jobs` from the last seven days (PR [#9207](https://github.com/vatesfr/xen-orchestra/pull/9207))
- [vhd-cli] Prevent using invalid options (PR [#9386](https://github.com/vatesfr/xen-orchestra/pull/9386))
- [REST API] Add endpoints to reconfigure management interface for hosts and pools (PR [#9369](https://github.com/vatesfr/xen-orchestra/pull/9369))
- [REST API] Add delete and add traffic rule endpoints for VIFs ([#9418](https://github.com/vatesfr/xen-orchestra/pull/9418))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [XO5/XO6/Stats] Return `null` instead of `0` when no stats available (PR [#9634](https://github.com/vatesfr/xen-orchestra/pull/9634))
- [i18n] Fix English grammar issues on Site Dashboard, contribution by [@DustyArmstrong](https://github.com/DustyArmstrong) (PR [#9647](https://github.com/vatesfr/xen-orchestra/pull/https://github.com/vatesfr/xen-orchestra/pull/9647))

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

- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- vhd-cli minor
- xo-server minor
- xo-server-openmetrics minor
- xo-server-sdn-controller minor

<!--packages-end-->
