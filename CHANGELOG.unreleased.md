> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Delta Backup Restoration] Fix assertion error [Forum #5257](https://xcp-ng.org/forum/topic/5257/problems-building-from-source/16)
- [Delta Backup Restoration] `TypeError: this disposable has already been disposed` [Forum #5257](https://xcp-ng.org/forum/topic/5257/problems-building-from-source/20)
- [Tables/actions] Fix collapsed actions being clickable despite being disabled (PR [#6023](https://github.com/vatesfr/xen-orchestra/pull/6023))
- [Backups] Fix: `Error: Chaining alias is forbidden xo-vm-backups/..alias.vhd to xo-vm-backups/....alias.vhd` when backuping a file to s3 [Forum #5226](https://xcp-ng.org/forum/topic/5256/s3-backup-try-it)
- [Delta Backup Restoration] `VDI_IO_ERROR(Device I/O errors)` [Forum #5727](https://xcp-ng.org/forum/topic/5257/problems-building-from-source/4) (PR [#6031](https://github.com/vatesfr/xen-orchestra/pull/6031))
- [Delta Backup] Fix `Cannot read property 'uuid' of undefined` when a VDI has been removed from a backed up VM (PR [#6034](https://github.com/vatesfr/xen-orchestra/pull/6034))

### Packages to release

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.
>
> The format is the following: - `$packageName` `$version`
>
> Where `$version` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> In case of conflict, the highest (lowest in previous list) `$version` wins.

- @xen-orchestra/proxy patch
- xo-server patch
- xo-web patch
