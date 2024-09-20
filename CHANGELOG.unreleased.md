> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [SR/Disks] Display information if the VDI is an empty metadata snapshot (PR [#7970](https://github.com/vatesfr/xen-orchestra/pull/7970))
- [Netbox] Do not synchronize if detected minor version is not supported (PR [#7992](https://github.com/vatesfr/xen-orchestra/pull/7992))
- **XO 6**:
  - [Dashboard] Display backup issues data (PR [#7974](https://github.com/vatesfr/xen-orchestra/pull/7974))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Hub/Recipes/Kubernetes] Properly sort versions in selector
- [Host/Network] Fix `an error has occurred` briefly displaying in 'Mode' column of the host's Network tab (PR [#7954](https://github.com/vatesfr/xen-orchestra/pull/7954))

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

- @xen-orchestra/lite minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server-netbox minor
- xo-web minor

<!--packages-end-->
