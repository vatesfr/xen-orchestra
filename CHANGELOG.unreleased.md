> This file contains all changes that have not been released yet.

### Enhancements

- [auth-saml] Improve compatibility with Microsoft Azure Active Directory (PR [#4294](https://github.com/vatesfr/xen-orchestra/pull/4294))
- [Backup-ng/restore] Display size for full VM backup [#4009](https://github.com/vatesfr/xen-orchestra/issues/4009) (PR [#4245](https://github.com/vatesfr/xen-orchestra/pull/4245))
- [Host] Display warning when "Citrix Hypervisor" license has restrictions [#4251](https://github.com/vatesfr/xen-orchestra/issues/4164) (PR [#4235](https://github.com/vatesfr/xen-orchestra/pull/4279))
- [Host] Display warning when host's time differs too much from XOA's time [#4113](https://github.com/vatesfr/xen-orchestra/issues/4113) (PR [#4173](https://github.com/vatesfr/xen-orchestra/pull/4173))
- [SDN Controller plugin] allow pool-wide private networks creation (PR [#4269](https://github.com/vatesfr/xen-orchestra/pull/4269))
- [Sr/new] Ability to select NFS version when creating NFS storage [#3951](https://github.com/vatesfr/xen-orchestra/issues/#3951) (PR [#4277](https://github.com/vatesfr/xen-orchestra/pull/4277))
- [SR/new] Create ZFS storage [#4260](https://github.com/vatesfr/xen-orchestra/issues/4260) (PR [#4266](https://github.com/vatesfr/xen-orchestra/pull/4266))
- [VM/Backup] Create backup bulk action [#2573](https://github.com/vatesfr/xen-orchestra/issues/2573) (PR [#4257](https://github.com/vatesfr/xen-orchestra/pull/4257))

### Bug fixes

- [Metadata backup] Missing XAPIs should trigger a failure job [#4281](https://github.com/vatesfr/xen-orchestra/issues/4281) (PR [#4283](https://github.com/vatesfr/xen-orchestra/pull/4283))
- [Host/advanced] Fix host CPU hyperthreading detection [#4262](https://github.com/vatesfr/xen-orchestra/issues/4262) (PR [#4285](https://github.com/vatesfr/xen-orchestra/pull/4285))

### Released packages

- xo-server v5.44.0
- xo-server-auth-saml v0.6.0
- xo-server-backup-reports v0.16.2
- xo-server-sdn-controller v0.1
- xo-web v5.44.0
