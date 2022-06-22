> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Backup] Merge delta backups without copying data when using VHD directories on NFS/SMB/local remote(https://github.com/vatesfr/xen-orchestra/pull/6271))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VDI Import] Fix `this._getOrWaitObject is not a function`
- [VM] Attempting to delete a protected VM should display a modal with the error and the ability to bypass it (PR [#6290](https://github.com/vatesfr/xen-orchestra/pull/6290))
- [OVA Import] Fix import stuck after first disk

### Packages to release

> When modifying a package, add it here with its release type.
>
> The format is the following: - `$packageName` `$releaseType`
>
> Where `$releaseType` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> Keep this list alphabetically ordered to avoid merge conflicts

<!--packages-start-->

- @vates/event-listeners-manager patch
- @vates/read-chunk major
- @xen-orchestra/backups minor
- @xen-orchestra/xapi minor
- vhd-lib minor
- xo-remote-parser minor
- xo-server minor
- xo-vmdk-to-vhd patch

<!--packages-end-->
