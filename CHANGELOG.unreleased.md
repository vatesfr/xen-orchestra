> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Backup/Restore] Backup repositories attached to a proxy now also benefit from the faster, journal-replayed backup listing (PR [#10437](https://github.com/vatesfr/xen-orchestra/pull/10437))
- [REST API] SSE now supports the `backup-archive` collection: backups appearing, being merged or disappearing from a backup repository are pushed to the subscribers, instead of each client listing the repositories again to spot them. XO does not read a repository on its own, so the changes of a repository are pushed as it is listed — a listing by any client is enough — and the archives it already holds arrive as `add` events the first time it is listed after a restart (PR [#10472](https://github.com/vatesfr/xen-orchestra/pull/10472))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [REST API] Keep collection events ordered per object (PR [#10446](https://github.com/vatesfr/xen-orchestra/pull/10446))
- [REST API] Wait for the XAPI objects before making a server connected (PR [#10446](https://github.com/vatesfr/xen-orchestra/pull/10446))
- [REST API] Do not record an server error when a connection attempt is aborted (PR [#10446](https://github.com/vatesfr/xen-orchestra/pull/10446))

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

- @vates/types minor
- @xen-orchestra/backups minor
- @xen-orchestra/proxy minor
- @xen-orchestra/rest-api minor
- xen-api patch
- xo-server minor

<!--packages-end-->
