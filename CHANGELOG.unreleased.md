> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Expose `residentVms` property on hosts objects
- [VM/Advanced] Clarify _Windows Update_ label [#6628](https://github.com/vatesfr/xen-orchestra/issues/6628) (PR [#6632](https://github.com/vatesfr/xen-orchestra/pull/6632))
- [REST API] Add support to destroy VMs and VDIs
- [VM/Advanced] Add configuration flag for _Viridian_ platform [#6572](https://github.com/vatesfr/xen-orchestra/issues/6572) (PR [#6631](https://github.com/vatesfr/xen-orchestra/pull/6631))
- [Licenses] Makes `id` and `boundObjectId` copyable (PR [#6634](https://github.com/vatesfr/xen-orchestra/pull/6634))
- [REST API] The raw content of a VDI can be downloaded directly
- [Kubernetes recipe] Add the possibility to create the cluster with a static network configuration (PR [#6598](https://github.com/vatesfr/xen-orchestra/pull/6598))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [REST API] Fix 5 minutes timeouts on VDI/VM uploads [#6568](https://github.com/vatesfr/xen-orchestra/issues/6568)
- [Backup] Fix NBD configuration (PR [#6597](https://github.com/vatesfr/xen-orchestra/pull/6597))
- [NBD Backups] Fix transfer size [#6599](https://github.com/vatesfr/xen-orchestra/issues/6599)
- [Disk] Show bootable status for vm running in `pv_in_pvh` virtualisation mode [#6432](https://github.com/vatesfr/xen-orchestra/issues/6432) (PR [#6629](https://github.com/vatesfr/xen-orchestra/pull/6629))
- [Ova export] Reduce memory consumption (PR [#6637](https://github.com/vatesfr/xen-orchestra/pull/6637))

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

- @vates/task patch
- @xen-orchestra/backups patch
- @xen-orchestra/log minor
- @xen-orchestra/mixins feat
- @xen-orchestra/xapi patch
- vhd-lib patch
- xo-vmdk-to-vhd patch
- xo-cli patch
- xo-server minor
- xo-server-perf-alert patch
- xo-web minor

<!--packages-end-->
