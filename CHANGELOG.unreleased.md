> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [vm stats] Reduce the memory consumption of the rrd stats (PR [#10039](https://github.com/vatesfr/xen-orchestra/pull/10039))

- SR REST API Endpoints:

  - `GET :id/actions/probe_nfs` (PR [#10039](https://github.com/vatesfr/xen-orchestra/pull/10039))

  - `GET :id/actions/probe_zfs` (PR [#10039](https://github.com/vatesfr/xen-orchestra/pull/10039))

  - `GET :id/actions/probe_hba` (PR [#10039](https://github.com/vatesfr/xen-orchestra/pull/10039))

  - `GET :id/actions/probe_iscsi_iqns` (PR [#10039](https://github.com/vatesfr/xen-orchestra/pull/10039))

  - `GET :id/actions/probe_iscsi_luns` (PR [#10039](https://github.com/vatesfr/xen-orchestra/pull/10039))

  - `GET :id/actions/probe_iscsi_exists` (PR [#10039](https://github.com/vatesfr/xen-orchestra/pull/10039))

  - `GET :id/actions/probe_hba_exists` (PR [#10039](https://github.com/vatesfr/xen-orchestra/pull/10039))

  - `GET :id/actions/probe_nfs_exists` (PR [#10039](https://github.com/vatesfr/xen-orchestra/pull/10039))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [VDI] Fix progress bar appearing half-filled when used space is at 100% [Forum#100200](https://xcp-ng.org/forum/post/100200) (PR [#10027](https://github.com/vatesfr/xen-orchestra/pull/10027))

- [Backups] Improve resume of backup merge failure for VHD files (PR [#10053](https://github.com/vatesfr/xen-orchestra/pull/10053))

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

- @xen-orchestra/backup-archive patch
- @xen-orchestra/web patch
- xo-server minor

<!--packages-end-->
