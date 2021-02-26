> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Backup] During CR/delta backups, bios_strings are restored similarly to DR/full backups

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM/advanced] Fix `an error has occurred` in `Misc` section [#5592](https://github.com/vatesfr/xen-orchestra/issues/5592) (PR [#5604](https://github.com/vatesfr/xen-orchestra/pull/5604))
- [Task] Fix the items-per-page dropdown position (PR [#5584](https://github.com/vatesfr/xen-orchestra/pull/5584))

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

- xo-server minor
- xo-web patch
