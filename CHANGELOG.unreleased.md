> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [REST API] Get the state of a proxy appliance updater: `GET /rest/v0/proxies/:id/appliance_updater_state` (PR [#10773](https://github.com/vatesfr/xen-orchestra/pull/10773))
- [REST API] Upgrade a proxy appliance: \POST /rest/v0/proxies/:id/actions/upgrade` (PR [#](https://github.com/vatesfr/xen-orchestra/pull/))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Backups/Merge] The background merge no longer crashes with `ENAMETOOLONG` when a VM's backups are locked by another job: it waits 5 minutes before trying again instead of retrying in a loop (PR [#10866](https://github.com/vatesfr/xen-orchestra/pull/10866))
- [V2V] When the import of a disk fails before its transfer starts, the task shows the reason given by the migration engine (e.g. `could not connect: timed out`) instead of `stream has ended without data, was looking for 8 bytes` (PR [#10842](https://github.com/vatesfr/xen-orchestra/pull/10842))

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

- @vates/nbd-client patch
- @vates/types minor
- @xen-orchestra/acl minor
- @xen-orchestra/backups patch
- @xen-orchestra/rest-api minor

<!--packages-end-->
