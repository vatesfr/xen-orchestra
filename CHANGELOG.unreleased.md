> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM migration] Ability to choose network for migration within a pool [#2028](https://github.com/vatesfr/xen-orchestra/issues/2028) (PR [#4828](https://github.com/vatesfr/xen-orchestra/pull/4828))
- [Support] Link to create a new support ticket [#4234](https://github.com/vatesfr/xen-orchestra/issues/4234) (PR [#4833](https://github.com/vatesfr/xen-orchestra/pull/4833))
- [Proxies] Ability to redeploy a proxy VM [#4825](https://github.com/vatesfr/xen-orchestra/issues/4825) (PR [#4725](https://github.com/vatesfr/xen-orchestra/pull/4725))
- [SR / Disks] Ability to migrate VDIs [#4455](https://github.com/vatesfr/xen-orchestra/issues/4455) (PR [#4696](https://github.com/vatesfr/xen-orchestra/pull/4696))
- [Proxy / Deploy] Ability to select the destination network [#4825](https://github.com/vatesfr/xen-orchestra/issues/4825) (PR [#4855](https://github.com/vatesfr/xen-orchestra/pull/4855))
- [Proxies/Deploy] Remove SRs not connected to an HVM-capable host from selection [#4825](https://github.com/vatesfr/xen-orchestra/issues/4825) (PR [#4849](https://github.com/vatesfr/xen-orchestra/pull/4849))
- [Audit] Ability to export records [#4798](https://github.com/vatesfr/xen-orchestra/issues/4798) (PR [#4858](https://github.com/vatesfr/xen-orchestra/pull/4858))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [XOSAN] Fix the installer (PR [#4839](https://github.com/vatesfr/xen-orchestra/pull/4839))
- [OVA Import] Fix _no host available_ error when starting for imported VMs with low memory (PR [#4866](https://github.com/vatesfr/xen-orchestra/pull/4866))
- [Self] When a Self Service related operation fails, always revert the quotas to what they were before the operation (PR [#4861](https://github.com/vatesfr/xen-orchestra/pull/4861))
- [auth-{github,google,saml}] Don't require manually reloading the plugin for configuration changes to take effect [#4863](https://github.com/vatesfr/xen-orchestra/issues/4863) (PR [#4864](https://github.com/vatesfr/xen-orchestra/pull/4864))
- [auth-ldap] Fix reading certificate authorities files [#3873](https://github.com/vatesfr/xen-orchestra/issues/3873)
- [Backup NG / logs] Replace successful backup job status by failed status in case of missing VMs [#4857](https://github.com/vatesfr/xen-orchestra/issues/4857) (PR [#4862](https://github.com/vatesfr/xen-orchestra/pull/4862))
- [Jobs] Fix "no value for `user_ip`" error on jobs execution (PR [#4878](https://github.com/vatesfr/xen-orchestra/pull/4878))
- [Self] Properly take IP pools into account when computing quotas (PR [#4871](https://github.com/vatesfr/xen-orchestra/pull/4871))

### Released packages

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.

- xo-server-audit minor
- xo-server-auth-github patch
- xo-server-auth-google patch
- xo-server-auth-ldap patch
- xo-server-auth-saml patch
- xo-server minor
- xo-web minor
