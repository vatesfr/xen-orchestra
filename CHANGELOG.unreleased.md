> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [XO6/Host] Add possibility to shut down and start an host (PR [#10088](https://github.com/vatesfr/xen-orchestra/pull/10088))
- [REST API] Add `hosts/:id/actions/scan_pifs` endpoint (PR [#10187](https://github.com/vatesfr/xen-orchestra/pull/10187))
- [XO6/Host] Add possibility to scan PIFs directly from the host (PR [#10191](https://github.com/vatesfr/xen-orchestra/pull/10191))
- [REST API] Add an endpoint to reclaim space per vm or backup repository: `POST /rest/V0/backup-repositories/:id/actions/reclaim-space` (PR [#10262](https://github.com/vatesfr/xen-orchestra/pull/10262))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Backup/File restore] Downloading files as `tgz` through an XO Proxy works again: the archive was replaced by an invalid response, failing with `invalid identifier: undefined instead of number or string` (PR [#10208](https://github.com/vatesfr/xen-orchestra/pull/10208))
- [Immutable backups] Backups are protected again on file servers whose system language is not English: immutability was silently not applied at all on those (PR [#10182](https://github.com/vatesfr/xen-orchestra/pull/10182))
- [Immutable backups] Release disks that stayed immutable forever after their metadata was deleted by the retention, or after a merge renamed them, which prevented any further merge or deletion of that disk's backups (PR [#10182](https://github.com/vatesfr/xen-orchestra/pull/10182))
- [Plugins/load balancer] No longer try to migrate VMs to disabled host (PR [#10209](https://github.com/vatesfr/xen-orchestra/pull/10209))
- [V2V] Improve performance on big VM (>3 To) imports by improving Nbd disk handling (PR [#10157](https://github.com/vatesfr/xen-orchestra/pull/10157))
- [Import/VMware] Fix migration of a VM having 10 snapshots or more, or a snapshot with 10 disks or more: the extra snapshots and disks were silently ignored
- [Import/VMware] Fix migration of a running VM with "Stop the source VM" enabled and no pre-existing snapshot: the data written since the snapshot taken by XO was not transferred, and the second transfer reported `Nothing to import in this chain`

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
- @xen-orchestra/acl minor
- @xen-orchestra/backups patch
- @xen-orchestra/immutable-backups patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/vmware-explorer minor
- @xen-orchestra/web minor
- xo-server minor
- xo-server-load-balancer patch

<!--packages-end-->
