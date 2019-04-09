> This file contains all changes that have not been released yet.

### Enhancements

- [Settings/remotes] Expose mount options field for SMB [#4063](https://github.com/vatesfr/xen-orchestra/issues/4063) (PR [#4067](https://github.com/vatesfr/xen-orchestra/pull/4067))
- [Backup/Schedule] Add warning regarding DST when you add a schedule [#4042](https://github.com/vatesfr/xen-orchestra/issues/4042) (PR [#4056](https://github.com/vatesfr/xen-orchestra/pull/4056))
- [Import] Avoid blocking the UI when dropping a big OVA file on the UI (PR [#4018](https://github.com/vatesfr/xen-orchestra/pull/4018))
- [Backup NG/Overview] Make backup list title clearer [#4111](https://github.com/vatesfr/xen-orchestra/issues/4111) (PR [#4129](https://github.com/vatesfr/xen-orchestra/pull/4129))

### Bug fixes

- [Continuous Replication] Fix VHD size guess for empty files [#4105](https://github.com/vatesfr/xen-orchestra/issues/4105)  (PR [#4107](https://github.com/vatesfr/xen-orchestra/pull/4107))
- [Backup NG] Only display full backup interval in case of a delta backup (PR [#4125](https://github.com/vatesfr/xen-orchestra/pull/4107))
- [Dashboard/Health] fix 'an error has occurred' on the storage state table [#4128](https://github.com/vatesfr/xen-orchestra/issues/4128)  (PR [#4132](https://github.com/vatesfr/xen-orchestra/pull/4132))

### Released packages

- xo-vmdk-to-vhd v0.1.7
- vhd-lib v0.6.1
- xo-server v5.39.0
- xo-web v5.39.0
