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

- [REST API] Get the state of a proxy appliance updater: `GET /rest/v0/proxies/:id/appliance_updater_state` (PR [#10773](https://github.com/vatesfr/xen-orchestra/pull/10773))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Light theme] Danger backgrounds (selected, hover and active) use the lighter red tints of the design system (PR [#10891](https://github.com/vatesfr/xen-orchestra/pull/10891))
- [Dark mode] Selected, hovered and pressed backgrounds of danger elements (buttons, tags, chips, toasters…) are darker, as designed, so their text is easier to read (PR [#10888](https://github.com/vatesfr/xen-orchestra/pull/10888))
- [Backups/Merge] The background merge no longer crashes with `ENAMETOOLONG` when a VM's backups are locked by another job: it waits 5 minutes before trying again instead of retrying in a loop (PR [#10866](https://github.com/vatesfr/xen-orchestra/pull/10866))
- [V2V] When the import of a disk fails before its transfer starts, the task shows the reason given by the migration engine (e.g. `could not connect: timed out`) instead of `stream has ended without data, was looking for 8 bytes` (PR [#10842](https://github.com/vatesfr/xen-orchestra/pull/10842))
- [XO6] A PIF can no longer be set as the management PIF when its network MTU is not 1500, which XCP-ng does not support on management interfaces (PR [#10905](https://github.com/vatesfr/xen-orchestra/pull/10905))
- [XO6] A VM converted into a template no longer stays in the VM list and treeview, contribution by [@pcbeingused333](https://github.com/pcbeingused333), fixes issue [#10717](https://github.com/vatesfr/xen-orchestra/issues/10717) (PR [#10884](https://github.com/vatesfr/xen-orchestra/pull/10884))
- [VDIs] The used space of a VDI now includes its whole snapshot chain instead of only its last layer, which was almost 0 for disks with snapshots (e.g. after backups). As it can exceed the disk size, it is shown as a size, without usage bar or free space (PR [#10902](https://github.com/vatesfr/xen-orchestra/pull/10902))
- [XO6/Backup jobs] Remove the Target proxy field from the mirror backup job form (PR [#10914](https://github.com/vatesfr/xen-orchestra/pull/10914))
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
- [xo-server] Fix every pool showing as disconnected after running `xo-server-db` or `xo-server-recover-account`, even though XO was still connected to them (PR [#10834](https://github.com/vatesfr/xen-orchestra/pull/10834))
- [xo-server] Fix a server that could no longer be enabled (`incorrect state`) until xo-server was restarted (PR [#10834](https://github.com/vatesfr/xen-orchestra/pull/10834))

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
- @xen-orchestra/backups patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/vmware-explorer minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xen-api minor
- xo-collection patch
- xo-server minor
- xo-server-audit minor
- xo-server-load-balancer patch
- xo-server-sdn-controller patch
- xo-web minor

<!--packages-end-->
