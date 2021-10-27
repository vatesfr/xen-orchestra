> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Tasks] Filter out short tasks using a default filter (PR [#5921](https://github.com/vatesfr/xen-orchestra/pull/5921))
- [Jobs] Ability to copy a job ID (PR [#5951](https://github.com/vatesfr/xen-orchestra/pull/5951))
- [Host/advanced] Add button to enable/disable the host (PR [#5952](https://github.com/vatesfr/xen-orchestra/pull/5952))
- [VM/export] Ability to copy the export URL (PR [#5948](https://github.com/vatesfr/xen-orchestra/pull/5948))
- [Servers] Ability to use an HTTP proxy between XO and a server
- [Menu] Notify user when proxies need to be upgraded (PR [#5930](https://github.com/vatesfr/xen-orchestra/pull/5930))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backups] Delete unused snapshots related to other schedules (even no longer existing) (PR [#5949](https://github.com/vatesfr/xen-orchestra/pull/5949))
- [Jobs] Fix `job.runSequence` method (PR [#5944](https://github.com/vatesfr/xen-orchestra/pull/5944))
- [Netbox] Fix error when testing plugin on versions older than 2.10 (PR [#5963](https://github.com/vatesfr/xen-orchestra/pull/5963))
- [Snapshot] Fix "Create VM from snapshot" creating a template instead of a VM (PR [#5955](https://github.com/vatesfr/xen-orchestra/pull/5955))
- [Host/Logs] Improve the display of log content (PR [#5943](https://github.com/vatesfr/xen-orchestra/pull/5943))
- [XOA licenses] Fix expiration date displaying "Invalid date" in some rare cases (PR [#5967](https://github.com/vatesfr/xen-orchestra/pull/5967))

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

- xo-server-netbox patch
- vhd-lib minor
- xen-api minor
- @xen-orchestra/backup minor
- @xen-orchestra/proxy minor
- vhd-cli minor
- xapi-explore-sr minor
- xo-server patch
- xo-web minor
