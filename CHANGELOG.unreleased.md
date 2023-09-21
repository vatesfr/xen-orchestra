> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Netbox] Don't delete VMs that have been created manually in XO-synced cluster [Forum#7639](https://xcp-ng.org/forum/topic/7639) (PR [#7008](https://github.com/vatesfr/xen-orchestra/pull/7008))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup/Restore] Fix `Cannot read properties of undefined (reading 'id')` error when restoring via an XO Proxy (PR [#7026](https://github.com/vatesfr/xen-orchestra/pull/7026))
- [Google/GitHub Auth] Fix `Internal Server Error` (xo-server: `Cannot read properties of undefined (reading 'id')`) when logging in with Google or GitHub [Forum#7729](https://xcp-ng.org/forum/topic/7729) (PRs [#7031](https://github.com/vatesfr/xen-orchestra/pull/7031) [#7032](https://github.com/vatesfr/xen-orchestra/pull/7032))
- [Jobs] Fix schedules not being displayed on first load [#6968](https://github.com/vatesfr/xen-orchestra/issues/6968) (PR [#7034](https://github.com/vatesfr/xen-orchestra/pull/7034))
- [Backup/Mirror] Fix `xo:fs:local WARN lock compromised` when mirroring a Backup Repository to a local/NFS/SMB repository ([#7043](https://github.com/vatesfr/xen-orchestra/pull/7043))

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
- xo-server patch
- xo-server-auth-github patch
- xo-server-auth-google patch
- xo-server-netbox minor
- xo-web patch

<!--packages-end-->
