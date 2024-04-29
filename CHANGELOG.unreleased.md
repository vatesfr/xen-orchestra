> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [i18n] Japanese translation (PR [#7582](https://github.com/vatesfr/xen-orchestra/pull/7582))
- [REST API] [Watch mode for the tasks collection](./packages/xo-server/docs/rest-api.md#all-tasks) (PR [#7565](https://github.com/vatesfr/xen-orchestra/pull/7565))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- Fix support of XenServer 6.5 (broken in XO 5.93.0)
- [VMWare/Import] Fix `Cannot create property 'xxx' on string 'yyy' when trying to import from ESXi
- [Import/VMWare] Fix ERR_PREMATURE_CLOSE error with Xenserver hosts (PR [#7563](https://github.com/vatesfr/xen-orchestra/pull/7563))
- [XOSTOR] Install or update packages on all hosts in the pool rather than just hosts with disks (PR [#7597](https://github.com/vatesfr/xen-orchestra/pull/7597))

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
- @xen-orchestra/vmware patch
- xen-api patch
- xo-cli patch
- xo-server minor
- xo-web minor

<!--packages-end-->
