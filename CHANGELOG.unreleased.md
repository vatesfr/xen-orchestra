> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

[Host/Load-balancer] Add option to disable migration (PR [#5706](https://github.com/vatesfr/xen-orchestra/pull/5706))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup restore] Generate new MAC addresses is disabled by default (PR [#5707](https://github.com/vatesfr/xen-orchestra/pull/5707))
- [Backup] Fix `vm.refresh_snapshots is not a function` error
- [Backup] Fix `cannot read property "length" of undefined` when using _delete first_ [Forum post](https://xcp-ng.org/forum/topic/4440/error-on-delta-backup-cannot-read-property-length-of-undefined)
- [Delta backup] Fix merge task not under corresponding remote and missing merge size in summary [#5708](https://github.com/vatesfr/xen-orchestra/issues/5708)
- [Settings/Logs] Correctly hide `pool.listMissingPatches` and `host.stats` errors

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

- @xen-orchestra/xapi patch
- @xen-orchestra/backups patch
- xo-server-load-balancer minor
- xo-server patch
- xo-web patch
