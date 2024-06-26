> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM] Disks whose name contains the tag `[NOSNAP]` will be ignored when doing a manual snapshot similarly to disks ignored during backups with `[NOBAK]` (possibility to use both tags on the same disk) [Forum#79179](https://xcp-ng.org/forum/post/79179)
- [Plugin/backup-reports] Backup reports sent by email have a new, less rudimentary look (PR [#7747](https://github.com/vatesfr/xen-orchestra/pull/7747))
- [Rolling Pool Update/Reboot] Adds a progress bar to RPU and RPR tasks (PR [#7768](https://github.com/vatesfr/xen-orchestra/pull/7768))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [SDN-Controller] Fix `tlsv1 alert unknown ca` when creating private network (PR [#7755](https://github.com/vatesfr/xen-orchestra/pull/7755))
- [Incremental Replication] Fix _Delete first_ option causing `could not find base VM` error ([PR #7739](https://github.com/vatesfr/xen-orchestra/pull/7739))

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

- @xen-orchestra/backups patch
- @xen-orchestra/xapi major
- xo-server minor
- xo-server-backup-reports minor
- xo-server-sdn-controller patch

<!--packages-end-->
