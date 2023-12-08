> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Forget SR] Changed the modal message and added a confirmation text to be sure the action is understood by the user [#7148](https://github.com/vatesfr/xen-orchestra/issues/7148) (PR [#7155](https://github.com/vatesfr/xen-orchestra/pull/7155))
- [REST API] `/backups` has been renamed to `/backup` (redirections are in place for compatibility)
- [REST API] _VM backup & Replication_ jobs have been moved from `/backup/jobs/:id` to `/backup/jobs/vm/:id` (redirections are in place for compatibility)
- [REST API] _XO config & Pool metadata Backup_ jobs are available at `/backup/jobs/metadata`
- [REST API] _Mirror Backup_ jobs are available at `/backup/jobs/metadata`

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [REST API] Returns a proper 404 _Not Found_ error when a job does not exist instead of _Internal Server Error_
- [Host/Smart reboot] Automatically retries up to a minute when `HOST_STILL_BOOTING` [#7194](https://github.com/vatesfr/xen-orchestra/issues/7194) (PR [#7231](https://github.com/vatesfr/xen-orchestra/pull/7231))

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

- @xen-orchestra/xapi patch
- xo-server minor

<!--packages-end-->
