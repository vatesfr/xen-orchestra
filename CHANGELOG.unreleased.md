> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Expose networks, VBDs, VDIs and VIFs
- [Console] Supports host and VM consoles behind HTTP proxies [#6133](https://github.com/vatesfr/xen-orchestra/pull/6133)
- [VM creation] Add link to documentation on secure boot [#6146](https://github.com/vatesfr/xen-orchestra/pull/6146)

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Rolling Pool Update] Don't fail if `load-balancer` plugin is missing (Starter and Enterprise plans)
- [Backup/Restore] Fix missing backups on Backblaze
- [Templates] Fix "incorrect state" error when trying to delete a default template [#6124](https://github.com/vatesfr/xen-orchestra/issues/6124) (PR [#6119](https://github.com/vatesfr/xen-orchestra/pull/6119))

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

- @vates/decorate-with major
- xen-api major
- @xen-orchestra/xapi minor
- @xen-orchestra/fs major
- vhd-cli minor
- @xen-orchestra/backups minor
- @xen-orchestra/proxy minor
- xo-server patch
