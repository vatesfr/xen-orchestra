> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [REST API] Fix download of host's audit and logs broken in XO 5.93.0
- [VM] Fix `unknown error` on export (broken in XO 5.93.0)
- [Host/Advanced] Fix _Hyper Threading_ not correctly recognized if _Smartctl_ plugin returned an error [Forum#8675](https://xcp-ng.org/forum/topic/8675/ht-smt-detection-in-8-3-not-fully-working) (PR [#7525](https://github.com/vatesfr/xen-orchestra/pull/7525))
- [VMWare/Migration] Use NFS datastore for import from XO5 (PR [#7530](https://github.com/vatesfr/xen-orchestra/pull/7530))
- [VMWare/Migration] Fix `Can't import delta of a running VM without its parent vdi` when importing snapshotless VM (PR [#7530](https://github.com/vatesfr/xen-orchestra/pull/7530))
- [VMWare/Migration] Don't fail all VMs if one does not have any disks (PR [#7530](https://github.com/vatesfr/xen-orchestra/pull/7530))
- [Plugin/perf-alert] Fix important CPU & memory usage (broken in XO 5.93.0)
- [New/VM] Correctly detects if the template requires a VTPM device

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

- @xen-orchestra/backups minor
- @xen-orchestra/vmware-explorer patch
- xo-server patch
- xo-server-perf-alert patch
- xo-web patch

<!--packages-end-->
