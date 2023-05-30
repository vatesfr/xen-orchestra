> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Tasks] New type of tasks created by XO ("XO Tasks" section) (PRs [#6861](https://github.com/vatesfr/xen-orchestra/pull/6861) [#6869](https://github.com/vatesfr/xen-orchestra/pull/6869))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Incremental Replication] Fix task showing as _interrupted_ when running without health check [Forum#62669](https://xcp-ng.org/forum/post/62669) (PR [#6866](https://github.com/vatesfr/xen-orchestra/pull/6866))
- [Host evacuation] Better error message when migration network no longer exists

### Packages to release

> When modifying a package, add it here with its release type.
>
> The format is the following: `- $packageName $releaseType`
>
> Where `$releaseType` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> Keep this list alphabetically ordered to avoid merge conflicts

<!--packages-start-->

- @xen-orchestra/backups minor
- vhd-lib minor
- xo-server minor
- xo-web minor

<!--packages-end-->
