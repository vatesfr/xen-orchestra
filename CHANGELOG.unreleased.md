> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Netbox] Check Netbox version before attempting to synchronize (PR [#7735](https://github.com/vatesfr/xen-orchestra/pull/7735))
- [Netbox] Support Netbox 4 (Thanks [@ChrisMcNichol](https://github.com/ChrisMcNichol)!) (PR [#7735](https://github.com/vatesfr/xen-orchestra/pull/7735))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [V2V] Fix VSAN import not used when importing from VSAN ([PR #7717](https://github.com/vatesfr/xen-orchestra/pull/7717))

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

- @vates/fuse-vhd patch
- @xen-orchestra/proxy-cli patch
- @xen-orchestra/vmware-explorer patch
- xo-server-backup-reports major
- xo-server-netbox minor
- xo-web patch

<!--packages-end-->
