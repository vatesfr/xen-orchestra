> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [About] Show commit instead of version numbers for source users (PR [#6045](https://github.com/vatesfr/xen-orchestra/pull/6045))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Tables/actions] Fix collapsed actions being clickable despite being disabled (PR [#6023](https://github.com/vatesfr/xen-orchestra/pull/6023))
- [Backup] Fix `handler.rmTree` is not a function (Forum [5256](https://xcp-ng.org/forum/topic/5256/s3-backup-try-it/29) PR [#6041](https://github.com/vatesfr/xen-orchestra/pull/6041) )

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

- @xen-orchestra/fs patch
- vhd-lib patch
- @xen-orchestra/backups patch
- xo-server patch
- @xen-orchestra/proxy patch
- xo-web patch
