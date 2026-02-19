> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [OpenMetrics] Add `is_control_domain` label to VM metrics to differentiate dom0 VMs from regular VMs (PR [#9474](https://github.com/vatesfr/xen-orchestra/pull/9474))
- [OpenMetrics] Add `xcp_host_status` metric exposing host status (running/maintenance/halted/unknown) for all hosts, including non-running ones (PR [#9457](https://github.com/vatesfr/xen-orchestra/pull/9457))
- [REST API] Add `objectType` to tasks for resolved object references (PR [#9429](https://github.com/vatesfr/xen-orchestra/pull/9429))
- [Warm Migration] the api call now return the new VM uuid (PR [#94653](https://github.com/vatesfr/xen-orchestra/pull/9465))
- [Warm Migration] stopped VM can be warm migrated (PR [#94653](https://github.com/vatesfr/xen-orchestra/pull/9465))
- [Plugins/load balancer] Add configurable VM migration cooldown to prevent oscillation (default 30min) (PR [#9388](https://github.com/vatesfr/xen-orchestra/pull/9388))
- [REST API] Expose `POST /rest/v0/vms/:id/actions/migrate` to migrate a VM (PR [#9414](https://github.com/vatesfr/xen-orchestra/pull/9414))
- [Netbox] Support version 4.5.x (PR [#9445](https://github.com/vatesfr/xen-orchestra/pull/9445))
- [OpenMetrics] Add host uptime metric (`xcp_host_uptime_seconds`) (PR [#9449](https://github.com/vatesfr/xen-orchestra/pull/9449))
- **XO 5:**
  - [V2V] Remember connection settings in the browser (PR [#9490](https://github.com/vatesfr/xen-orchestra/pull/9490))

- [V2V] Automatically take a snapshot if a running VM doesn't have any (PR [#9471](https://github.com/vatesfr/xen-orchestra/pull/9471))
- [Storage] Add possibility to create VDI in qcow2 format if size > 2TB - 8KB (PR [#9493](https://github.com/vatesfr/xen-orchestra/pull/9493))
- [Backups] Improve VHD dist handling an rework disk merge (delta backups) (PR [#9300](https://github.com/vatesfr/xen-orchestra/pull/9300))
- [REST API] Added POST `/pbds/{id}/actions/plug` and `/pbds/{id}/actions/unplug` rest routes (PR [#9477](https://github.com/vatesfr/xen-orchestra/pull/9477))
- [Backup] Implement Distributed storage for Backups, Mirror Backups and Replications(PR [#9433](https://github.com/vatesfr/xen-orchestra/pull/9433))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [HUB Recipe] A bug in the Pyrgos recipe requires to remove the DHCP option of the recipe form (PR [#9454](https://github.com/vatesfr/xen-orchestra/pull/9454))
- [OpenMetrics] Fix ECONNREFUSED on IPv6-only systems by binding to `localhost` instead of `127.0.0.1` (PR [#9489](https://github.com/vatesfr/xen-orchestra/pull/9489))
- [REST API] Exclude removable and ISO storage from top 5 SRs usage (PR [#9495](https://github.com/vatesfr/xen-orchestra/pull/9495))
- [xo-server-sdn-controller] traffic rules robustness (PR [#9442](https://github.com/vatesfr/xen-orchestra/pull/9442))
- [Backup] Fix error during backup and health check (PR [#9508](https://github.com/vatesfr/xen-orchestra/pull/9508))
- [VM/Import] Fix unnecessary `Xapi#putResource /import missing length` (PR [#9516](https://github.com/vatesfr/xen-orchestra/pull/9516))

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
- @xen-orchestra/fs patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/vmware-explorer minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xen-api patch
- xo-server minor
- xo-server-load-balancer minor
- xo-server-netbox minor
- xo-server-openmetrics minor
- xo-server-sdn-controller patch
- xo-web minor

<!--packages-end-->
