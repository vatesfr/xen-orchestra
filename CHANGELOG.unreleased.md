> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Add `POST /vbds/:id/actions/connect` and `POST /vbds/:id/actions/disconnect` endpoints to hotplug/unplug VBDs from running VMs (PR [#9399](https://github.com/vatesfr/xen-orchestra/pull/9399))
- [REST API] Add `POST /vdis/:id/actions/migrate` endpoint to migrate a VDI to another SR (PR [#9408](https://github.com/vatesfr/xen-orchestra/pull/9408))
- [V2V] Add endpoint to export one disk from Vmware to VHD or QCOW2 `VDI_IO_ERROR` (PR [#9411](https://github.com/vatesfr/xen-orchestra/pull/9411))
- [SIDEPANEL] Remove text ellipsis on sides panel (PR [#9328](https://github.com/vatesfr/xen-orchestra/pull/9238))
- [i18n] Add Finnish, Polish and update Czech, Danish, German, Spanish, Persian, Italian, Japanese, Korean, Norwegian, Dutch, Portuguese (Brasil), Russian, Swedish and Ukrainian translations (PR [#9330](https://github.com/vatesfr/xen-orchestra/pull/9330))
- [Icons] Update icons to use new styles (PR [#8989](https://github.com/vatesfr/xen-orchestra/pull/8989) and PR [#9424](https://github.com/vatesfr/xen-orchestra/pull/9424))
- [VM] Add all actions to manage VM life cycle (PR [9403](https://github.com/vatesfr/xen-orchestra/pull/9403))
- [VM/New] Added VTPM support (PR [#9389](https://github.com/vatesfr/xen-orchestra/pull/9389))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [V2V] Fix `VDI_IO_ERROR` when importing some unaligned disks into a qcow2 storage (PR [#9411](https://github.com/vatesfr/xen-orchestra/pull/9411))
- [New/SR] Fix `Require "-o" along with xe-mount-iso-sr` error during NFS ISO SR creation (PR [#9425](https://github.com/vatesfr/xen-orchestra/pull/9425))

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

- @vates/nbd-client patch
- @vates/types minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- vhd-cli patch
- xo-server minor
- xo-web patch

<!--packages-end-->
