> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM/Advanced] Automatically eject removable medias when converting a VM to a template [#6752](https://github.com/vatesfr/xen-orchestra/issues/6752) (PR [#6769](https://github.com/vatesfr/xen-orchestra/pull/6769))
- [Dashboard/Health] Add free space column for storage state table (PR [#6778](https://github.com/vatesfr/xen-orchestra/pull/6778))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Plugins/usage-report] Compute stats on configured period instead of the whole year (PR [#6723](https://github.com/vatesfr/xen-orchestra/pull/6723))
- [Backup] Fix `Invalid parameters` when deleting `speed limit` value (PR [#6768](https://github.com/vatesfr/xen-orchestra/pull/6768))
- [Delta Backup] Restoring a backup with memory must create a suspended VM [#5061](https://github.com/vatesfr/xen-orchestra/issues/5061) (PR [#6774](https://github.com/vatesfr/xen-orchestra/pull/6774))
- [Backup] Show original error instead of `stream has ended without data`
- [Ova import] Fix Ova import error `No user expected grain marker, received [object Object]` [Forum#60648](https://xcp-ng.org/forum/post/60648) (PR [#6779](https://github.com/vatesfr/xen-orchestra/pull/6779))

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

- @vates/diff minor
- @vates/read-chunk patch
- @vates/stream-reader minor
- @vates/task minor
- @xen-orchestra/backups minor
- @xen-orchestra/mixins minor
- vhd-lib minor
- xo-cli minor
- xo-server minor
- xo-server-usage-report patch
- xo-web minor

<!--packages-end-->
