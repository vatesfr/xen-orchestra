> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM] Move boot order setting from Disk tab to Advanced tab [#1523](https://github.com/vatesfr/xen-orchestra/issues/1523#issuecomment-563141573) (PR [#4975](https://github.com/vatesfr/xen-orchestra/pull/4975))
- [XOA/licenses] Display proxy licenses (PR [#4944](https://github.com/vatesfr/xen-orchestra/pull/4944))
- [Network selector] Display pool's name [#4885](https://github.com/vatesfr/xen-orchestra/issues/4885) (PR [#4990](https://github.com/vatesfr/xen-orchestra/pull/4990))
- [Usage report] Include CSV raw data files to the sent email [#4970](https://github.com/vatesfr/xen-orchestra/issues/4970) (PR [#4979](https://github.com/vatesfr/xen-orchestra/pull/4979))
- [Modal] Don't close pop-up forms when you click outside or press escape (PR [#5002](https://github.com/vatesfr/xen-orchestra/pull/5002))
- [Plugin/auth-ldap] Support `StartTLS` [#4999](https://github.com/vatesfr/xen-orchestra/issues/4999)
- [OVA import] Add support for OVA 2.0 file format (PR [#4921](https://github.com/vatesfr/xen-orchestra/pull/4921))
- [Audit] Record failed connection attempts [#4844](https://github.com/vatesfr/xen-orchestra/issues/4844) (PR [#4900](https://github.com/vatesfr/xen-orchestra/pull/4900))
- [XO config export] Ability to encrypt the exported file (PR [#4997](https://github.com/vatesfr/xen-orchestra/pull/4997))
- [SDN Controller] Ability to choose host as preferred center at private network creation [#4991](https://github.com/vatesfr/xen-orchestra/issues/4991) (PR [#5000](https://github.com/vatesfr/xen-orchestra/pull/5000))
- [Home/VM] Ability to list VMs which are (not) backed up [#4777](https://github.com/vatesfr/xen-orchestra/issues/4777) (PR [#4974](https://github.com/vatesfr/xen-orchestra/pull/4974))
- [Proxy] Ability to start a trial if no license available (PR [#5022](https://github.com/vatesfr/xen-orchestra/pull/5022))
- [@xen-orchestra/openflow] Pack and unpack OpenFlow messages (PR [#5010](https://github.com/vatesfr/xen-orchestra/pull/5010))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- Fix mounting of NFS remote in FreeBSD (PR [#4988](https://github.com/vatesfr/xen-orchestra/issues/4988))
- [Remotes] Fix "remote is disabled" error on getting the remotes info (commit [eb2f429964d7adc264bf678c37e49a856454388e](https://github.com/vatesfr/xen-orchestra/commit/eb2f429964d7adc264bf678c37e49a856454388e))
- Fix default filters not being set in all tables (PR [#4994](https://github.com/vatesfr/xen-orchestra/pull/4994))
- [SDN Controller] Broken encrypted tunnels after host reboot [#4996](https://github.com/vatesfr/xen-orchestra/pull/4996)
- Don't log server's credentials in case of `SESSION_AUTHENTICATION_FAILED` error (PR [#4995](https://github.com/vatesfr/xen-orchestra/pull/4995))
- [Plugin/perf-alert] Fix compatibility of the alert messages with XenCenter (PR [#5004](https://github.com/vatesfr/xen-orchestra/pull/5004))
- [Plugin/backup-reports] Fix `No recipients defined` error when recipients defined at plugin level (PR [#4998](https://github.com/vatesfr/xen-orchestra/pull/4998))
- [Snapshots] Fix reverts sometimes being stuck (PR [#5027](https://github.com/vatesfr/xen-orchestra/pull/5027))

### Released packages

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.
>
> The format is the following: - `$packageName` `$version`
>
> Where `$version` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> In case of conflict, the highest (lowest in previous list) `$version` wins.

- @xen-orchestra/openflow patch
- xo-server-audit minor
- xo-vmdk-to-vhd minor
- xo-server-backup-reports patch
- xo-server-perf-alert patch
- xen-api patch
- xo-server-auth-ldap minor
- xo-server-sdn-controller patch
- xo-server-usage-report minor
- @xen-orchestra/fs patch
- xo-server minor
- xo-web minor
