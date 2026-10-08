> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [REST API] `POST /rest/v0/acl-roles` now supports a `privileges` property, allowing privileges to be directly associated with the newly created role (PR [#10470](https://github.com/vatesfr/xen-orchestra/pull/10470))
- [XO6/Tasks] Add link and object resolution to Tasks Overview panel, better text flow for resolved task names (PR [#10265](https://github.com/vatesfr/xen-orchestra/pull/10265))
- [XO5/Settings/IPs] Show an example of the expected IP format when adding IPs to an IP pool (PR [#10522](https://github.com/vatesfr/xen-orchestra/pull/10522))
- [XO6/BRs] Add backup repository create form (PR [#10271](https://github.com/vatesfr/xen-orchestra/pull/10271))
- [REST API] SSE now supports the `backup-archive` collection: backups appearing, being merged or disappearing from a backup repository are pushed to the subscribers, instead of each client listing the repositories again to spot them. XO does not read a repository on its own, so the changes of a repository are pushed as it is listed — a listing by any client is enough — and the archives it already holds arrive as `add` events the first time it is listed after a restart (PR [#10472](https://github.com/vatesfr/xen-orchestra/pull/10472))
- [Plugins/load balancer] Added VM-to-host affinity to force VMs to run on a given set of hosts if possible (PR [#10207](https://github.com/vatesfr/xen-orchestra/pull/10207))
- [Plugins/load balancer] Improved migration decision making (PR [#10207](https://github.com/vatesfr/xen-orchestra/pull/10207))
- [XO6/New VM] Allow removing existing (template) disks (PR [#10292](https://github.com/vatesfr/xen-orchestra/pull/10292))
- [XO6/Pool] Add validation to the pool connection form (PR [#10484](https://github.com/vatesfr/xen-orchestra/pull/10484))
- [XO6] All objects displayed in the UI are now updated in real time, except backup logs and backup archives which are still refreshed every 30 seconds (PR [#10450](https://github.com/vatesfr/xen-orchestra/pull/10450))
- [REST API] Event subscriptions (`/rest/v0/events`) now support `authentication_token`: each user only receives events about their own tokens (PR [#10450](https://github.com/vatesfr/xen-orchestra/pull/10450))
- [XO6/Side panels] Harmonize card titles across side panels (PR [#10289](https://github.com/vatesfr/xen-orchestra/pull/10289))
- [Host] Add a condition to disable the detached action when the host is not running (PR [#10543](https://github.com/vatesfr/xen-orchestra/pull/10543))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Backups] Fix on distributed incremental replication and deleteFirst incorrectly disabled for non-distributed replication jobs (PR [#10452](https://github.com/vatesfr/xen-orchestra/pull/10452))
- [New/VM] Hide guest tools ISO SR in new VM ISO selector (PR [#10430](https://github.com/vatesfr/xen-orchestra/pull/10430))
- [Host/VM] Fix the confirmation modal staying open and blocking the UI until the action was fully completed (PR [#10417](https://github.com/vatesfr/xen-orchestra/pull/10417))
- [Dashboard] Fix cards staying in error state after a temporary failure to fetch data, until the page was reloaded (PR [#10516](https://github.com/vatesfr/xen-orchestra/pull/10516))
- [backup] Properly detect a disk deleting while merging (PR [#10424](https://github.com/vatesfr/xen-orchestra/pull/10424))
- [backup] Recover a deadlocked merge when the chain is out of retention (PR [#10424](https://github.com/vatesfr/xen-orchestra/pull/10424))
- [Backups] Fix NBD reads failing after a reconnection, when the previous connection is closed late by the host (PR [#10456](https://github.com/vatesfr/xen-orchestra/pull/10456))
- [Plugins/load balancer] Prevent inter-pool migrations triggered by affinity or anti-affinity (PR [#10207](https://github.com/vatesfr/xen-orchestra/pull/10207))
- [REST API] Fix VM creation when destroying an existing VDI (PR [#10292](https://github.com/vatesfr/xen-orchestra/pull/10292))
- [XO6/Pool] Display an error when connecting a pool that is already registered, instead of failing silently (PR [#10484](https://github.com/vatesfr/xen-orchestra/pull/10484))
- [XO6/Backups] VMs with an `xo:no-bak=<reason>` tag are no longer listed as backed up by smart mode jobs (PR [#10450](https://github.com/vatesfr/xen-orchestra/pull/10450))

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
- @xen-orchestra/backup-archive patch
- @xen-orchestra/backups patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server minor
- xo-server-load-balancer minor
- xo-web minor

<!--packages-end-->
