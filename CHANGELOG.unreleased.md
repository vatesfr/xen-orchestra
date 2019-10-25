> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Breaking changes

- `xo-server` requires Node 8.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Hub] Ability to select SR in hub VM installation (PR [#4571](https://github.com/vatesfr/xen-orchestra/pull/4571))
- [Hub] Display more info about downloadable templates (PR [#4593](https://github.com/vatesfr/xen-orchestra/pull/4593))
- [Support] Ability to open and close support tunnel from the user interface [#4513](https://github.com/vatesfr/xen-orchestra/issues/4513) (PR [#4616](https://github.com/vatesfr/xen-orchestra/pull/4616))
- [xo-server-transport-icinga2] Add support of [icinga2](https://icinga.com/docs/icinga2/latest/doc/12-icinga2-api/) for reporting services status [#4563](https://github.com/vatesfr/xen-orchestra/issues/4563) (PR [#4573](https://github.com/vatesfr/xen-orchestra/pull/4573))
- [Hub] Ability to update existing template (PR [#4613](https://github.com/vatesfr/xen-orchestra/pull/4613))
- [Menu] Remove legacy backup entry [#4467](https://github.com/vatesfr/xen-orchestra/issues/4467) (PR [#4476](https://github.com/vatesfr/xen-orchestra/pull/4476))
- [Backup NG] Offline backup feature [#3449](https://github.com/vatesfr/xen-orchestra/issues/3449) (PR [#4470](https://github.com/vatesfr/xen-orchestra/pull/4470))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [SR] Fix `[object HTMLInputElement]` name after re-attaching a SR [#4546](https://github.com/vatesfr/xen-orchestra/issues/4546) (PR [#4550](https://github.com/vatesfr/xen-orchestra/pull/4550))
- [Schedules] Prevent double runs [#4625](https://github.com/vatesfr/xen-orchestra/issues/4625) (PR [#4626](https://github.com/vatesfr/xen-orchestra/pull/4626))
- [Schedules] Properly enable/disable on config import (PR [#4624](https://github.com/vatesfr/xen-orchestra/pull/4624))

### Released packages

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.

- @xen-orchestra/cron v1.0.5
- xo-server-transport-icinga2 v0.1.0
- xo-server-sdn-controller v0.3.1
- xo-server v5.51.0
- xo-web v5.51.0

### Dropped packages

- xo-server-cloud : this package was useless for OpenSource installations because it required a complete XOA environment
