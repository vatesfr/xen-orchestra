> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Tasks] Filter out short tasks using a default filter (PR [#5921](https://github.com/vatesfr/xen-orchestra/pull/5921))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backups] Delete unused snapshots related to other schedules (even no longer existing) (PR [#5949](https://github.com/vatesfr/xen-orchestra/pull/5949))
- [Jobs] Fix `job.runSequence` method (PR [#5944](https://github.com/vatesfr/xen-orchestra/pull/5944))

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

- @xen-orchestra/backup minor
- @xen-orchestra/proxy minor
- xo-server patch
- xo-web minor
