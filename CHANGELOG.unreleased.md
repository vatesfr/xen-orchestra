> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [REST API/VIFs] VIFs can be restricted to a list of VLANs (VLAN filtering, XCP-ng 8.3) (PR [#XXXX](https://github.com/vatesfr/xen-orchestra/pull/XXXX))
- [VM/Network] Changing the MAC address of a VIF keeps the VLANs it is restricted to (PR [#XXXX](https://github.com/vatesfr/xen-orchestra/pull/XXXX))
- [Backup/Restore] Incremental restores and replications keep the VLANs a VIF is restricted to (PR [#XXXX](https://github.com/vatesfr/xen-orchestra/pull/XXXX))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

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

- @vates/types minor
- @xen-orchestra/acl minor
- @xen-orchestra/backups minor
- @xen-orchestra/qa-test minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web patch
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi minor
- xo-server minor
- xo-web minor

<!--packages-end-->
