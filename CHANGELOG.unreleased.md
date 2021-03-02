> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM/Snapshot export] Fix `Error: no available place in queue` on canceling an export via browser then starting a new one when the concurrency threshold is reached [#5535](https://github.com/vatesfr/xen-orchestra/issues/5535) (PR [#5538](https://github.com/vatesfr/xen-orchestra/pull/5538))
- [Servers] Hide pool's objects if its master is unreachable [#5475](https://github.com/vatesfr/xen-orchestra/issues/5475) (PR [#5526](https://github.com/vatesfr/xen-orchestra/pull/5526))
- [Host] Restart toolstack: fix `ECONNREFUSED` error (PR [#5553](https://github.com/vatesfr/xen-orchestra/pull/5553))
- [VM migration] Intra-pool: don't automatically select migration network if no default migration network is defined on the pool (PR [#5564](https://github.com/vatesfr/xen-orchestra/pull/5564))
- [New SR] Fix `lun.LUNid.trim is not a function` error [#5497](https://github.com/vatesfr/xen-orchestra/issues/5497) (PR [#5581](https://github.com/vatesfr/xen-orchestra/pull/5581))
- [Home/vm] Bulk intra pool migration: fix VM VDIs on a shared SR wrongly migrated to the default SR (PR [#3987](https://github.com/vatesfr/xen-orchestra/pull/3987))
- [Select] Display the option on multiple lines if needed (PR [#5580](https://github.com/vatesfr/xen-orchestra/pull/5580))
- [Backup] fix `resource temporarily unavailable` error (PR [#5612](https://github.com/vatesfr/xen-orchestra/pull/5612))

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

- @xen-orchestra/async-map minor
- xo-server minor
