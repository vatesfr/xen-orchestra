> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

- Fix authentication token validation
- [Backup/File restore] Symbolic links are no longer followed: browsing or downloading a path that goes through one is refused, and the links met inside a restored folder are skipped (PR [#9941](https://github.com/vatesfr/xen-orchestra/pull/9941))
- [Backup/Live mount] The iSCSI target of a mount only accepts connections from the host it is mounted on. **If the hosts reach XO or the proxy through a NAT**, set `iscsi.restrictToHost = false`, or live mounts fail (PR [#10426](https://github.com/vatesfr/xen-orchestra/pull/10426))
- [Plugins/audit] Redact more sensitive values from new audit records (created API tokens, credentials and encryption keys in URLs, one-time download/upload links) (PR [#10618](https://github.com/vatesfr/xen-orchestra/pull/10618))

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Header] On mobile, the XO 5 link and third party apps are grouped in a "More actions" menu (PR [#10744](https://github.com/vatesfr/xen-orchestra/pull/10744))
- [Mobile/Side panels] Full-page menus on mobile with "Change state" and "Manage in XO-5" in "More actions", side panel actions shown as buttons when there is room, and fixes for long names in headers and menu placement (PR [#10745](https://github.com/vatesfr/xen-orchestra/pull/10745))
- [Side panels] Side panels can be resized like the treeview, whose default width now adapts to the screen size (PR [#10725](https://github.com/vatesfr/xen-orchestra/pull/10725))
- [Side panels] Values stay next to their label when they fit and move below it otherwise, fields with several values (IP addresses, report recipients…) get a copy button per value and a "Copy all" action, and rows, links and statuses are more evenly spaced and sized (PR [#10733](https://github.com/vatesfr/xen-orchestra/pull/10733))
- [Treeview] A more compact tree, so that names get more room: lower rows running edge to edge and a smaller indent per level; hovering a quick actions button no longer highlights its whole row (PR [#10727](https://github.com/vatesfr/xen-orchestra/pull/10727))
- [Pool/Network] Add network dedicated page, with General and PIFs tabs (PR [#10704](https://github.com/vatesfr/xen-orchestra/pull/10704))
- [Pool/Traffic rules] Display traffic rules by priority within their network (PR [#10688](https://github.com/vatesfr/xen-orchestra/pull/10688))
- [VMs/Hosts] Show a loader in VM and host icons while their power state is changing, with the operation in progress in the tooltip, and move the header loader next to the name (PR [#10720](https://github.com/vatesfr/xen-orchestra/pull/10720))
- [REST API] Create, update and delete backup jobs and schedules (admin only): `POST /rest/v0/backup-jobs`, `PATCH|DELETE /rest/v0/backup-jobs/:id`, `POST /rest/v0/schedules`, `PATCH|DELETE /rest/v0/schedules/:id` (PR [#10595](https://github.com/vatesfr/xen-orchestra/pull/10595))
- [Tabs] When tabs don't fit on screen, arrows replace the horizontal scrollbar to scroll them left and right (PR [#10759](https://github.com/vatesfr/xen-orchestra/pull/10759))
- [Web-Core/UiDropdownButton] Update dropdown buttons design and add a smaller size (PR [#9850](https://github.com/vatesfr/xen-orchestra/pull/9850))
- [REST API] `PUT /rest/v0/acl-roles/:id/users/:userId` refuses to attach a role to an admin, and `GET /rest/v0/users/:id/acl-privileges` returns no privileges for an admin (PR [#10694](https://github.com/vatesfr/xen-orchestra/pull/10694))
- [REST API/V2V] `POST /rest/v0/v2v/inventory` reads the inventory of a vCenter or ESXi (datacenters, clusters, hosts, datastores, networks and VMs with their disks and network cards), and `POST /rest/v0/pools/:id/actions/import_vms_from_vmware` imports a list of VMs into the pool, with an SR per disk and a network per network card, resuming partial imports with a delta. Restricted to administrators, credentials are never stored (PR [#10597](https://github.com/vatesfr/xen-orchestra/pull/10597))
- [XO6/V2V] Add the _Migrate VMs_ wizard in Administration › V2V: connect to a VMware source, choose the destination pool and its defaults, select the VMs to migrate, map their disks, network cards and settings, then review and start the migration (PR [#10816](https://github.com/vatesfr/xen-orchestra/pull/10816))
- [V2V] Optional `docking` of the guest once its import is complete: the VM boots on the docking ISO deployed on the pool (`vates-autopilot-docking-<build date and time>-<commit>.iso`), with the guest tools ISO, which prepares it to run on XCP-ng (Xen drivers, VMware tools disabled, guest agent, network interface names, Windows first boot). Off by default, available on `POST /rest/v0/pools/:id/actions/import_vms_from_vmware` (PR [#10621](https://github.com/vatesfr/xen-orchestra/pull/10621))
- [V2V] Optional `startVm` once the import is complete: a docked guest is followed through its first boot (Windows drivers and agent installation, with a diagnosis of the VM when it does not complete), then Secure Boot is enabled again when the source had it (PR [#10621](https://github.com/vatesfr/xen-orchestra/pull/10621))
- [REST API] Expose `GET /rest/v0/backup-archives/:id/disks/:diskId/partitions` (PR [#9941](https://github.com/vatesfr/xen-orchestra/pull/9941))
- [REST API] Expose `GET /rest/v0/backup-archives/:id/disks/:diskId/partitions/:partitionId/files` (PR [#9941](https://github.com/vatesfr/xen-orchestra/pull/9941))
- [REST API] Expose `GET /rest/v0/backup-archives/:id/disks/:diskId/files` (PR [#9941](https://github.com/vatesfr/xen-orchestra/pull/9941))
- [REST API] Expose `GET /rest/v0/backup-archives/:id/disks/:diskId/partitions/:partitionId/files.:format` to get file(s) from a partition (PR [#9941](https://github.com/vatesfr/xen-orchestra/pull/9941))
- [REST API] Expose `GET /rest/v0/backup-archives/:id/disks/:diskId/files.:format` to get file(s) from a bare disk (PR [#9941](https://github.com/vatesfr/xen-orchestra/pull/9941))
- [Backups] The backup journal of a remote (`xo-backup-log/`) no longer grows forever: its entries are deleted after 30 days, configurable with `backups.journalRetention` (PR [#10703](https://github.com/vatesfr/xen-orchestra/pull/10703))
- [XO6/Backups] Add a detail page for backup logs (PR [#10718](https://github.com/vatesfr/xen-orchestra/pull/10718))
- [Tables] Tables are filtered as you type, half a second after the last keystroke, or right away with Enter; the "Search" button is removed (PR [#10797](https://github.com/vatesfr/xen-orchestra/pull/10797))
- [Backups] VM backups on S3 and Azure repositories now lock the VM's folder like on other repositories: two jobs, or a job and the cleanup that follows a deletion, no longer modify the same VM's folder at the same time, and the second one fails with "Lock file is already being held". On S3, buckets with Object Lock enabled are not locked yet (PR [#10549](https://github.com/vatesfr/xen-orchestra/pull/10549))
- [VMs] Select multiple VMs in VM tables to change their power state, snapshot or delete them at once (PR [#10780](https://github.com/vatesfr/xen-orchestra/pull/10780))
- [XO6/Backups] Add filters and actions on backup jobs (PR [#10772](https://github.com/vatesfr/xen-orchestra/pull/10772))
- [Logs] The syslog transport (`[logs.transport.syslog]` in xo-server configuration) supports TLS (`tls://`), and the facility, application name and framing can be configured (PR [#10619](https://github.com/vatesfr/xen-orchestra/pull/10619))
- [Logs] **Breaking:** logs are now sent to syslog as RFC 5424 messages, with their namespace as message ID, instead of RFC 3164 messages: set `format = 'rfc3164'` in `[logs.transport.syslog]` to keep the previous format (PR [#10619](https://github.com/vatesfr/xen-orchestra/pull/10619))
- [Plugins/audit] Forward a copy of each new audit record, as JSON, to a remote syslog server (e.g. a SIEM) over UDP, TCP or TLS, configurable in the plugin settings (PR [#10618](https://github.com/vatesfr/xen-orchestra/pull/10618))
- [VM/Host] Main actions (shutdown, reboot, start, migrate, snapshot, new VM) are shown as buttons in the VM and host headers and move one by one into "More actions" when space runs out; "More actions" groups them under "Change state" and "Actions" sections, and VMs without guest tools get force shutdown and force reboot instead (PR [#10815](https://github.com/vatesfr/xen-orchestra/pull/10815))
- [REST API] `POST /rest/v0/hosts/:id/actions/move_management_ip` to move the management IP configuration of a host to another PIF (PR [#10669](https://github.com/vatesfr/xen-orchestra/pull/10669))
- [Hosts] The host actions of the treeview (change state, restart toolstack, enable or disable, detach, forget, download bugtools archive) are also available in host tables and side panels (PR [#10821](https://github.com/vatesfr/xen-orchestra/pull/10821))
- [Pool/Traffic rules] Edit the order of traffic rules within a network (PR [#10706](https://github.com/vatesfr/xen-orchestra/pull/10706))
- [Pool/Traffic rules] Add a priority when creating a traffic rule (PR [#10750](https://github.com/vatesfr/xen-orchestra/pull/10750))
- [Modals/Menus] Keyboard navigation: Tab stays inside an open modal or drawer and the focus goes back where it was once it closes, and menus such as "Change state" open with Enter and are browsed with the arrow keys (PR [#10828](https://github.com/vatesfr/xen-orchestra/pull/10828))
- [Menus] Submenus open when hovering their option and can be reached diagonally without opening the neighbouring ones, Escape closes them one level at a time, and menu buttons are announced to screen readers (PR [#10827](https://github.com/vatesfr/xen-orchestra/pull/10827))
- [Modals] The confirm button of the modals asking to type a text is no longer disabled: confirming with a wrong text keeps the modal open and shows an error under the field (PR [#10826](https://github.com/vatesfr/xen-orchestra/pull/10826))
- [xen-api] **Breaking:** `callAsync()`, `getResource()` and `putResource()` take an optional `AbortSignal` as first parameter instead of a promise-toolbox `CancelToken`, which is no longer supported (PR [#10740](https://github.com/vatesfr/xen-orchestra/pull/10740))
- [Backups] Show the space actually used by each backup on its backup repository, compression and encryption included (XO6 VM dashboard, XOA dashboard backup usage, REST API) (PR [#10685](https://github.com/vatesfr/xen-orchestra/pull/10685))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Pools] Pool side panel now shows the same pool name, UUID and icon as the pools table, and keeps the pool card when the pool is disconnected or unreachable (PR [#10714](https://github.com/vatesfr/xen-orchestra/pull/10714))
- [Treeview] Fix translations of the tooltip for VM and host statuses in treeview (PR [#10643](https://github.com/vatesfr/xen-orchestra/pull/10643))
- [V2V] Keep the MAC address of a network card set by hand on VMware, instead of generating a new one, and no longer create a network interface for a card which is not present (PR [#10597](https://github.com/vatesfr/xen-orchestra/pull/10597))
- [Replication] Fix `Cannot read properties of undefined (reading 'uuid')` error when an orphan replica snapshot exists on the target SR (PR [#10732](https://github.com/vatesfr/xen-orchestra/pull/10732))
- [XO6/Modals] Modals no longer stretch across the screen: their width is limited to a third of the screen, up to 550px (PR [#10800](https://github.com/vatesfr/xen-orchestra/pull/10800))
- [Backup/Live mount] Fix mounts failing when xo-server runs without root on a system using iptables-legacy, instead of leaving the firewall alone (PR [#10426](https://github.com/vatesfr/xen-orchestra/pull/10426))
- [Logs] Fix the syslog transport sending every log with the _informational_ severity, splitting a log with line breaks into several messages, keeping the previous connection open when the configuration changes, and accumulating connections and memory when the syslog server is unreachable or does not read (PR [#10619](https://github.com/vatesfr/xen-orchestra/pull/10619))
- [Plugins/Load balancer] Fix performance plan being unable to start halted hosts (PR [#10809](https://github.com/vatesfr/xen-orchestra/pull/10809))
- [Side panels] Fix the double scrollbar when the side panel content is taller than the screen: the page header now stays in place, and the list and the side panel each scroll on their own. All scrollbars are now thin, like the side panel one (PR [#10807](https://github.com/vatesfr/xen-orchestra/pull/10807))
- [SDN Controller] Taking control of a bridge no longer restricts it to OpenFlow 1.1, which broke the VIF locking flows XAPI installs with OpenFlow 1.0, and the bridges an older version restricted get OpenFlow 1.0 back (PR [#10691](https://github.com/vatesfr/xen-orchestra/pull/10691))
- [REST API/SDN Controller] A traffic rule can no longer be given the priority 0, which XAPI reserves, in `add_traffic_rule`, `update_traffic_rule` and the JSON-RPC methods `sdnController.addRule` and `sdnController.addNetworkRule`; a rule that already has it can still be deleted, or updated to another priority (PR [#10738](https://github.com/vatesfr/xen-orchestra/pull/10738))
- [Pages] The page header and tabs now stay in place on every page: dashboards, System and General tabs, consoles, settings and creation forms scroll under them instead of scrolling with them (PR [#10822](https://github.com/vatesfr/xen-orchestra/pull/10822))
- [Tooltips] Short tooltips near the edge of the screen no longer wrap onto two lines (PR [#10822](https://github.com/vatesfr/xen-orchestra/pull/10822))
- [SDN Controller] Adding, updating or deleting a VIF or network traffic rule now fails, and its rules are left as they were, when the host can't apply it (e.g. the XAPI plugin fails), instead of reporting success (PR [#10691](https://github.com/vatesfr/xen-orchestra/pull/10691))
- [XO6/Plugins] Plugin settings descriptions keep their line breaks and links instead of showing HTML tags as text (e.g. auth-saml signature settings, backup-reports test) (PR [#10825](https://github.com/vatesfr/xen-orchestra/pull/10825))
- [REST API] `GET /rest/v0/tasks/{id}?wait=true` now returns when a backup, metadata backup or restore ends, instead of waiting until the task is interrupted (PR [#10778](https://github.com/vatesfr/xen-orchestra/pull/10778))
- [Backups] A backup job that fails as a whole is now marked as failed in its task, instead of staying pending until XO restarts (PR [#10778](https://github.com/vatesfr/xen-orchestra/pull/10778))
- [REST API/Tasks] Aborting a running backup task that can't be aborted now fails with `forbidden operation` instead of `no such task` (with `sync=true`: 403 instead of 404) (PR [#10778](https://github.com/vatesfr/xen-orchestra/pull/10778))
- [Servers] Fix a pool disappearing from XO, its server stuck in "connecting" until it is disabled and enabled again, after a short network interruption (PR [#10814](https://github.com/vatesfr/xen-orchestra/pull/10814))

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

- @vates/obfuscate minor
- @vates/syslog minor
- @vates/types major
- @xen-orchestra/acl minor
- @xen-orchestra/autopilot-docking minor
- @xen-orchestra/backup-archive minor
- @xen-orchestra/backups major
- @xen-orchestra/disk-cli minor
- @xen-orchestra/fs minor
- @xen-orchestra/log major
- @xen-orchestra/mixins minor
- @xen-orchestra/proxy minor
- @xen-orchestra/qa-test minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/vmware-explorer minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi major
- vhd-lib minor
- xen-api major
- xo-collection major
- xo-server minor
- xo-server-audit minor
- xo-server-load-balancer patch
- xo-server-sdn-controller patch
- xo-web minor


<!--packages-end-->
