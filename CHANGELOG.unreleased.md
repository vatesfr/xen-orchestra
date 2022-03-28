> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Expose networks, VBDs, VDIs and VIFs
- [Console] Supports host and VM consoles behind HTTP proxies [#6133](https://github.com/vatesfr/xen-orchestra/pull/6133)
- [Install patches] Disable patch installation when `High Availability` is enabled (PR [#6145](https://github.com/vatesfr/xen-orchestra/pull/6145))
- [Delta Backup/Restore] Ability to ignore some VDIs (PR [#6143](https://github.com/vatesfr/xen-orchestra/pull/6143))
- [Rolling Pool Update] Don't update if some of the hosts are not running

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Rolling Pool Update] Don't fail if `load-balancer` plugin is missing (Starter and Enterprise plans)
- [Backup/Restore] Fix missing backups on Backblaze
- [Templates] Fix "incorrect state" error when trying to delete a default template [#6124](https://github.com/vatesfr/xen-orchestra/issues/6124) (PR [#6119](https://github.com/vatesfr/xen-orchestra/pull/6119))
- [New SR] Fix "SR_BACKEND_FAILURE_103" error when selecting "No selected value" for the path [#5991](https://github.com/vatesfr/xen-orchestra/issues/5991) (PR [#6137](https://github.com/vatesfr/xen-orchestra/pull/6137))

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
- xo-server minor
- xo-web minor
