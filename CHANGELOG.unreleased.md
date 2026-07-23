> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

- xo-server : Permissions were ignored for some pool functions ([#10093](https://github.com/vatesfr/xen-orchestra/pull/10093))
- [Users/Create] Removed default user's password from the logs during account creation (PR [#10094](https://github.com/vatesfr/xen-orchestra/pull/10094))
- [Security] Serve a default `Content-Security-Policy` to mitigate cross-site scripting and related attacks. It can be extended or disabled through the `http.helmet` configuration (PR [#10101](https://github.com/vatesfr/xen-orchestra/pull/10101))

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- **RBAC** check for REST API endpoints:
  - `/pools/:id/actions/create_bonded_network` (PR [#9891](https://github.com/vatesfr/xen-orchestra/pull/9891))
  - `/pools/:id/actions/create_internal_network` (PR [#9891](https://github.com/vatesfr/xen-orchestra/pull/9891))
  - `/pools/:id/actions/management-reconfigure` (PR [#9891](https://github.com/vatesfr/xen-orchestra/pull/9891))
- [REST API] Possibility of sending `autoEnable` in the body of the `/hosts/:id/actions/disable` endpoint (PR [#10040](https://github.com/vatesfr/xen-orchestra/pull/10040))
- [REST API] `PATCH /rest/v0/vdis/{id}` to update a VDI's name, description and size (PR [#9945](https://github.com/vatesfr/xen-orchestra/pull/9945))
- [Pool] XO now reconnects to a surviving pool member when the master becomes unreachable (e.g. HA promoted a new master after the old one died), instead of staying stuck on the dead master, including after an XO restart (PR [#10016](https://github.com/vatesfr/xen-orchestra/pull/10016))
- [XO6/VIF] Add possibility to create VIF from network tab in VM page (PR [#9677](https://github.com/vatesfr/xen-orchestra/pull/9677))
- [vm stats] Reduce the memory consumption of the rrd stats (PR [#10039](https://github.com/vatesfr/xen-orchestra/pull/10039))
- [XO6/Host] Add possibilty to enable or disable an host (PR [#10074](https://github.com/vatesfr/xen-orchestra/pull/10074))
- [XO6/Site] Add "Connect pool" action to the site infrastructure tree (PR [#10047](https://github.com/vatesfr/xen-orchestra/pull/10047))
- [VM]: Add possibility to duplicate a VM (PR [#9580](https://github.com/vatesfr/xen-orchestra/pull/9580))
- [RPU] Trace rolling pool updates/reboots to disk to allow diagnosis even after xo-server restarts (PR [#10078](https://github.com/vatesfr/xen-orchestra/pull/10078))
- [XO6/VM] Group VM power actions in a new "Change state" submenu and isolate the Delete action (PR [#10036](https://github.com/vatesfr/xen-orchestra/pull/10036))
- [OpenMetrics] Add an estimated per-VM power consumption metric (`xcp_vm_power_consumption_watts`), splitting each host's IPMI power across its running VMs proportionally to CPU load (PR [#10031](https://github.com/vatesfr/xen-orchestra/pull/10031))
- [XO6/VM] Add possibility to export a VM (PR [#9989](https://github.com/vatesfr/xen-orchestra/pull/9989))
- [Rolling Pool Update/Reboot] Re-check that each host can still be evacuated right before evacuating it, to fail early with an explicit error (PR [#10097](https://github.com/vatesfr/xen-orchestra/pull/10097))
- [XO6/VM] Add "New VM" button on Host view (PR [#10048](https://github.com/vatesfr/xen-orchestra/pull/10048))
- [xo-server] expose more metrics when doing a memory dump (PR [#10041](https://github.com/vatesfr/xen-orchestra/pull/10041))
- [RPU] Re-enable the load balancer after a configurable safe delay (30 minutes by default) when a rolling pool update ends (PR [#10111](https://github.com/vatesfr/xen-orchestra/pull/10111))
- [Tasks] Resolve objects in tasks names [Forum#100894](https://xcp-ng.org/forum/post/100894) (PR [#9830](https://github.com/vatesfr/xen-orchestra/pull/9830))
- [REST API] Possibility to set the HA restart priority (`high_availability`) when creating a VM (PR [#10070](https://github.com/vatesfr/xen-orchestra/pull/10070))
- [XO6/Traffic rules] Show only traffic rules of VMs. Don't include vm-snapshots or vm-templates. In the VM selector, disable VMs that don't have any VIF (PR [#9977](https://github.com/vatesfr/xen-orchestra/pull/9977))
- [Pool] Add new VM and disconnect actions to the pool infrastructure tree (PR [#10046](https://github.com/vatesfr/xen-orchestra/pull/10046))
- [REST API] Expose `/rest/v0/groups/:id/acl-roles` (PR [#10085](https://github.com/vatesfr/xen-orchestra/pull/10085))
- [XO server] Add `aclRoleIds` property to the `group` objects (PR [#10085](https://github.com/vatesfr/xen-orchestra/pull/10085))
- [XO server] Add `groupIds`, `userIds` and `privilegeIds` properties to the `acl-role` objects (PR [#10085](https://github.com/vatesfr/xen-orchestra/pull/10085))
- [REST API] Expose `/rest/v0/acl-roles/:id/users` (PR [#10085](https://github.com/vatesfr/xen-orchestra/pull/10085))
- [REST API] Expose `/rest/v0/acl-roles/:id/groups` (PR [#10085](https://github.com/vatesfr/xen-orchestra/pull/10085))
- [XO6] Fix some design inconsistency between pages (PR [#10109](https://github.com/vatesfr/xen-orchestra/pull/10109))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Backup/Remotes] Listing backup repositories is no longer slowed down by an unreachable one: a broken repository is now served from cache and retried in the background instead of timing out on every refresh (PR [#10025](https://github.com/vatesfr/xen-orchestra/pull/10025))
- [XO6] Fix negative "other" value in backup repository dashboard (PR [#10044](https://github.com/vatesfr/xen-orchestra/pull/10044))
- [Backups] Fix missing transfer size (PR [#10106](https://github.com/vatesfr/xen-orchestra/pull/10106))
- [Host/dashboard] Switch CPU and RAM panels order to match Pool dashboard layout (PR [#10059](https://github.com/vatesfr/xen-orchestra/pull/10059))
- [RPU] Fix `The updater plugin is busy` error making the update fail right after the "Updating LINSTOR packages" step (PR [#10115](https://github.com/vatesfr/xen-orchestra/pull/10115))
- [Plugins/Perf-alert] Update URL generation to support V6 routing (PR [#10054](https://github.com/vatesfr/xen-orchestra/pull/10054))
- [Rolling Pool Update/Reboot] Temporarily disable VMs auto power on during the run: unexpected VM starts on rebooted hosts could break the remaining host evacuations (`HOST_NOT_ENOUGH_FREE_MEMORY`) (PR [#10104](https://github.com/vatesfr/xen-orchestra/pull/10104))
- [Rolling Pool Update] Fix "Updating LINSTOR packages" subtask progress going over 100% (PR [#XXXX](https://github.com/vatesfr/xen-orchestra/pull/XXXX))
- [Backups] Fix EEXIST issue when recreating backup in VhdDirectory after crash (PR [#10139](https://github.com/vatesfr/xen-orchestra/pull/10139))
- [Backups] Fix failed status on successful retry [Forum#12366](https://xcp-ng.org/forum/topic/12366) (PR [#10129](https://github.com/vatesfr/xen-orchestra/pull/10129))
- [Host] Successful evacuation signature fallbacks on older XAPI versions are no longer logged as warnings (PR [#10131](https://github.com/vatesfr/xen-orchestra/pull/10131))
- [Backups] write the complete disk metadata at once to improve compatibility with immutable backup repository (PR [#10104](https://github.com/vatesfr/xen-orchestra/pull/10104))
- [XO6/Host] Wrap the Network name in the PIF side panel (PR [#10155](https://github.com/vatesfr/xen-orchestra/pull/10155))

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
- @xen-orchestra/backup-archive minor
- @xen-orchestra/backups patch
- @xen-orchestra/disk-cli minor
- @xen-orchestra/disk-transform patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- vhd-lib patch
- xapi-explore-sr patch
- xen-api minor
- xo-server minor
- xo-server-openmetrics minor
- xo-server-perf-alert patch

<!--packages-end-->
