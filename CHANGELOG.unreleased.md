> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

- xo-server : Permissions were ignored for some pool functions ([#10093](https://github.com/vatesfr/xen-orchestra/pull/10093))
- [Users/Create] Removed default user's password from the logs during account creation (PR [#10094](https://github.com/vatesfr/xen-orchestra/pull/10094))

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
- [XO6/Site] Add "New VM" and "Connect pool" actions to the site infrastructure tree (PR [#10047](https://github.com/vatesfr/xen-orchestra/pull/10047))
- [VM]: Add possibility to duplicate a VM (PR [#9580](https://github.com/vatesfr/xen-orchestra/pull/9580))
- [RPU] Trace rolling pool updates/reboots to disk to allow diagnosis even after xo-server restarts (PR [#10078](https://github.com/vatesfr/xen-orchestra/pull/10078))
- [XO6/VM] Group VM power actions in a new "Change state" submenu and isolate the Delete action (PR [#10036](https://github.com/vatesfr/xen-orchestra/pull/10036))
- [OpenMetrics] Add an estimated per-VM power consumption metric (`xcp_vm_power_consumption_watts`), splitting each host's IPMI power across its running VMs proportionally to CPU load (PR [#10031](https://github.com/vatesfr/xen-orchestra/pull/10031))
- [XO6/VM] Add possibility to export a VM (PR [#9989](https://github.com/vatesfr/xen-orchestra/pull/9989))
- [Rolling Pool Update/Reboot] Re-check that each host can still be evacuated right before evacuating it, to fail early with an explicit error (PR [#10097](https://github.com/vatesfr/xen-orchestra/pull/10097))
- [XO6/VM] Add "New VM" button on Host view (PR [#10048](https://github.com/vatesfr/xen-orchestra/pull/10048))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Backup/Remotes] Listing backup repositories is no longer slowed down by an unreachable one: a broken repository is now served from cache and retried in the background instead of timing out on every refresh (PR [#10025](https://github.com/vatesfr/xen-orchestra/pull/10025))
- [XO6] Fix negative "other" value in backup repository dashboard (PR [#10044](https://github.com/vatesfr/xen-orchestra/pull/10044))
- [Backups] Fix missing transfer size (PR [#10106](https://github.com/vatesfr/xen-orchestra/pull/10106))
- [Host/dashboard] Switch CPU and RAM panels order to match Pool dashboard layout (PR [#10059](https://github.com/vatesfr/xen-orchestra/pull/10059))
- [Plugins/Perf-alert] Update URL generation to support V6 routing (PR [#10054](https://github.com/vatesfr/xen-orchestra/pull/10054))
- [Rolling Pool Update/Reboot] Temporarily disable VMs auto power on during the run: unexpected VM starts on rebooted hosts could break the remaining host evacuations (`HOST_NOT_ENOUGH_FREE_MEMORY`) (PR [#10104](https://github.com/vatesfr/xen-orchestra/pull/10104))

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

- xo-server patch
- @vates/types minor
- @xen-orchestra/backup-archive patch
- @xen-orchestra/disk-transform patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web patch
- @xen-orchestra/web-core minor
- vhd-lib patch
- xapi-explore-sr patch
- xen-api minor
- xo-server minor
- xo-server-openmetrics minor
- xo-server-perf-alert patch

<!--packages-end-->
