> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [SR/XOSTOR] Add _State_ column to the _Resource List_ table (PR [#7784](https://github.com/vatesfr/xen-orchestra/pull/7784))
- [REST API] VDIs of a VM, or a VM snapshot, or a VM template, can now be fetched easily by appending `/vdis` at the VM's endpoint
- [REST API] Expose servers at the `/rest/v0/servers` endpoint
- [Backups] Implements Change Block Tracking (CBT) (PR [#7750](https://github.com/vatesfr/xen-orchestra/pull/7750))
- [Backups] Add a toggle to enable purging snapshot data with CBT backups (PR [#7796](https://github.com/vatesfr/xen-orchestra/pull/7796))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Full Backup] Don't keep an unnecessary snapshot (PR [#7805](https://github.com/vatesfr/xen-orchestra/pull/7805))
- [Incremental Replication] Fix error `Cannot destructure property 'other_config' of 'undefined'` (PR [#7805](https://github.com/vatesfr/xen-orchestra/pull/7805))

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

- @xen-orchestra/backups minor
- vhd-lib minor
- xo-server minor
- xo-web minor

<!--packages-end-->
