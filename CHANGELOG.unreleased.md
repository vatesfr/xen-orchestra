> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Ability to generate an authentication token via `POST /rest/v0/users/authentication_tokens` (using Basic Authentication) (PR [#8065](https://github.com/vatesfr/xen-orchestra/pull/8065))
- [Home/VMs] Ability to filter by MAC address (don't forget quotes: `"70:1A:83:62:90:D0"`)
- [Settings/ACLs] Ability to filter objects by tags (PR [#24820](https://help.vates.tech/#ticket/zoom/24820))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

-[Backup/Mirror] Fix `checkbasevdi must be called before updateUuidAndChain` error (PR [#8037](https://github.com/vatesfr/xen-orchestra/pull/8037))

- [Backups] Fix MESSAGE_METHOD_UNKOWN(VDI.get_cbt_enabled) on XenServer < 7.3 (PR [#8038](https://github.com/vatesfr/xen-orchestra/pull/8038))
- [SR/New] Fix reattach button not displayed for HBA (PR [#7986](https://github.com/vatesfr/xen-orchestra/pull/7986))
- [New VM] Fix cryptic error notification (PR [#8052](https://github.com/vatesfr/xen-orchestra/pull/8052))
- [Netbox] Ignore tags that have an empty label (PR [#8056](https://github.com/vatesfr/xen-orchestra/pull/8056))
- [Tags] Ability to remove blank tags from VMs/hosts/pools (PR [#8058](https://github.com/vatesfr/xen-orchestra/pull/8058))
- [Plugin/audit] Do not log call to `host.isPubKeyTooShort` [Forum#84464](https://xcp-ng.org/forum/post/84464)
- [Backup] fix VDI_INCOMPATIBLE_TYPE error (PR [#8043](https://github.com/vatesfr/xen-orchestra/pull/8043))
- [Backups] Fix handling of alias without vhd in cleanVm (PR [#8053](https://github.com/vatesfr/xen-orchestra/pull/8053))
- [Backup] keep only one snapshot for all the schedules when snapshot retention is zero (PR [#8051](https://github.com/vatesfr/xen-orchestra/pull/8051))

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

- @vates/task minor
- @xen-orchestra/backups patch
- @xen-orchestra/fs minor
- @xen-orchestra/log minor
- @xen-orchestra/mixin minor
- @xen-orchestra/xapi patch
- xo-cli minor
- xo-server minor
- xo-server-audit patch
- xo-server-netbox patch
- xo-server-test patch
- xo-web minor

<!--packages-end-->
