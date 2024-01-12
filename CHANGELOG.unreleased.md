> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Settings/Logs] Use GitHub issue form with pre-filled fields when reporting a bug [#7142](https://github.com/vatesfr/xen-orchestra/issues/7142) (PR [#7274](https://github.com/vatesfr/xen-orchestra/pull/7274))
- [REST API] New pool action: `emergency_shutdown`, it suspends all the VMs and then shuts down all the host [#7277](https://github.com/vatesfr/xen-orchestra/issues/7277) (PR [#7279](https://github.com/vatesfr/xen-orchestra/pull/7279))
- [Tasks] Hide `/rrd_updates` tasks by default
- [Pool/Advanced] Show pool backup/migration network even if they no longer exist (PR [#7303](https://github.com/vatesfr/xen-orchestra/pull/7303))

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
- @xen-orchestra/xapi minor
- xen-api patch
- xo-server minor
- xo-server-load-balancer patch
- xo-web minor

<!--packages-end-->
