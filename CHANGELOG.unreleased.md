> This file contains all changes that have not been released yet.

### Enhancements

- [Stats] Ability to display last day stats [#4160](https://github.com/vatesfr/xen-orchestra/issues/4160) (PR [#4168](https://github.com/vatesfr/xen-orchestra/pull/4168))
- [Backup-ng/restore] Display size for full VM backup [#4009](https://github.com/vatesfr/xen-orchestra/issues/4009) (PR [#4245](https://github.com/vatesfr/xen-orchestra/pull/4245))
- [Sr/new] Ability to select NFS version when creating NFS storage [#3951](https://github.com/vatesfr/xen-orchestra/issues/3951) (PR [#4277](https://github.com/vatesfr/xen-orchestra/pull/4277))
- [auth-saml] Improve compatibility with Microsoft Azure Active Directory (PR [#4294](https://github.com/vatesfr/xen-orchestra/pull/4294))
- [Host] Display warning when "Citrix Hypervisor" license has restrictions [#4251](https://github.com/vatesfr/xen-orchestra/issues/4164) (PR [#4235](https://github.com/vatesfr/xen-orchestra/pull/4279))
- [VM/Backup] Create backup bulk action [#2573](https://github.com/vatesfr/xen-orchestra/issues/2573) (PR [#4257](https://github.com/vatesfr/xen-orchestra/pull/4257))
- [Sr/new] Ability to select NFS version when creating NFS storage [#3951](https://github.com/vatesfr/xen-orchestra/issues/#3951) (PR [#4277](https://github.com/vatesfr/xen-orchestra/pull/4277))
- [SR/new] Create ZFS storage [#4260](https://github.com/vatesfr/xen-orchestra/issues/4260) (PR [#4266](https://github.com/vatesfr/xen-orchestra/pull/4266))
- [Host] Display warning when host's time differs too much from XOA's time [#4113](https://github.com/vatesfr/xen-orchestra/issues/4113) (PR [#4173](https://github.com/vatesfr/xen-orchestra/pull/4173))
- [Host/storages, SR/hosts] Display PBD details [#4264](https://github.com/vatesfr/xen-orchestra/issues/4161) (PR [#4268](https://github.com/vatesfr/xen-orchestra/pull/4284))
- [VM/network] Display and set bandwidth rate-limit of a VIF [#4215](https://github.com/vatesfr/xen-orchestra/issues/4215) (PR [#4293](https://github.com/vatesfr/xen-orchestra/pull/4293))
- [Settings/servers] Display servers connection issues [#4300](https://github.com/vatesfr/xen-orchestra/issues/4300) (PR [#4310](https://github.com/vatesfr/xen-orchestra/pull/4310))

### Bug fixes

- [Settings/Servers] Fix read-only setting toggling
- [SDN Controller] Do not choose physical PIF without IP configuration for tunnels. (PR [#4319](https://github.com/vatesfr/xen-orchestra/pull/4319))

### Released packages

- xo-server-sdn-controller v0.1.1
- xen-api v0.26.0
- xo-server v5.45.0
- xo-web v5.45.0
- xo-server-auth-saml v0.6.0
- xo-server-backup-reports v0.16.2
