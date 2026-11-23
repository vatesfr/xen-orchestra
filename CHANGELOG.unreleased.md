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
- [XO6] A VM converted into a template no longer stays in the VM list and treeview, contribution by [@pcbeingused333](https://github.com/pcbeingused333), fixes issue [#10717](https://github.com/vatesfr/xen-orchestra/issues/10717) (PR [#10884](https://github.com/vatesfr/xen-orchestra/pull/10884))

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
- @xen-orchestra/backups patch
- @xen-orchestra/web patch
- @xen-orchestra/web-core patch
- xo-collection patch

<!--packages-end-->
