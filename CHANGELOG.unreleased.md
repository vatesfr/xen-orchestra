> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Import/Disk] Fix `JSON.parse` and `createReadableSparseStream is not a function` errors [#6068](https://github.com/vatesfr/xen-orchestra/issues/6068)
- [Backup]  Fix delta backup are almost always full backup instead of differentials [Forum#5256](https://xcp-ng.org/forum/topic/5256/s3-backup-try-it/69) [Forum#5371](https://xcp-ng.org/forum/topic/5371/delta-backup-changes-in-5-66) (PR [#6075](https://github.com/vatesfr/xen-orchestra/pull/6075))

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

- vhd-lib major
- xo-vmdk-to-vhd patch
- @xen-orchestra/backups patch
- @xen-orchestra/proxy patch
- xo-server patch
- xo-web patch
