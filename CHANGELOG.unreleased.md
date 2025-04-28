> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **XO6**:
  - [Host/Header] Add master host icon on host header (PR [#8512](https://github.com/vatesfr/xen-orchestra/pull/8512))
- Hub recipe
  - Upgrade Pyrgos/Kubernetes recipe to use MicroK8s
  - `/rest/v0/users` (PR [#8494](https://github.com/vatesfr/xen-orchestra/pull/8494))
  - `/rest/v0/users/<user-id>` (PR [#8494](https://github.com/vatesfr/xen-orchestra/pull/8494))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

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

- @vates/node-vsphere-soap patch
- @xen-orchestra/immutable-backups patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/vmware-explorer patch
- @xen-orchestra/web minor
- xo-server patch
- xo-vmdk-to-vhd patch

<!--packages-end-->
