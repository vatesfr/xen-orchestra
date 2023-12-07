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
- [REST API] _Mirror Backup_ jobs are available at `/backup/jobs/mirror`
- [Plugin/auth-saml] Add _Force re-authentication_ setting [Forum#67764](https://xcp-ng.org/forum/post/67764) (PR [#7232](https://github.com/vatesfr/xen-orchestra/pull/7232))
- [HTTP] `http.useForwardedHeaders` setting can be enabled when XO is behind a reverse proxy to fetch clients IP addresses from `X-Forwarded-*` headers [Forum#67625](https://xcp-ng.org/forum/post/67625) (PR [#7233](https://github.com/vatesfr/xen-orchestra/pull/7233))
- [Backup]Use multiple link to speedup NBD backup (PR [#7216](https://github.com/vatesfr/xen-orchestra/pull/7216))

### Bug fixes

- [Backup] Reduce memory consumption when using NBD (PR [#7216](https://github.com/vatesfr/xen-orchestra/pull/7216))

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [REST API] Returns a proper 404 _Not Found_ error when a job does not exist instead of _Internal Server Error_
- [Host/Smart reboot] Automatically retries up to a minute when `HOST_STILL_BOOTING` [#7194](https://github.com/vatesfr/xen-orchestra/issues/7194) (PR [#7231](https://github.com/vatesfr/xen-orchestra/pull/7231))
- [Plugin/transport-slack] Compatibility with other services like Mattermost or Discord [#7130](https://github.com/vatesfr/xen-orchestra/issues/7130) (PR [#7220](https://github.com/vatesfr/xen-orchestra/pull/7220))
- [Host/Network] Fix error "PIF_IS_PHYSICAL" when trying to remove a PIF that had already been physically disconnected [#7193](https://github.com/vatesfr/xen-orchestra/issues/7193) (PR [#7221](https://github.com/vatesfr/xen-orchestra/pull/7221))

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

- @vates/nbd-client minor
- @xen-orchestra/xapi minor
- vhd-lib patch
- xo-server minor
- xo-server-auth-saml minor
- xo-server-transport-email major
- xo-server-transport-slack patch

<!--packages-end-->
