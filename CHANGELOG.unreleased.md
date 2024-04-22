> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [i18n] Japanese translation (PR [#7582](https://github.com/vatesfr/xen-orchestra/pull/7582))
- [REST API] [Watch mode for the tasks collection](./packages/xo-server/docs/rest-api.md#all-tasks) (PR [#7565](https://github.com/vatesfr/xen-orchestra/pull/7565))
- [Home/SR] Display _Pro Support_ status for XOSTOR SR (PR [#7601](https://github.com/vatesfr/xen-orchestra/pull/7601))
- [Host/Advanced] Ability to `enable/disable` passthrough for PCIs [#7432](https://github.com/vatesfr/xen-orchestra/issues/7432) (PR [#7455](https://github.com/vatesfr/xen-orchestra/pull/7455))
- [VM/Advanced] Ability to `attach/detach` PCIs to a VM [#7432](https://github.com/vatesfr/xen-orchestra/issues/7432) (PR [#7464](https://github.com/vatesfr/xen-orchestra/pull/7464))
- [XOSTOR] XOSTOR is no longer in BETA
- [VM] At VM creation, warn if secure boot is on but pool is not setup for UEFI Secure Boot [#7500](https://github.com/vatesfr/xen-orchestra/issues/7500) (PR [#7562](https://github.com/vatesfr/xen-orchestra/pull/7562))
- [Rolling Pool Update & Reboot] Rolling pool update and rolling pool reboot now use XO tasks (PR [#7578](https://github.com/vatesfr/xen-orchestra/pull/7578))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- Fix support of XenServer 6.5 (broken in XO 5.93.0)
- [VMWare/Import] Fix `Cannot create property 'xxx' on string 'yyy' when trying to import from ESXi
- [Import/VMWare] Fix ERR_PREMATURE_CLOSE error with Xenserver hosts (PR [#7563](https://github.com/vatesfr/xen-orchestra/pull/7563))
- [VMWare/Migration] Handle multiple datacenters (PR [#7553](https://github.com/vatesfr/xen-orchestra/pull/7553))
- [XOSTOR/create] In the summary section, the warning message "Hosts do not have the same number of disks" now takes into consideration host without disks (PR [#7572](https://github.com/vatesfr/xen-orchestra/pull/7572))
- [XOSTOR] Install or update packages on all hosts in the pool rather than just hosts with disks (PR [#7597](https://github.com/vatesfr/xen-orchestra/pull/7597))
- [XOSTOR] Fix `LVM_ERROR(5)` during XOSTOR creation (PR [#7598](https://github.com/vatesfr/xen-orchestra/pull/7598))
- [Pool/Advanced] Fix `an error has occurred` when no default SR is set on the pool (PR [#7616](https://github.com/vatesfr/xen-orchestra/pull/7616))

### Packages to release

> When modifying a package, add it here with its release type.
>
> The format is the following: `- $packageName $releaseType`
>
> Where `$releaseType` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> Keep this list alphabetically ordered to avoid merge conflicts

<!--packages-start-->

- @vates/xml major
- @vates/xml-rpc major
- @xen-orchestra/mixins minor
- @xen-orchestra/vmware-explorer patch
- xen-api patch
- xo-cli patch
- xo-server minor
- xo-web minor

<!--packages-end-->
