> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM/Network] Fix TX checksumming [#5234](https://github.com/vatesfr/xen-orchestra/issues/5234)
- [Dashboard/Health] Fix snapshots linked to existent VMs considered as orphans [#5243](https://github.com/vatesfr/xen-orchestra/issues/5243) (PR [#5244](https://github.com/vatesfr/xen-orchestra/pull/5244))

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

- xo-web patch
- xo-server patch
