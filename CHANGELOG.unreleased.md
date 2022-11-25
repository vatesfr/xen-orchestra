> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Remotes] Prevent remote path from ending with `xo-vm-backups` as it's usually a mistake
- [OVA export] Speed up OVA generation by 2. Generated file will be bigger (as big as uncompressed XVA) (PR [#6487](https://github.com/vatesfr/xen-orchestra/pull/6487))
- [Plugin/transport-nagios] XO now reports beckup VMs invidually with the VM name label used as *host* and backup job name used as *service*

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Dashboard/Health] Fix `Unknown SR` and `Unknown VDI` in Unhealthy VDIs (PR [#6519](https://github.com/vatesfr/xen-orchestra/pull/6519))
- [Delta Backup] Can now recover VHD merge when failed at the begining
- [Delta Backup] Fix `ENOENT` errors when merging a VHD directory on non-S3 remote

### Packages to release

> When modifying a package, add it here with its release type.
>
> The format is the following: - `$packageName` `$releaseType`
>
> Where `$releaseType` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> Keep this list alphabetically ordered to avoid merge conflicts

<!--packages-start-->

- @xen-orchestra/backups-cli major
- @xen-orchestra/fs minor
- @xen-orchestra/log minor
- vhd-lib minor
- xo-cli patch
- xo-server minor
- xo-server-transport-nagios major
- xo-vmdk-to-vhd minor
- xo-web minor

<!--packages-end-->
