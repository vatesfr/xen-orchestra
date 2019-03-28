> This file contains all changes that have not been released yet.

### Enhancements

- [Remotes] Benchmarks (read and write rate speed) added when remote is tested [#3991](https://github.com/vatesfr/xen-orchestra/issues/3991) (PR [#4015](https://github.com/vatesfr/xen-orchestra/pull/4015))
- [Cloud Config] Support both NoCloud and Config Drive 2 datasources for maximum compatibility (PR [#4053](https://github.com/vatesfr/xen-orchestra/pull/4053))
- [Advanced] Configurable cookie validity (PR [#4059](https://github.com/vatesfr/xen-orchestra/pull/4059))
- [Plugins] Display number of installed plugins [#4008](https://github.com/vatesfr/xen-orchestra/issues/4008) (PR [#4050](https://github.com/vatesfr/xen-orchestra/pull/4050))

### Bug fixes

- [Home] Always sort the items by their names as a secondary sort criteria [#3983](https://github.com/vatesfr/xen-orchestra/issues/3983) (PR [#4047](https://github.com/vatesfr/xen-orchestra/pull/4047))
- [Plugins] Properly remove optional settings when unchecking _Fill information_ (PR [#4076](https://github.com/vatesfr/xen-orchestra/pull/4076))
- [Remotes] Fixes `spawn mount EMFILE` error during backup
- Properly redirect to sign in page instead of being stuck in a refresh loop
- [Backup-ng] No more false positives when list matching VMs on Home page [#4078](https://github.com/vatesfr/xen-orchestra/issues/4078) (PR [#4085](https://github.com/vatesfr/xen-orchestra/pull/4085))

### Released packages

- @xen-orchestra/fs v0.8.0
- xo-server v5.38.0
- xo-web v5.38.0
