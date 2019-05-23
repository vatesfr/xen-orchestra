> This file contains all changes that have not been released yet.

### Enhancements

- [VM/general] Display 'Started... ago' instead of 'Halted... ago' for paused state [#3750](https://github.com/vatesfr/xen-orchestra/issues/3750) (PR [#4170](https://github.com/vatesfr/xen-orchestra/pull/4170))
- [Metadata backup] Ability to define when the backup report will be sent (PR [#4149](https://github.com/vatesfr/xen-orchestra/pull/4149))
- [XOA/Update] Ability to select release channel [#4200](https://github.com/vatesfr/xen-orchestra/issues/4200) (PR [#4202](https://github.com/vatesfr/xen-orchestra/pull/4202))
- [User] Forget connection tokens on password change or on demand [#4214](https://github.com/vatesfr/xen-orchestra/issues/4214) (PR [#4224](https://github.com/vatesfr/xen-orchestra/pull/4224))
- [Settings/Logs] LICENCE_RESTRICTION errors: suggest XCP-ng as an Open Source alternative [#3876](https://github.com/vatesfr/xen-orchestra/issues/3876) (PR [#4238](https://github.com/vatesfr/xen-orchestra/pull/4238))

### Bug fixes

- [Charts] Fixed the chart lines sometimes changing order/color (PR [#4221](https://github.com/vatesfr/xen-orchestra/pull/4221))
- Prevent non-admin users to access admin pages with URL
- [Upgrade] Fix alert before upgrade while running backup jobs (PR [#4235](https://github.com/vatesfr/xen-orchestra/pull/4235))
- [Import] Fix import OVA files (PR [#4232](https://github.com/vatesfr/xen-orchestra/pull/4232))
- [VM/network] Fix duplicate IPv4 (PR [#4239](https://github.com/vatesfr/xen-orchestra/pull/4239))
- [Remotes] Fix disconnected remotes which may appear to work

### Released packages

- xo-server v5.42.0
- xo-web v5.42.0
