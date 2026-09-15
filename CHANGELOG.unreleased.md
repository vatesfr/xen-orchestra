> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

- [Backup/Live mount] A connection to the iSCSI target that has not logged in yet, such as a port scan or a failed CHAP login, no longer interrupts the mounted disk (PR [#10465](https://github.com/vatesfr/xen-orchestra/pull/10465))
- [Backup/Live mount] The mounted disk is reported as write-protected, so the guest sees it read-only instead of getting I/O errors on write, and the iSCSI target bounds the size of what a client can make it buffer (PR [#10566](https://github.com/vatesfr/xen-orchestra/pull/10566))

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [XO6/Vm] Add the VM name to VM related actions that open a modal (PR [#10310](https://github.com/vatesfr/xen-orchestra/pull/10310))
- [XO6] Allow changing which PIF a host uses for its management interface, without deleting and recreating the network config (PR [#10110](https://github.com/vatesfr/xen-orchestra/pull/10110))
- [XO6/SR] Add dedicated Storage Repository page hosts sidepanel (PR [#10140](https://github.com/vatesfr/xen-orchestra/pull/10140))
- [Rolling pool update/reboot] A pool can now skip the phase which brings the VMs back to the host they were running on, which halves the migrations of the run (PR [#10295](https://github.com/vatesfr/xen-orchestra/pull/10295))
- [XO5/Backups] Open the backup job edition form in the same tab when editing a backup job from the VM page (PR [#10342](https://github.com/vatesfr/xen-orchestra/pull/10342))
- [Web-Core/TabItem] Update the component to remove uppercase for better readability (PR [#10338](https://github.com/vatesfr/xen-orchestra/pull/10338))
- [REST API] VDI can now be exported in qcow2 format, and the VHD export uses NBD when available. Both formats work whatever the format the disk is stored in. Every export format, raw included, now provides the size of the download (PR [#10350](https://github.com/vatesfr/xen-orchestra/pull/10350))
- [REST API] SSE now supports Non XAPI objects (user, group, acl-privilege, acl-role, proxy, server, backup-repository, backup-job, schedule) (PR [#10278](https://github.com/vatesfr/xen-orchestra/pull/10278))
- [REST API/SDN Controller, Audit] Traffic rule and audit record routes are now documented in the Swagger/OpenAPI spec (PR [#9895](https://github.com/vatesfr/xen-orchestra/pull/9895))
- [LDAP] Release plugin for LDAP multidomain management (PR [#10015](https://github.com/vatesfr/xen-orchestra/pull/10015))
- [RPU] Keep track of an interrupted rolling pool update across xo-server restarts: the pool's Patches tab now shows which hosts were updated, the last error, and the VMs that were shut down for the update and not started again (PR [#10331](https://github.com/vatesfr/xen-orchestra/pull/10331))
- [i18n] Add Turkish and update Czech, Dutch, Slovak and Swedish translations (PR [#10316](https://github.com/vatesfr/xen-orchestra/pull/10316))
- [Complex-matcher] Implemented [resolve] and [resolve:all] nodes for deep resolution (PR [#9911](https://github.com/vatesfr/xen-orchestra/pull/9911))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Backups/sequences] Prevent errors on backup with proxy from aborting sequences (PR [#10504](https://github.com/vatesfr/xen-orchestra/pull/10504))
- [Backups] Fix on distributed incremental replication and deleteFirst incorrectly disabled for non-distributed replication jobs (PR [#10452](https://github.com/vatesfr/xen-orchestra/pull/10452))
- [New/VM] Hide guest tools ISO SR in new VM ISO selector (PR [#10430](https://github.com/vatesfr/xen-orchestra/pull/10430))
- [Host/VM] Fix the confirmation modal staying open and blocking the UI until the action was fully completed (PR [#10417](https://github.com/vatesfr/xen-orchestra/pull/10417))
- [Dashboard] Fix cards staying in error state after a temporary failure to fetch data, until the page was reloaded (PR [#10516](https://github.com/vatesfr/xen-orchestra/pull/10516))
- [backup] Properly detect a disk deleting while merging (PR [#10424](https://github.com/vatesfr/xen-orchestra/pull/10424))
- [backup] Recover a deadlocked merge when the chain is out of retention (PR [#10424](https://github.com/vatesfr/xen-orchestra/pull/10424))
- [Backup/S3] Fix files never deleted on providers and handle NotFound as expected (PR [#10548](https://github.com/vatesfr/xen-orchestra/pull/10548))
- [Backups] Fix NBD reads failing after a reconnection, when the previous connection is closed late by the host (PR [#10456](https://github.com/vatesfr/xen-orchestra/pull/10456))
- [Plugins/load balancer] Prevent inter-pool migrations triggered by affinity or anti-affinity (PR [#10207](https://github.com/vatesfr/xen-orchestra/pull/10207))
- [REST API] Fix VM creation when destroying an existing VDI (PR [#10292](https://github.com/vatesfr/xen-orchestra/pull/10292))
- [Pool] Display an error when connecting a pool that is already registered, instead of failing silently (PR [#10484](https://github.com/vatesfr/xen-orchestra/pull/10484))
- [Backups] VMs with an `xo:no-bak=<reason>` tag are no longer listed as backed up by smart mode jobs (PR [#10450](https://github.com/vatesfr/xen-orchestra/pull/10450))
- [XO6] Fix the search button of the tables' query builder doing nothing on small and medium screens (PR [#10475](https://github.com/vatesfr/xen-orchestra/pull/10475))
- [Servers] Fix servers stuck in `Connecting` state when using an HTTPS proxy that support HTTP/2 ([Forum#12502](https://xcp-ng.org/forum/topic/12502/xoa-6.9-update)) (PR [#10507](https://github.com/vatesfr/xen-orchestra/pull/10507))
- [V2V] Fix `vectura is not runnable` on XOA and other systems based on Debian 11 (glibc 2.31): the `vectura` binary required glibc 2.34
- [VM/System] Fix video RAM displayed in bytes instead of MiB (PR [#10486](https://github.com/vatesfr/xen-orchestra/pull/10486))
- [XO5/Hosts] Disable restart toolstack button for the hosts that belongs to a HA pools in the home page (PR [#10497](https://github.com/vatesfr/xen-orchestra/pull/10497))
- [Backup/replication] fix to ensure distributed replications are deleted according to retention (PR [#10491] (https://github.com/vatesfr/xen-orchestra/pull/10491))
- [Replication] Fix `Cannot read properties of undefined (reading 'get')` error on continuous replication to multiple SRs (PR [#10519](https://github.com/vatesfr/xen-orchestra/pull/10519))
- [Backup/NBD] Support NBD for pools reached through an HTTP proxy (e.g. an XO Proxy): NBD connections are now tunneled through the proxy instead of falling back to a stream export (PR [#10544](https://github.com/vatesfr/xen-orchestra/pull/10544))
- [xo-cli] fix output failing when outputing a rest api answer (PR [#10541](https://github.com/vatesfr/xen-orchestra/pull/10541))
- [XO5/Self Service] Fix removing a tag from a resource set removing all the other tags instead (PR [#10550](https://github.com/vatesfr/xen-orchestra/pull/10550))
- [Backups/DR] Report the actual XAPI error instead of `(intermediate value) is not iterable` when a VM import fails (PR [#10551](https://github.com/vatesfr/xen-orchestra/pull/10551/))
- [VDI/Export] Fix pressing Escape in the format select closing the whole export drawer (PR [#10582](https://github.com/vatesfr/xen-orchestra/pull/10582))
- [Servers] Fix a pool left in a broken state when its connection was lost twice in a row within 5 minutes (e.g. during a toolstack restart): it could be displayed as connecting while connected and its objects could no longer be acted upon, or it would never be reconnected automatically (PR [#10577](https://github.com/vatesfr/xen-orchestra/pull/10577))
- [Swagger] Fixed a typo in the VM collection: `xentools` → `xenTools`, and added a missing type to the server collection `poolMembersAddresses` [#10514](https://github.com/vatesfr/xen-orchestra/issues/10514) (PR [#10598](https://github.com/vatesfr/xen-orchestra/pull/10598))
- [VM/console] Fix opening console in new tab (PR [#10616](https://github.com/vatesfr/xen-orchestra/pull/10616))
- [Host] Enabling multipathing on hosts only disconnects shared SRs, local storage SRs stay connected(PR [#10592](https://github.com/vatesfr/xen-orchestra/pull/10592))

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

- @vates/iscsi minor
- @vates/nbd-client minor
- @vates/types minor
- @xen-orchestra/acl minor
- @xen-orchestra/backup-archive patch
- @xen-orchestra/backups minor
- @xen-orchestra/fs minor
- @xen-orchestra/qa-test minor
- @xen-orchestra/qcow2 patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/vmdk major
- @xen-orchestra/vmware-explorer minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi patch
- complex-matcher minor
- xen-api major
- xo-server minor
- xo-server-load-balancer minor
- xo-server-netbox minor
- xo-server-sdn-controller patch
- xo-web minor

<!--packages-end-->
