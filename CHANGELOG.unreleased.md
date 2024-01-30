> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Proxies] Fix `this.getObject` is not a function during deployment
- [Settings/Logs] Fix `sr.getAllUnhealthyVdiChainsLength: not enough permissions` error with non-admin users (PR [#7265](https://github.com/vatesfr/xen-orchestra/pull/7265))
- [Settings/Logs] Fix `proxy.getAll: not enough permissions` error with non-admin users (PR [#7249](https://github.com/vatesfr/xen-orchestra/pull/7249))
- [Replication/Health Check] Fix `healthCheckVm.add_tag is not a function` error [Forum#69156](https://xcp-ng.org/forum/post/69156)
- [Plugin/load-balancer] Prevent unwanted migrations to hosts with low free memory (PR [#7288](https://github.com/vatesfr/xen-orchestra/pull/7288))
- Avoid unnecessary `pool.add_to_other_config: Duplicate key` error in XAPI log [Forum#68761](https://xcp-ng.org/forum/post/68761)
- [Jobs] Reset parameters when editing method to avoid invalid parameters on execution [Forum#69299](https://xcp-ng.org/forum/post/69299)
- [Metadata Backup] Fix `ENOENT` error when restoring an _XO Config_ backup [Forum#68999](https://xcp-ng.org/forum/post/68999)
- [REST API] Fix `/backup/log/<id>` which was broken by the `/backups` to `/backup` renaming [Forum#69426](https://xcp-ng.org/forum/post/69426)
- [Backup/Restore] Fix unnecessary pool selector in XO config backup restore modal [Forum#8130](https://xcp-ng.org/forum/topic/8130/xo-configbackup-restore) (PR [#7287](https://github.com/vatesfr/xen-orchestra/pull/7287))
- [File restore] Fix potential race condition in partition mount/unmount (PR [#7312](https://github.com/vatesfr/xen-orchestra/pull/7312))
- [Modal] Fix opened modal not closing when navigating to another route/URL (PR [#7301](https://github.com/vatesfr/xen-orchestra/pull/7301))
- [Backup/Restore] Don't count memory as a key (i.e. complete) disk [Forum#8212](https://xcp-ng.org/forum/post/69591) (PR [#7315](https://github.com/vatesfr/xen-orchestra/pull/7315))
- [Pool/patches] Disable Rolling Pool Update button if host is alone in its pool [#6415](https://github.com/vatesfr/xen-orchestra/issues/6415) (PR [#7286](https://github.com/vatesfr/xen-orchestra/pull/7286))
- [Import/disk] Couldn't update 'name' field when importing from a URL [#7326](https://github.com/vatesfr/xen-orchestra/issues/7326) (PR [#7332](https://github.com/vatesfr/xen-orchestra/pull/7332))

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

<!--packages-end-->
