> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [VM/New] Added secureBoot support (PR [#9423](https://github.com/vatesfr/xen-orchestra/pull/9423))
- [i18n] Update Czech and Danish translations (PR [#9531](https://github.com/vatesfr/xen-orchestra/pull/9531))
- [openmetrics] add XO process metrics (PR [#9535](https://github.com/vatesfr/xen-orchestra/pull/9535))
- [OpenMetrics] Add missing VBD throughput, VBD average latency, and DCMI power consumption metrics (PR [#9563](https://github.com/vatesfr/xen-orchestra/pull/9563))
- [VM] Add backup runs and backup archives cards on dashboard (PR [#9303](https://github.com/vatesfr/xen-orchestra/pull/9303))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Dashboard] Fix reactivity of dashboard (PR [#9378](https://github.com/vatesfr/xen-orchestra/pull/9378))
- [OpenMetrics] Fix latency metrics (`xcp_host_disk_read_latency_seconds`, `xcp_host_disk_write_latency_seconds`, `xcp_vm_disk_read_latency_seconds`, `xcp_vm_disk_write_latency_seconds`) reporting milliseconds instead of seconds (PR [#9550](https://github.com/vatesfr/xen-orchestra/pull/9550))

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
- xo-server minor
- xo-server-openmetrics minor

<!--packages-end-->
