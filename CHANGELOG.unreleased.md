> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

- Fix authentication token validation
- [Backup/File restore] Symbolic links are no longer followed: browsing or downloading a path that goes through one is refused, and the links met inside a restored folder are skipped (PR [#9941](https://github.com/vatesfr/xen-orchestra/pull/9941))
- [Backup/Live mount] The iSCSI target of a mount only accepts connections from the host it is mounted on. **If the hosts reach XO or the proxy through a NAT**, set `iscsi.restrictToHost = false`, or live mounts fail (PR [#10426](https://github.com/vatesfr/xen-orchestra/pull/10426))
- [Plugins/audit] Redact more sensitive values from new audit records (created API tokens, credentials and encryption keys in URLs, one-time download/upload links) (PR [#10618](https://github.com/vatesfr/xen-orchestra/pull/10618))
- XOA updater access now requires administrator credentials (PR [#10857](https://github.com/vatesfr/xen-orchestra/pull/10857))
- [Settings/Forwarded headers] When `http.useForwardedHeaders` lists an IPv4 subnet written in IPv6 notation with a short prefix (e.g. `::ffff:10.0.0.0/8`), only the proxies in that subnet are trusted: any client could send its own `X-Forwarded-For` and choose the IP address XO sees (PR [#XXXX](https://github.com/vatesfr/xen-orchestra/pull/XXXX))
- [Proxy] The proxy authentication token is no longer exposed by the API. **The `url` property of a proxy no longer contains a URL** but a message explaining its removal: scripts relying on it must be updated (PR [#10810](https://github.com/vatesfr/xen-orchestra/pull/10810))

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Header] On mobile, the XO 5 link and third party apps are grouped in a "More actions" menu (PR [#10744](https://github.com/vatesfr/xen-orchestra/pull/10744))
- [Mobile/Side panels] Full-page menus on mobile with "Change state" and "Manage in XO-5" in "More actions", side panel actions shown as buttons when there is room, and fixes for long names in headers and menu placement (PR [#10745](https://github.com/vatesfr/xen-orchestra/pull/10745))
- [Side panels] Side panels can be resized like the treeview, whose default width now adapts to the screen size (PR [#10725](https://github.com/vatesfr/xen-orchestra/pull/10725))
- [Side panels] Values stay next to their label when they fit and move below it otherwise, fields with several values (IP addresses, report recipients…) get a copy button per value and a "Copy all" action, and rows, links and statuses are more evenly spaced and sized (PR [#10733](https://github.com/vatesfr/xen-orchestra/pull/10733))
- [Treeview] A more compact tree, so that names get more room: lower rows running edge to edge and a smaller indent per level; hovering a quick actions button no longer highlights its whole row (PR [#10727](https://github.com/vatesfr/xen-orchestra/pull/10727))
- [VM/Dashboard] Show the storage repositories holding the VM's disks in the "Quick info" card (PR [#10747](https://github.com/vatesfr/xen-orchestra/pull/10747))
- [Pool/Network] Add network dedicated page, with General and PIFs tabs (PR [#10704](https://github.com/vatesfr/xen-orchestra/pull/10704))
- [Pool/Traffic rules] Display traffic rules by priority within their network (PR [#10688](https://github.com/vatesfr/xen-orchestra/pull/10688))
- [VMs/Hosts] Show a loader in VM and host icons while their power state is changing, with the operation in progress in the tooltip, and move the header loader next to the name (PR [#10720](https://github.com/vatesfr/xen-orchestra/pull/10720))
- [VM] Add and remove VM tags from the VM dashboard and the VM side panel (PR [#10804](https://github.com/vatesfr/xen-orchestra/pull/10804))
- [REST API] Create, update and delete backup jobs and schedules (admin only): `POST /rest/v0/backup-jobs`, `PATCH|DELETE /rest/v0/backup-jobs/:id`, `POST /rest/v0/schedules`, `PATCH|DELETE /rest/v0/schedules/:id` (PR [#10595](https://github.com/vatesfr/xen-orchestra/pull/10595))
- [Backup jobs] Add backup job creation form in admin menu (PR [#10673](https://github.com/vatesfr/xen-orchestra/pull/10673))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Pools] Pool side panel now shows the same pool name, UUID and icon as the pools table, and keeps the pool card when the pool is disconnected or unreachable (PR [#10714](https://github.com/vatesfr/xen-orchestra/pull/10714))
- [Treeview] Fix translations of the tooltip for VM and host statuses in treeview (PR [#10643](https://github.com/vatesfr/xen-orchestra/pull/10643))
- [V2V] Keep the MAC address of a network card set by hand on VMware, instead of generating a new one, and no longer create a network interface for a card which is not present (PR [#10597](https://github.com/vatesfr/xen-orchestra/pull/10597))
- [Replication] Fix `Cannot read properties of undefined (reading 'uuid')` error when an orphan replica snapshot exists on the target SR (PR [#10732](https://github.com/vatesfr/xen-orchestra/pull/10732))
- [Modals] Modals no longer stretch across the screen: their width is limited to a third of the screen, up to 550px (PR [#10800](https://github.com/vatesfr/xen-orchestra/pull/10800))
- [Backup/Live mount] Fix mounts failing when xo-server runs without root on a system using iptables-legacy, instead of leaving the firewall alone (PR [#10426](https://github.com/vatesfr/xen-orchestra/pull/10426))
- [Logs] Fix the syslog transport sending every log with the _informational_ severity, splitting a log with line breaks into several messages, keeping the previous connection open when the configuration changes, and accumulating connections and memory when the syslog server is unreachable or does not read (PR [#10619](https://github.com/vatesfr/xen-orchestra/pull/10619))
- [Plugins/Load balancer] Fix performance plan being unable to start halted hosts (PR [#10809](https://github.com/vatesfr/xen-orchestra/pull/10809))
- [Side panels] Fix the double scrollbar when the side panel content is taller than the screen: the page header now stays in place, and the list and the side panel each scroll on their own. All scrollbars are now thin, like the side panel one (PR [#10807](https://github.com/vatesfr/xen-orchestra/pull/10807))
- [SDN Controller] Taking control of a bridge no longer restricts it to OpenFlow 1.1, which broke the VIF locking flows XAPI installs with OpenFlow 1.0, and the bridges an older version restricted get OpenFlow 1.0 back (PR [#10691](https://github.com/vatesfr/xen-orchestra/pull/10691))
- [REST API/SDN Controller] A traffic rule can no longer be given the priority 0, which XAPI reserves, in `add_traffic_rule`, `update_traffic_rule` and the JSON-RPC methods `sdnController.addRule` and `sdnController.addNetworkRule`; a rule that already has it can still be deleted, or updated to another priority (PR [#10738](https://github.com/vatesfr/xen-orchestra/pull/10738))
- [Pages] The page header and tabs now stay in place on every page: dashboards, System and General tabs, consoles, settings and creation forms scroll under them instead of scrolling with them (PR [#10822](https://github.com/vatesfr/xen-orchestra/pull/10822))
- [Tooltips] Short tooltips near the edge of the screen no longer wrap onto two lines (PR [#10822](https://github.com/vatesfr/xen-orchestra/pull/10822))
- [SDN Controller] Adding, updating or deleting a VIF or network traffic rule now fails, and its rules are left as they were, when the host can't apply it (e.g. the XAPI plugin fails), instead of reporting success (PR [#10691](https://github.com/vatesfr/xen-orchestra/pull/10691))
- [Plugins] Plugin settings descriptions keep their line breaks and links instead of showing HTML tags as text (e.g. auth-saml signature settings, backup-reports test) (PR [#10825](https://github.com/vatesfr/xen-orchestra/pull/10825))
- [REST API] `GET /rest/v0/tasks/{id}?wait=true` now returns when a backup, metadata backup or restore ends, instead of waiting until the task is interrupted (PR [#10778](https://github.com/vatesfr/xen-orchestra/pull/10778))
- [Backups] A backup job that fails as a whole is now marked as failed in its task, instead of staying pending until XO restarts (PR [#10778](https://github.com/vatesfr/xen-orchestra/pull/10778))
- [REST API/Tasks] Aborting a running backup task that can't be aborted now fails with `forbidden operation` instead of `no such task` (with `sync=true`: 403 instead of 404) (PR [#10778](https://github.com/vatesfr/xen-orchestra/pull/10778))
- [Servers] Fix a pool disappearing from XO, its server stuck in "connecting" until it is disabled and enabled again, after a short network interruption (PR [#10814](https://github.com/vatesfr/xen-orchestra/pull/10814))
- [XO6] Searchable dropdown lists no longer overflow the screen on mobile (PR [#10854](https://github.com/vatesfr/xen-orchestra/pull/10854))
- [VM] In the VM creation form, a template without network interface now gets one by default, like in XO 5: one on each automatic network of the pool, or on its management network (PR [#10863](https://github.com/vatesfr/xen-orchestra/pull/10863))
- [VDIs] The storage link of a VDI, in its side panel and on its page, opens the storage repository page of XO 6 instead of XO 5 (PR [#10864](https://github.com/vatesfr/xen-orchestra/pull/10864))
- [Forms] Dropdown lists with nothing selected show their placeholder (e.g. _Select a storage_ in the VM migration form) instead of staying empty (PR [#10882](https://github.com/vatesfr/xen-orchestra/pull/10882))
- [Side panels] Closing a side panel in one browser tab no longer closes it in the other tabs, where the eye buttons stopped working (PR [#10869](https://github.com/vatesfr/xen-orchestra/pull/10869))
- [Tables] The "Show more"/"Show less" button of long texts stays at the top right of the cell, and expanding every text of a column no longer squeezes it to one letter per line (PR [#10873](https://github.com/vatesfr/xen-orchestra/pull/10873))
- [Treeview] The treeview scrollbar can be dragged again: the resize handle, which covered it, now sits just outside the treeview (PR [#10886](https://github.com/vatesfr/xen-orchestra/pull/10886))

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
- @xen-orchestra/backups minor
- @xen-orchestra/lite patch
- @xen-orchestra/qa-test patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/vmware-explorer minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi major
- xen-api major
- xo-collection major
- xo-server minor
- xo-server-audit minor
- xo-server-load-balancer patch
- xo-server-sdn-controller minor
- xo-web minor

<!--packages-end-->
