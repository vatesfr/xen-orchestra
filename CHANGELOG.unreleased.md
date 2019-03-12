> This file contains all changes that have not been released yet.

### Enhancements

- [SR/Disk] Disable actions on unmanaged VDIs [#3988](https://github.com/vatesfr/xen-orchestra/issues/3988) (PR [#4000](https://github.com/vatesfr/xen-orchestra/pull/4000))
- [Pool] Specify automatic networks on a Pool [#3916](https://github.com/vatesfr/xen-orchestra/issues/3916) (PR [#3958](https://github.com/vatesfr/xen-orchestra/pull/3958))
- [VM/advanced] Manage start delay for VM [#3909](https://github.com/vatesfr/xen-orchestra/issues/3909) (PR [#4002](https://github.com/vatesfr/xen-orchestra/pull/4002))
- [New/Vm] SR section: Display warning message when the selected SRs aren't in the same host [#3911](https://github.com/vatesfr/xen-orchestra/issues/3911) (PR [#3967](https://github.com/vatesfr/xen-orchestra/pull/3967))
- Enable compression for HTTP requests (and initial objects fetch)
- [VDI migration] Display same-pool SRs first in the selector [#3945](https://github.com/vatesfr/xen-orchestra/issues/3945) (PR [#3996](https://github.com/vatesfr/xen-orchestra/pull/3996))
- [Home] Save the current page in url [#3993](https://github.com/vatesfr/xen-orchestra/issues/3993) (PR [#3999](https://github.com/vatesfr/xen-orchestra/pull/3999))
- [Stats] Improve the fetch performance in case of a simultaneous requests [#4017](https://github.com/vatesfr/xen-orchestra/issues/4017) (PR [#4028](https://github.com/vatesfr/xen-orchestra/pull/4028))

### Bug fixes

- [New network] PIF was wrongly required which prevented from creating a private network (PR [#4010](https://github.com/vatesfr/xen-orchestra/pull/4010))
- [Google authentication] Migrate to new endpoint
- [Backup NG] Better handling of huge logs [#4025](https://github.com/vatesfr/xen-orchestra/issues/4025) (PR [#4026](https://github.com/vatesfr/xen-orchestra/pull/4026))
- [Home/VM] Bulk migration: fixed VM VDIs not migrated to the selected SR [#3986](https://github.com/vatesfr/xen-orchestra/issues/3986) (PR [#3987](https://github.com/vatesfr/xen-orchestra/pull/3987))

### Released packages

- xo-server-auth-google v0.2.1
- xo-server v5.37.0
- xo-web v5.37.0
