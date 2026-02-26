> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [OpenMetrics] Expose SR capacity metrics: `xcp_sr_virtual_size_bytes`, `xcp_sr_physical_size_bytes`, `xcp_sr_physical_usage_bytes` (PR [#9360](https://github.com/vatesfr/xen-orchestra/pull/9360))
- [REST API] Update `/dashboard` endpoint to also return disconnected servers, disabled hosts, the status of all VMs, and compute `jobs` from the last seven days (PR [#9207](https://github.com/vatesfr/xen-orchestra/pull/9207))
- [vhd-cli] Prevent using invalid options (PR [#9386](https://github.com/vatesfr/xen-orchestra/pull/9386))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [REST API] Fix `/vms/:id/dashboard` _cannot read properties of undefined (reading 'id')_ (PR [#9380](https://github.com/vatesfr/xen-orchestra/pull/9380))
- [REST API] `vms/:id/dashboard` return now an empty object for the `replication` key instead of undefined (in case of no replication) (PR [#9380](https://github.com/vatesfr/xen-orchestra/pull/9380))
- [REST API] `vms/:id/dashboard` rename `not-in-job` into `not-in-active-job` for the `vmProtection` key to avoid confusion (PR [#9380](https://github.com/vatesfr/xen-orchestra/pull/9380))
- [REST API] Don't return VDI-snapshot for `/vms/:id/vdis` endpoints (PR [#9381](https://github.com/vatesfr/xen-orchestra/pull/9381))
- **XO 6:**
  - [Sidebar] Removal borders top and right of sidebar in mobile (PR [#9366](https://github.com/vatesfr/xen-orchestra/pull/9366))

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

- @vates/task minor
- @vates/types minor
- @xen-orchestra/backups minor
- @xen-orchestra/proxy minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- vhd-cli minor
- xo-server minor
- xo-server-backup-reports minor
- xo-server-openmetrics minor
- xo-web minor

<!--packages-end-->
