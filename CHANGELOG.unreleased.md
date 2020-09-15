> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM Import] Make the `Description` field optional (PR [#5258](https://github.com/vatesfr/xen-orchestra/pull/5258))
- [New VM] Hide missing ISOs in selector [#5222](https://github.com/vatesfr/xen-orchestra/issues/5222)
- [Dashboard/Health] Show VMs that have too many snapshots [#5238](https://github.com/vatesfr/xen-orchestra/pull/5238)
- [Backup/overview] Link backup jobs/schedules to their corresponding logs [#4564](https://github.com/vatesfr/xen-orchestra/issues/4564) (PR [#5260](https://github.com/vatesfr/xen-orchestra/pull/5260))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

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

- xo-web minor
