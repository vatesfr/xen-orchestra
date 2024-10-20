> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backups] Fix MESSAGE_METHOD_UNKOWN(VDI.get_cbt_enabled) on XenServer < 7.3 (PR [#8038](https://github.com/vatesfr/xen-orchestra/pull/8038))
- [SR/New] Fix reattach button not displayed for HBA (PR [#7986](https://github.com/vatesfr/xen-orchestra/pull/7986))
- [New VM] Fix cryptic error notification (PR [#8052](https://github.com/vatesfr/xen-orchestra/pull/8052))
- [Netbox] Ignore tags that have an empty label (PR [#8056](https://github.com/vatesfr/xen-orchestra/pull/8056))
- [Tags] Ability to remove blank tags from VMs/hosts/pools (PR [#8058](https://github.com/vatesfr/xen-orchestra/pull/8058))


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
- @xen-orchestra/log minor
- @xen-orchestra/mixin minor
- @xen-orchestra/xapi patch
- xo-cli minor
- xo-server minor
- xo-server-netbox patch
- xo-web patch

<!--packages-end-->
