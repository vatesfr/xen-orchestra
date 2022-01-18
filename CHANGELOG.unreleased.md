> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Dashboard/Health] Fix `error has occured` when a pool has no default SR
- [Plugin/Audit] Fix `key cannot be 'null' or 'undefined'` error when no audit log in the database [#6040](https://github.com/vatesfr/xen-orchestra/issues/6040) (PR [#6071](https://github.com/vatesfr/xen-orchestra/pull/6071))

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
- xo-web patch
- xo-server-audit patch
