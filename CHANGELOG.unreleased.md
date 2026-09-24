> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

<<<<<<< HEAD
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
- [REST API/Backup repositories] Free, used and total space are now available on backup repositories (PR [#10406](https://github.com/vatesfr/xen-orchestra/pull/10406))
||||||| parent of 7b4991d829 (correct changelog entry)
- [XO6/Vm] Add the VM name to VM related actions that open a modal (PR [#10310](https://github.com/vatesfr/xen-orchestra/pull/10310))
- [XO6] Allow changing which PIF a host uses for its management interface, without deleting and recreating the network config (PR [#10110](https://github.com/vatesfr/xen-orchestra/pull/10110))
- [Backups] change the prefix name of vms during health checks from 'Importing...' to 'Health Check' to avoid confusion (PR [#10361](https://github.com/vatesfr/xen-orchestra/pull/10361))
- [XO6/SR] Add dedicated Storage Repository page hosts sidepanel (PR [#10140](https://github.com/vatesfr/xen-orchestra/pull/10140))
- [Backup/Restore] Faster listing of the backups: a backup repository is now listed once, then kept up to date by replaying its journal instead of being listed again. Especially visible on S3 repositories with Object Lock, where nothing could be cached before (PR [#10257](https://github.com/vatesfr/xen-orchestra/pull/10257))
- [Rolling pool update/reboot] A pool can now skip the phase which brings the VMs back to the host they were running on, which halves the migrations of the run (PR [#10295](https://github.com/vatesfr/xen-orchestra/pull/10295))
- [XO5/Backups] Open the backup job edition form in the same tab when editing a backup job from the VM page (PR [#10342](https://github.com/vatesfr/xen-orchestra/pull/10342))
- [Web-Core/TabItem] Update the component to remove uppercase for better readability (PR [#10338](https://github.com/vatesfr/xen-orchestra/pull/10338))
- [REST API] VDI can now be exported in qcow2 format, and the VHD export uses NBD when available. Both formats work whatever the format the disk is stored in. Every export format, raw included, now provides the size of the download (PR [#10350](https://github.com/vatesfr/xen-orchestra/pull/10350))
- [REST API] SSE now supports Non XAPI objects (user, group, acl-privilege, acl-role, proxy, server, backup-repository, backup-job, schedule) (PR [#10278](https://github.com/vatesfr/xen-orchestra/pull/10278))
- [REST API/SDN Controller, Audit] Traffic rule and audit record routes are now documented in the Swagger/OpenAPI spec (PR [#9895](https://github.com/vatesfr/xen-orchestra/pull/9895))
- [LDAP] Release plugin for LDAP multidomain management (PR [#10015](https://github.com/vatesfr/xen-orchestra/pull/10015))
- [RPU] Keep track of an interrupted rolling pool update across xo-server restarts: the pool's Patches tab now shows which hosts were updated, the last error, and the VMs that were shut down for the update and not started again (PR [#10331](https://github.com/vatesfr/xen-orchestra/pull/10331))
- [i18n] Add Turkish and update Czech, Dutch, Slovak and Swedish translations (PR [#10316](https://github.com/vatesfr/xen-orchestra/pull/10316))
- [REST API/Backup repositories] Free, used and total space are now available on backup repositories (PR [#10406](https://github.com/vatesfr/xen-orchestra/pull/10406))
- [XO6/Host] Add icon for disabled host (PR [#10188](https://github.com/vatesfr/xen-orchestra/pull/10188))
- [V2V] When a VM has Changed Block Tracking enabled on the source host, a migration now asks the host which blocks it has to read — the blocks a disk uses for a full transfer, the blocks written since the previous pass for a delta — instead of scanning the disk through the VDDK. Faster to start on large disks, and one less moving part. VMs without CBT are migrated exactly as before (PR [#10384](https://github.com/vatesfr/xen-orchestra/pull/10384))
- [Proxy] Check proxy licenses at XOA level instead of blocking backups on it (PR [#10280](https://github.com/vatesfr/xen-orchestra/pull/10280))
- [RPU] A rolling pool update is now refused while a previous one is still in progress or was left incomplete, and asks for confirmation when the master is already up to date but other hosts are not (PR [#10394](https://github.com/vatesfr/xen-orchestra/pull/10394))
- [RPU] An incomplete rolling pool update can now be closed from the pool's Patches tab, or with `pool.finalizeRollingUpdate` and the REST route `POST /rest/v0/pools/{id}/actions/finalize_rolling_update`. The closing is refused while the update left something it had changed unrestored (HA, WLB, load balancer, backup schedules, disabled hosts, displaced or halted VMs); forcing it lists the abandoned items in the task and changes nothing in the pool (PR [#10418](https://github.com/vatesfr/xen-orchestra/pull/10418))
- [REST API/Backup] Add `POST backup-archives/:id/actions/mount_live_disk` and `POST backup-archives/:id/live_disks/:liveDiskId/actions/unmount` endpoints (administrators only): attach a disk of a backup to a host as a read-only SR, to read its content without restoring it. This XO's address reachable from the hosts is auto-detected, or can be set explicitly with `iscsi.advertisedAddress`
- [Backup/Restore] Choose what to do with each disk when restoring an incremental backup: restore it to an SR, live mount it read-only on a host so it is usable immediately without being copied, or not restore it at all (PR [#10345](https://github.com/vatesfr/xen-orchestra/pull/10345))
- [XO6/Host] Add possibility to shut down and start an host (PR [#10088](https://github.com/vatesfr/xen-orchestra/pull/10088))
- [REST API] Add `hosts/:id/actions/scan_pifs` endpoint (PR [#10187](https://github.com/vatesfr/xen-orchestra/pull/10187))
- [XO6/Host] Add possibility to scan PIFs directly from the host (PR [#10191](https://github.com/vatesfr/xen-orchestra/pull/10191))
- [Docs] Improve doc, rename titles, and refactor menu (PR [#10212](https://github.com/vatesfr/xen-orchestra/pull/10212))
- [XO6/Host] Add possibility to forget a host (PR [#10089](https://github.com/vatesfr/xen-orchestra/pull/10089))

- [IPMI-plugin] Add GET plugins/ipmi-sensors/hosts/{id}/ipmi to get IPMI sensors (PR [#10003](https://github.com/vatesfr/xen-orchestra/pull/10003))
- [VIF] Add VIF name in header on VIF detail page (PR [#10252](https://github.com/vatesfr/xen-orchestra/pull/10252))
- [REST API] Add an endpoint to reclaim space per vm or backup repository: `POST /rest/V0/backup-repositories/:id/actions/reclaim-space` (PR [#10262](https://github.com/vatesfr/xen-orchestra/pull/10262))
- [XO6/Host] Sort the networks table by network name (PR [#10367](https://github.com/vatesfr/xen-orchestra/pull/10367))
=======
- [XO6/Vm] Add the VM name to VM related actions that open a modal (PR [#10310](https://github.com/vatesfr/xen-orchestra/pull/10310))
- [XO6] Allow changing which PIF a host uses for its management interface, without deleting and recreating the network config (PR [#10110](https://github.com/vatesfr/xen-orchestra/pull/10110))
- [Backups] change the prefix name of vms during health checks from 'Importing...' to 'Health Check' to avoid confusion (PR [#10361](https://github.com/vatesfr/xen-orchestra/pull/10361))
- [XO6/SR] Add dedicated Storage Repository page hosts sidepanel (PR [#10140](https://github.com/vatesfr/xen-orchestra/pull/10140))
- [Backup/Restore] Faster listing of the backups: a backup repository is now listed once, then kept up to date by replaying its journal instead of being listed again. Especially visible on S3 repositories with Object Lock, where nothing could be cached before (PR [#10257](https://github.com/vatesfr/xen-orchestra/pull/10257))
- [Rolling pool update/reboot] A pool can now skip the phase which brings the VMs back to the host they were running on, which halves the migrations of the run (PR [#10295](https://github.com/vatesfr/xen-orchestra/pull/10295))
- [XO5/Backups] Open the backup job edition form in the same tab when editing a backup job from the VM page (PR [#10342](https://github.com/vatesfr/xen-orchestra/pull/10342))
- [Web-Core/TabItem] Update the component to remove uppercase for better readability (PR [#10338](https://github.com/vatesfr/xen-orchestra/pull/10338))
- [REST API] VDI can now be exported in qcow2 format, and the VHD export uses NBD when available. Both formats work whatever the format the disk is stored in. Every export format, raw included, now provides the size of the download (PR [#10350](https://github.com/vatesfr/xen-orchestra/pull/10350))
- [REST API] SSE now supports Non XAPI objects (user, group, acl-privilege, acl-role, proxy, server, backup-repository, backup-job, schedule) (PR [#10278](https://github.com/vatesfr/xen-orchestra/pull/10278))
- [REST API/SDN Controller, Audit] Traffic rule and audit record routes are now documented in the Swagger/OpenAPI spec (PR [#9895](https://github.com/vatesfr/xen-orchestra/pull/9895))
- [LDAP] Release plugin for LDAP multidomain management (PR [#10015](https://github.com/vatesfr/xen-orchestra/pull/10015))
- [RPU] Keep track of an interrupted rolling pool update across xo-server restarts: the pool's Patches tab now shows which hosts were updated, the last error, and the VMs that were shut down for the update and not started again (PR [#10331](https://github.com/vatesfr/xen-orchestra/pull/10331))
- [i18n] Add Turkish and update Czech, Dutch, Slovak and Swedish translations (PR [#10316](https://github.com/vatesfr/xen-orchestra/pull/10316))
- [Backup repositories] Free, used and total space are now available on backup repositories (PR [#10406](https://github.com/vatesfr/xen-orchestra/pull/10406))
- [XO6/Host] Add icon for disabled host (PR [#10188](https://github.com/vatesfr/xen-orchestra/pull/10188))
- [V2V] When a VM has Changed Block Tracking enabled on the source host, a migration now asks the host which blocks it has to read — the blocks a disk uses for a full transfer, the blocks written since the previous pass for a delta — instead of scanning the disk through the VDDK. Faster to start on large disks, and one less moving part. VMs without CBT are migrated exactly as before (PR [#10384](https://github.com/vatesfr/xen-orchestra/pull/10384))
- [Proxy] Check proxy licenses at XOA level instead of blocking backups on it (PR [#10280](https://github.com/vatesfr/xen-orchestra/pull/10280))
- [RPU] A rolling pool update is now refused while a previous one is still in progress or was left incomplete, and asks for confirmation when the master is already up to date but other hosts are not (PR [#10394](https://github.com/vatesfr/xen-orchestra/pull/10394))
- [RPU] An incomplete rolling pool update can now be closed from the pool's Patches tab, or with `pool.finalizeRollingUpdate` and the REST route `POST /rest/v0/pools/{id}/actions/finalize_rolling_update`. The closing is refused while the update left something it had changed unrestored (HA, WLB, load balancer, backup schedules, disabled hosts, displaced or halted VMs); forcing it lists the abandoned items in the task and changes nothing in the pool (PR [#10418](https://github.com/vatesfr/xen-orchestra/pull/10418))
- [REST API/Backup] Add `POST backup-archives/:id/actions/mount_live_disk` and `POST backup-archives/:id/live_disks/:liveDiskId/actions/unmount` endpoints (administrators only): attach a disk of a backup to a host as a read-only SR, to read its content without restoring it. This XO's address reachable from the hosts is auto-detected, or can be set explicitly with `iscsi.advertisedAddress`
- [Backup/Restore] Choose what to do with each disk when restoring an incremental backup: restore it to an SR, live mount it read-only on a host so it is usable immediately without being copied, or not restore it at all (PR [#10345](https://github.com/vatesfr/xen-orchestra/pull/10345))
- [XO6/Host] Add possibility to shut down and start an host (PR [#10088](https://github.com/vatesfr/xen-orchestra/pull/10088))
- [REST API] Add `hosts/:id/actions/scan_pifs` endpoint (PR [#10187](https://github.com/vatesfr/xen-orchestra/pull/10187))
- [XO6/Host] Add possibility to scan PIFs directly from the host (PR [#10191](https://github.com/vatesfr/xen-orchestra/pull/10191))
- [Docs] Improve doc, rename titles, and refactor menu (PR [#10212](https://github.com/vatesfr/xen-orchestra/pull/10212))
- [XO6/Host] Add possibility to forget a host (PR [#10089](https://github.com/vatesfr/xen-orchestra/pull/10089))

- [IPMI-plugin] Add GET plugins/ipmi-sensors/hosts/{id}/ipmi to get IPMI sensors (PR [#10003](https://github.com/vatesfr/xen-orchestra/pull/10003))
- [VIF] Add VIF name in header on VIF detail page (PR [#10252](https://github.com/vatesfr/xen-orchestra/pull/10252))
- [REST API] Add an endpoint to reclaim space per vm or backup repository: `POST /rest/V0/backup-repositories/:id/actions/reclaim-space` (PR [#10262](https://github.com/vatesfr/xen-orchestra/pull/10262))
- [XO6/Host] Sort the networks table by network name (PR [#10367](https://github.com/vatesfr/xen-orchestra/pull/10367))
>>>>>>> 7b4991d829 (correct changelog entry)

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Backups] Fix on distributed incremental replication and deleteFirst incorrectly disabled for non-distributed replication jobs (PR [#10452](https://github.com/vatesfr/xen-orchestra/pull/10452))
- [New/VM] Hide guest tools ISO SR in new VM ISO selector (PR [#10430](https://github.com/vatesfr/xen-orchestra/pull/10430))
- [Host/VM] Fix the confirmation modal staying open and blocking the UI until the action was fully completed (PR [#10417](https://github.com/vatesfr/xen-orchestra/pull/10417))
- [Dashboard] Fix cards staying in error state after a temporary failure to fetch data, until the page was reloaded (PR [#10516](https://github.com/vatesfr/xen-orchestra/pull/10516))
- [backup] Properly detect a disk deleting while merging (PR [#10424](https://github.com/vatesfr/xen-orchestra/pull/10424))
- [backup] Recover a deadlocked merge when the chain is out of retention (PR [#10424](https://github.com/vatesfr/xen-orchestra/pull/10424))
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
