> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM/disks] Don't hide disks that are attached to the same VM twice [#4400](https://github.com/vatesfr/xen-orchestra/issues/4400) (PR [#4414](https://github.com/vatesfr/xen-orchestra/pull/4414))
- [VM/console] Add a button to connect to the VM via the local SSH client (PR [#4415](https://github.com/vatesfr/xen-orchestra/pull/4415))
- [SDN Controller] Add possibility to encrypt private networks (PR [#4441](https://github.com/vatesfr/xen-orchestra/pull/4441))

### Bug fixes

- [Backup NG/New schedule] Properly show user errors in the form [#3831](https://github.com/vatesfr/xen-orchestra/issues/3831) (PR [#4131](https://github.com/vatesfr/xen-orchestra/pull/4131))

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM/Advanced] Fix `"vm.set_domain_type" is not a function` error on switching virtualization mode (PV/HVM) [#4348](https://github.com/vatesfr/xen-orchestra/issues/4348) (PR [#4504](https://github.com/vatesfr/xen-orchestra/pull/4504))
- [Backup NG/logs] Show warning when zstd compression is selected but not supported [#3892](https://github.com/vatesfr/xen-orchestra/issues/3892) (PR [#4375](https://github.com/vatesfr/xen-orchestra/pull/4375)
- [Patches] Fix patches installation for CH 8.0 (PR [#4511](https://github.com/vatesfr/xen-orchestra/pull/4511))
- [Network] Fix inability to set a network name [#4514](https://github.com/vatesfr/xen-orchestra/issues/4514) (PR [4510](https://github.com/vatesfr/xen-orchestra/pull/4510))
- [Backup NG] Fix race conditions that could lead to disabled jobs still running (PR [4510](https://github.com/vatesfr/xen-orchestra/pull/4510))

### Released packages

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.

- @xen-orchestra/cron v1.0.4
- xo-server-sdn-controller v0.3.0
- xo-server v5.50.0
- xo-web v5.50.0
