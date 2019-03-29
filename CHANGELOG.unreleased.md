> This file contains all changes that have not been released yet.

### Enhancements

- [Remotes] Benchmarks (read and write rate speed) added when remote is tested [#3991](https://github.com/vatesfr/xen-orchestra/issues/3991) (PR [#4015](https://github.com/vatesfr/xen-orchestra/pull/4015))
- [Cloud Config] Support both NoCloud and Config Drive 2 datasources for maximum compatibility (PR [#4053](https://github.com/vatesfr/xen-orchestra/pull/4053))
- [Advanced] Configurable cookie validity (PR [#4059](https://github.com/vatesfr/xen-orchestra/pull/4059))
- [Plugins] Display number of installed plugins [#4008](https://github.com/vatesfr/xen-orchestra/issues/4008) (PR [#4050](https://github.com/vatesfr/xen-orchestra/pull/4050))
- [Continuous Replication] Opt-in mode to guess VHD size, should help with XenServer 7.1 CU2 and various `VDI_IO_ERROR` errors (PR [#3726](https://github.com/vatesfr/xen-orchestra/pull/3726))
- [VM/Snapshots] Always delete broken quiesced snapshots [#4074](https://github.com/vatesfr/xen-orchestra/issues/4074) (PR [#4075](https://github.com/vatesfr/xen-orchestra/pull/4075))
- [Settings/Servers] Display link to pool [#4041](https://github.com/vatesfr/xen-orchestra/issues/4041) (PR [#4045](https://github.com/vatesfr/xen-orchestra/pull/4045))
- [Import] Change wording of drop zone (PR [#4020](https://github.com/vatesfr/xen-orchestra/pull/4020))

### Bug fixes

- [Home] Always sort the items by their names as a secondary sort criteria [#3983](https://github.com/vatesfr/xen-orchestra/issues/3983) (PR [#4047](https://github.com/vatesfr/xen-orchestra/pull/4047))
- [Remotes] Fixes `spawn mount EMFILE` error during backup
- Properly redirect to sign in page instead of being stuck in a refresh loop
- [Backup-ng] No more false positives when list matching VMs on Home page [#4078](https://github.com/vatesfr/xen-orchestra/issues/4078) (PR [#4085](https://github.com/vatesfr/xen-orchestra/pull/4085))
- [Plugins] Properly remove optional settings when unchecking _Fill information_ (PR [#4076](https://github.com/vatesfr/xen-orchestra/pull/4076))
- [Patches] (PR [#4077](https://github.com/vatesfr/xen-orchestra/pull/4077))
  - Add a host to a pool: fixes the auto-patching of the host on XenServer < 7.2 [#3783](https://github.com/vatesfr/xen-orchestra/issues/3783)
  - Add a host to a pool: homogenizes both the host and **pool**'s patches [#2188](https://github.com/vatesfr/xen-orchestra/issues/2188)
  - Safely install a subset of patches on a pool [#3777](https://github.com/vatesfr/xen-orchestra/issues/3777)
  - XCP-ng: no longer requires to run `yum install xcp-ng-updater` when it's already installed [#3934](https://github.com/vatesfr/xen-orchestra/issues/3934)

### Released packages

- vhd-lib v0.6.0
- @xen-orchestra/fs v0.8.0
- xo-server-usage-report v0.7.2
- xo-server v5.38.0
- xo-web v5.38.0
