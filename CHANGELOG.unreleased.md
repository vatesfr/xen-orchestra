> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [XO6/Host] Add possibility to shut down and start an host (PR [#10088](https://github.com/vatesfr/xen-orchestra/pull/10088))
- [REST API] Add `hosts/:id/actions/scan_pifs` endpoint (PR [#10187](https://github.com/vatesfr/xen-orchestra/pull/10187))
- [XO6/Host] Add possibility to scan PIFs directly from the host (PR [#10191](https://github.com/vatesfr/xen-orchestra/pull/10191))
- [REST API/Backup] Add `backup-archives/:id/actions/mountDisk` and `.../unmountDisk` endpoints: attach a disk of a backup to the host running XO as an SR, to read its content without restoring it first. Blocks read from the backup are cached in a disk created on the SR of your choice, so re-reading them is local, and once the whole disk has been read that cache holds a full copy of it. Requires `iscsi.advertisedAddress` to be set to an address of this XO reachable from the hosts (PR [#10018](https://github.com/vatesfr/xen-orchestra/pull/10018))
- [REST API/Backup] Add `backup-archives/:id/actions/mountLiveDisk`, `.../unmountLiveDisk` and `.../hydrateLiveDisk` endpoints: attach a disk of a backup as an SR, to read its content without restoring it first. Passing an `srId` caches blocks read from the backup in a disk created there, so re-reading them is local and writes are accepted; `hydrateLiveDisk` forces the whole disk into that cache upfront instead of waiting for something to read it. Without an `srId` the mount is read-only and needs no local storage, and can then target any host. Requires `iscsi.advertisedAddress` to be set to an address of this XO reachable from the hosts. Each mount gets its own task, visible for as long as the disk stays mounted, with a subtask for each step and a live progress made of the fraction of the disk already cached (PR [#10018](https://github.com/vatesfr/xen-orchestra/pull/10018))

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

- @vates/iscsi major
- @vates/types minor
- @xen-orchestra/acl minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server minor

<!--packages-end-->
