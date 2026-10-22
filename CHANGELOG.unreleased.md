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

- [REST API] `POST /rest/v0/acl-roles` now supports a `privileges` property, allowing privileges to be directly associated with the newly created role (PR [#10470](https://github.com/vatesfr/xen-orchestra/pull/10470))
- [Tasks] Add link and object resolution to Tasks Overview panel, better text flow for resolved task names (PR [#10265](https://github.com/vatesfr/xen-orchestra/pull/10265))
- [XO5/Settings/IPs] Show an example of the expected IP format when adding IPs to an IP pool (PR [#10522](https://github.com/vatesfr/xen-orchestra/pull/10522))
- [BRs] Add backup repository create form (PR [#10271](https://github.com/vatesfr/xen-orchestra/pull/10271))
- [REST API] SSE now supports the `backup-archive` collection: backups appearing, being merged or disappearing from a backup repository are pushed to the subscribers, instead of each client listing the repositories again to spot them. XO does not read a repository on its own, so the changes of a repository are pushed as it is listed — a listing by any client is enough — and the archives it already holds arrive as `add` events the first time it is listed after a restart (PR [#10472](https://github.com/vatesfr/xen-orchestra/pull/10472))
- [Plugins/load balancer] Added VM-to-host affinity to force VMs to run on a given set of hosts if possible (PR [#10207](https://github.com/vatesfr/xen-orchestra/pull/10207))
- [Plugins/load balancer] Improved migration decision making (PR [#10207](https://github.com/vatesfr/xen-orchestra/pull/10207))
- [New VM] Allow removing existing (template) disks (PR [#10292](https://github.com/vatesfr/xen-orchestra/pull/10292))
- [Pool] Add validation to the pool connection form (PR [#10484](https://github.com/vatesfr/xen-orchestra/pull/10484))
- [XO6] All objects displayed in the UI are now updated in real time, except backup logs and backup archives which are still refreshed every 30 seconds (PR [#10450](https://github.com/vatesfr/xen-orchestra/pull/10450))
- [REST API] Event subscriptions (`/rest/v0/events`) now support `authentication_token`: each user only receives events about their own tokens and `backup-logs` (PRs [#10450](https://github.com/vatesfr/xen-orchestra/pull/10450), [#10563](https://github.com/vatesfr/xen-orchestra/pull/10563))
- [Side panels] Harmonize card titles across side panels (PR [#10289](https://github.com/vatesfr/xen-orchestra/pull/10289))
- [Host] Add a condition to disable the detached action when the host is not running (PR [#10543](https://github.com/vatesfr/xen-orchestra/pull/10543))
- [Treeview] Press Ctrl+K (Cmd+K on macOS) to focus the treeview search (PR [#10492](https://github.com/vatesfr/xen-orchestra/pull/10492))
- [New VM] Allow resizing existing (template) disks when a config drive is used (PR [#10359](https://github.com/vatesfr/xen-orchestra/pull/10359))
- [Host] Add possibility to emergency shutdown a host (PR [#10412](https://github.com/vatesfr/xen-orchestra/pull/10412))
- [Backup/Restore] Faster reading of the files of a remote, like the full backups (10 MiB chunks instead of 64 KiB) (PR [#10537](https://github.com/vatesfr/xen-orchestra/pull/10537))
- [Mirror] The full mirrors between unencrypted remotes reuse the checksum of the source instead of computing it again (PR [#10537](https://github.com/vatesfr/xen-orchestra/pull/10537))
- [Mirror] The incremental mirrors between remotes don't recompress the blocks if the source and destination use the same compression (PR [#10581](https://github.com/vatesfr/xen-orchestra/pull/10581))
- [SDN Controller] Fix events listening and stale objects on server reconnection (PR [#10440](https://github.com/vatesfr/xen-orchestra/pull/10440))
- [BRs] Add backup repository detail page (PR [#10454](https://github.com/vatesfr/xen-orchestra/pull/10454))
- [Backup logs] Add backup log list in admin menu (PR [#10572](https://github.com/vatesfr/xen-orchestra/pull/10572))
- [BRs] Add backup repository edit form (PR [#10478](https://github.com/vatesfr/xen-orchestra/pull/10478))
- [Backup] Support insecure dedicated NBD network (PR [#10540](https://github.com/vatesfr/xen-orchestra/pull/10540))
- [Pool/Network] Allow enabling the insecure NBD (not encrypted) on a network (PR [#10540](https://github.com/vatesfr/xen-orchestra/pull/10540))
- [REST API] `POST /rest/v0/pools/:id/actions/create_network` supports `insecureNbd` to create a network with the insecure NBD (PR [#10540](https://github.com/vatesfr/xen-orchestra/pull/10540))
- [XO6/New network] Choose between no NBD, secure NBD and insecure NBD (not encrypted) when creating a network (PR [#10540](https://github.com/vatesfr/xen-orchestra/pull/10540))

- Host Probe SR REST API Endpoints:

  - `POST /rest/v0/hosts/:id/actions/probe_nfs` (PR [#10099](https://github.com/vatesfr/xen-orchestra/pull/10099))
  - `POST /rest/v0/hosts/:id/actions/probe_zfs` (PR [#10099](https://github.com/vatesfr/xen-orchestra/pull/10099))
  - `POST /rest/v0/hosts/:id/actions/probe_hba` (PR [#10099](https://github.com/vatesfr/xen-orchestra/pull/10099))
  - `POST /rest/v0/hosts/:id/actions/probe_iscsi_iqns` (PR [#10099](https://github.com/vatesfr/xen-orchestra/pull/10099))
  - `POST /rest/v0/hosts/:id/actions/probe_iscsi_luns` (PR [#10099](https://github.com/vatesfr/xen-orchestra/pull/10099))
  - `POST /rest/v0/hosts/:id/actions/probe_iscsi_exists` (PR [#10099](https://github.com/vatesfr/xen-orchestra/pull/10099))
  - `POST /rest/v0/hosts/:id/actions/probe_hba_exists` (PR [#10099](https://github.com/vatesfr/xen-orchestra/pull/10099))
  - `POST /rest/v0/hosts/:id/actions/probe_nfs_exists` (PR [#10099](https://github.com/vatesfr/xen-orchestra/pull/10099))

- [XO5/Host/Patches] Warn when installing patches on a host while its pool master is not up to date (PR [#10523](https://github.com/vatesfr/xen-orchestra/pull/10523))
- [XO6] Add copy button for multiple information on Host/VM Dashboard and Pool/Host/VM System tabs (PR [#9976](https://github.com/vatesfr/xen-orchestra/pull/9976))
- [XO6] Export VDI as vmdk (PR [#10591](https://github.com/vatesfr/xen-orchestra/pull/10591))
- [XO5] Improve event handling (PR [#10568](https://github.com/vatesfr/xen-orchestra/pull/10568))
- [Netbox] Support Netbox v4.7.x [#10565](https://github.com/vatesfr/xen-orchestra/issues/10565) (PR [#10574](https://github.com/vatesfr/xen-orchestra/pull/10574))
- [V2V] Import VMs from ESXi 6.x hosts: their disks are read one request at a time, so more slowly than from ESXi 7 and 8 (PR [#10590](https://github.com/vatesfr/xen-orchestra/pull/10590))
- [Backup repositories] Free, used and total space are now available on backup repositories (PR [#10406](https://github.com/vatesfr/xen-orchestra/pull/10406))
- [Backup] New `zstd` compression for the remotes in block mode (needs Node 22.15 or later), faster to back up and about 1.5 times faster to restore than `brotli` (PR [#10545](https://github.com/vatesfr/xen-orchestra/pull/10545))
- [Backup] Remove the unused `vhdDirectoryCompression` setting of the configuration: the compression is the one of the backup repository, brotli by default (PR [#10545](https://github.com/vatesfr/xen-orchestra/pull/10545))
- [Backup] New `zeros` compression for the remotes in block mode: only the pages full of zeroes are removed, much cheaper than a real compression (PR [#10545](https://github.com/vatesfr/xen-orchestra/pull/10545))
- [REST API] Add `/rest/v0/plugins` endpoints to list, configure, load, unload and test the plugins (PR [#10588](https://github.com/vatesfr/xen-orchestra/pull/10588))
- [REST API] `POST /rest/v0/vms/{id}/actions/migrate` Add `bypassCpuCheck` parameter (PR [#10614](https://github.com/vatesfr/xen-orchestra/pull/10614))
- [i18n] Update Arabic, Danish, Finnish, Italian, Japanese, Korean, Norwegian, Persian, Polish, Portuguese (Brasil), Russian and Ukrainian translations (PR [#XXXX](https://github.com/vatesfr/xen-orchestra/pull/XXXX))

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
- [XO6] Fix the ETA of task (PR [#10622](https://github.com/vatesfr/xen-orchestra/pull/10622))
- [Swagger] Fixed a typo in the VM collection: `xentools` → `xenTools`, and added a missing type to the server collection `poolMembersAddresses` [#10514](https://github.com/vatesfr/xen-orchestra/issues/10514) (PR [#10598](https://github.com/vatesfr/xen-orchestra/pull/10598))
- [VM/console] Fix opening console in new tab (PR [#10616](https://github.com/vatesfr/xen-orchestra/pull/10616))
- [Host] Enabling multipathing on hosts only disconnects shared SRs, local storage SRs stay connected (PR [#10592](https://github.com/vatesfr/xen-orchestra/pull/10592))
- [Plugins/transport-icinga2] Fix authenticated Icinga2 requests failing with `Request cannot be constructed from a URL that includes credentials`, contribution by [@vmpr](https://github.com/vmpr) [#10498](https://github.com/vatesfr/xen-orchestra/issues/10498) (PR [#10594](https://github.com/vatesfr/xen-orchestra/pull/10594))

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
- @xen-orchestra/backup-archive minor
- @xen-orchestra/backups minor
- @xen-orchestra/disk-transform patch
- @xen-orchestra/fs minor
- @xen-orchestra/proxy patch
- @xen-orchestra/qa-test minor
- @xen-orchestra/qcow2 patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/vmdk major
- @xen-orchestra/vmware-explorer minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi minor
- vhd-lib minor
- xen-api minor
- xo-acl-resolver minor
- xo-cli patch
- xo-server minor
- xo-server-load-balancer minor
- xo-server-netbox minor
- xo-server-sdn-controller patch
- xo-server-transport-icinga2 patch
- xo-web minor

<!--packages-end-->
