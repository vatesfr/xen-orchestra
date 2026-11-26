> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [REST API] Get the state of a proxy appliance updater: `GET /rest/v0/proxies/:id/appliance_updater_state` (PR [#10773](https://github.com/vatesfr/xen-orchestra/pull/10773))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Light theme] Danger backgrounds (selected, hover and active) use the lighter red tints of the design system (PR [#10891](https://github.com/vatesfr/xen-orchestra/pull/10891))
- [Dark mode] Selected, hovered and pressed backgrounds of danger elements (buttons, tags, chips, toasters…) are darker, as designed, so their text is easier to read (PR [#10888](https://github.com/vatesfr/xen-orchestra/pull/10888))
- [Backups/Merge] The background merge no longer crashes with `ENAMETOOLONG` when a VM's backups are locked by another job: it waits 5 minutes before trying again instead of retrying in a loop (PR [#10866](https://github.com/vatesfr/xen-orchestra/pull/10866))
- [V2V] When the import of a disk fails before its transfer starts, the task shows the reason given by the migration engine (e.g. `could not connect: timed out`) instead of `stream has ended without data, was looking for 8 bytes` (PR [#10842](https://github.com/vatesfr/xen-orchestra/pull/10842))
- [XO6] A PIF can no longer be set as the management PIF when its network MTU is not 1500, which XCP-ng does not support on management interfaces (PR [#10905](https://github.com/vatesfr/xen-orchestra/pull/10905))
- [XO6] A VM converted into a template no longer stays in the VM list and treeview, contribution by [@pcbeingused333](https://github.com/pcbeingused333), fixes issue [#10717](https://github.com/vatesfr/xen-orchestra/issues/10717) (PR [#10884](https://github.com/vatesfr/xen-orchestra/pull/10884))
- [VDIs] The used space of a VDI now includes its whole snapshot chain instead of only its last layer, which was almost 0 for disks with snapshots (e.g. after backups). As it can exceed the disk size, it is shown as a size, without usage bar or free space (PR [#10902](https://github.com/vatesfr/xen-orchestra/pull/10902))
- [XO6/Backup jobs] Remove the Target proxy field from the mirror backup job form (PR [#10914](https://github.com/vatesfr/xen-orchestra/pull/10914))
- [xo-server] Fix every pool showing as disconnected after running `xo-server-db` or `xo-server-recover-account`, even though XO was still connected to them (PR [#10834](https://github.com/vatesfr/xen-orchestra/pull/10834))
- [xo-server] Fix a server that could no longer be enabled (`incorrect state`) until xo-server was restarted (PR [#10834](https://github.com/vatesfr/xen-orchestra/pull/10834))

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
- @xen-orchestra/backups patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web patch
- @xen-orchestra/web-core patch
- xen-api minor
- xo-collection patch
- xo-server minor

<!--packages-end-->
