> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Stats] Ability to display last day stats [#4160](https://github.com/vatesfr/xen-orchestra/issues/4160) (PR [#4168](https://github.com/vatesfr/xen-orchestra/pull/4168))
- [Settings/servers] Display servers connection issues [#4300](https://github.com/vatesfr/xen-orchestra/issues/4300) (PR [#4310](https://github.com/vatesfr/xen-orchestra/pull/4310))
- [VM] Permission to revert to any snapshot for VM operators [#3928](https://github.com/vatesfr/xen-orchestra/issues/3928) (PR [#4247](https://github.com/vatesfr/xen-orchestra/pull/4247))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Settings/Servers] Fix read-only setting toggling
- [SDN Controller] Do not choose physical PIF without IP configuration for tunnels. (PR [#4319](https://github.com/vatesfr/xen-orchestra/pull/4319))
- [Xen servers] Fix `no connection found for object` error if pool master is reinstalled [#4299](https://github.com/vatesfr/xen-orchestra/issues/4299) (PR [#4302](https://github.com/vatesfr/xen-orchestra/pull/4302))
- [Backup-ng/restore] Display correct size for full VM backup [#4316](https://github.com/vatesfr/xen-orchestra/issues/4316) (PR [#4332](https://github.com/vatesfr/xen-orchestra/pull/4332))
- [SDN Controller] Better detection host shutting down to adapt network topology. (PR [#4314](https://github.com/vatesfr/xen-orchestra/pull/4314))

### Released packages

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.

- xo-server-sdn-controller v0.1.1
- xen-api v0.26.0
- xo-server v5.45.0
- xo-web v5.45.0
