> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Import/Disk] Fix `JSON.parse` and `createReadableSparseStream is not a function` errors [#6068](https://github.com/vatesfr/xen-orchestra/issues/6068)
- [Backup]  Fix delta backup are almost always full backup instead of differencials [forum1](https://xcp-ng.org/forum/topic/5256/s3-backup-try-it/80) and [forum2](https://xcp-ng.org/forum/topic/5371/delta-backup-changes-in-5-66/24?_=1641289226655)

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
- @xen-orchestra/backups
- @xen-orchestra/backups-cli
- @xen-orchestra/proxy
- xo-server patch
- xo-web patch
