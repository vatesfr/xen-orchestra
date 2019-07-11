> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Stats] Ability to display last day stats [#4160](https://github.com/vatesfr/xen-orchestra/issues/4160) (PR [#4168](https://github.com/vatesfr/xen-orchestra/pull/4168))
- [Settings/servers] Display servers connection issues [#4300](https://github.com/vatesfr/xen-orchestra/issues/4300) (PR [#4310](https://github.com/vatesfr/xen-orchestra/pull/4310))
- [VM] Permission to revert to any snapshot for VM operators [#3928](https://github.com/vatesfr/xen-orchestra/issues/3928) (PR [#4247](https://github.com/vatesfr/xen-orchestra/pull/4247))
- [VM] Show current operations and progress [#3811](https://github.com/vatesfr/xen-orchestra/issues/3811) (PR [#3982](https://github.com/vatesfr/xen-orchestra/pull/3982))
- [Backup NG/New] Generate default schedule if no schedule is specified [#4036](https://github.com/vatesfr/xen-orchestra/issues/4036) (PR [#4183](https://github.com/vatesfr/xen-orchestra/pull/4183))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Settings/Servers] Fix read-only setting toggling
- [SDN Controller] Do not choose physical PIF without IP configuration for tunnels. (PR [#4319](https://github.com/vatesfr/xen-orchestra/pull/4319))
- [Xen servers] Fix `no connection found for object` error if pool master is reinstalled [#4299](https://github.com/vatesfr/xen-orchestra/issues/4299) (PR [#4302](https://github.com/vatesfr/xen-orchestra/pull/4302))
- [Backup-ng/restore] Display correct size for full VM backup [#4316](https://github.com/vatesfr/xen-orchestra/issues/4316) (PR [#4332](https://github.com/vatesfr/xen-orchestra/pull/4332))
- [VM/tab-advanced] Fix CPU limits edition (PR [#4337](https://github.com/vatesfr/xen-orchestra/pull/4337))
- [Remotes] Fix `EIO` errors due to massive parallel fs operations [#4323](https://github.com/vatesfr/xen-orchestra/issues/4323) (PR [#4330](https://github.com/vatesfr/xen-orchestra/pull/4330))

### Released packages

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.

- @xen-orchestra/fs v0.10.0
- xo-server-sdn-controller v0.1.1
- xen-api v0.26.0
- xo-server v5.45.0
- xo-web v5.45.0
