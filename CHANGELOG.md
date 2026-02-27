# ChangeLog

## **6.2.1 ** (2026-02-27)

<img id="latest" src="https://badgen.net/badge/channel/latest/yellow" alt="Channel: latest" />

### Bug fixes

- [backups] Fix race condition on merge (PR [#9542](https://github.com/vatesfr/xen-orchestra/pull/9542))

### Released packages

- @xen-orchestra/backups 0.69.2
- @xen-orchestra/proxy 0.29.49
- xo-server 5.197.3

## **6.2.0** (2026-02-26)

### Highlights

- [OpenMetrics] Add `is_control_domain` label to VM metrics to differentiate dom0 VMs from regular VMs (PR [#9474](https://github.com/vatesfr/xen-orchestra/pull/9474))
- [OpenMetrics] Add `xcp_host_status` metric exposing host status (running/maintenance/halted/unknown) for all hosts, including non-running ones (PR [#9457](https://github.com/vatesfr/xen-orchestra/pull/9457))
- [OpenMetrics] Add host uptime metric (`xcp_host_uptime_seconds`) (PR [#9449](https://github.com/vatesfr/xen-orchestra/pull/9449))
- [Plugins/load balancer] Add configurable VM migration cooldown to prevent oscillation (default 30min) (PR [#9388](https://github.com/vatesfr/xen-orchestra/pull/9388))
- [MCP] Initial release of `@xen-orchestra/mcp`: MCP server enabling AI assistants to query XO infrastructure (pools, hosts, VMs, dashboard, documentation) (PR [#9519](https://github.com/vatesfr/xen-orchestra/pull/9519))
- [Backup] Implement Distributed storage for Backups, Mirror Backups and Replications(PR [#9433](https://github.com/vatesfr/xen-orchestra/pull/9433))
- [V2V] Automatically take a snapshot if a running VM doesn't have any (PR [#9471](https://github.com/vatesfr/xen-orchestra/pull/9471))

- **REST API:**
  - [REST API] Added POST `/pbds/{id}/actions/plug` and `/pbds/{id}/actions/unplug` rest routes (PR [#9477](https://github.com/vatesfr/xen-orchestra/pull/9477))
  - [REST API] Expose `POST /vdis` to create a VDI (PR [#9492](https://github.com/vatesfr/xen-orchestra/pull/9492))
  - [REST API] Expose `POST /rest/v0/vms/:id/actions/migrate` to migrate a VM (PR [#9414](https://github.com/vatesfr/xen-orchestra/pull/9414))

- **XO 5:**
  - [Network] Ability to switch management PIF (PRs [#9369](https://github.com/vatesfr/xen-orchestra/pull/9369) [#9510](https://github.com/vatesfr/xen-orchestra/pull/9510))
  - [Licenses] Display bundle name next to license name (PR [#9512](https://github.com/vatesfr/xen-orchestra/pull/9512))
  - [V2V] Remember connection settings in the browser (PR [#9490](https://github.com/vatesfr/xen-orchestra/pull/9490))

- **XO 6:**
  - [i18n] Add Chinese (Simplified Han script) and update Czech, German, Italian, Korean and Dutch translations (PR [#9462](https://github.com/vatesfr/xen-orchestra/pull/9462))
  - [VM/New] Add the ability to pass a cloud-init config (PR [#9427](https://github.com/vatesfr/xen-orchestra/pull/9427))
  - [VM/New] Added SSH key field (PR [#9413](https://github.com/vatesfr/xen-orchestra/pull/9413))
  - [Search Engine] Implement first version of the Query Builder on Pools, Hosts, VMs, networks and Storage tables (PR [#9488](https://github.com/vatesfr/xen-orchestra/pull/9488))
  - [Header] Add a banner when the connection to the xo server fails (PR [#9375](https://github.com/vatesfr/xen-orchestra/pull/9375))

### Enhancements

- [Warm Migration] the api call now return the new VM uuid (PR [#94653](https://github.com/vatesfr/xen-orchestra/pull/9465))
- [Warm Migration] stopped VM can be warm migrated (PR [#94653](https://github.com/vatesfr/xen-orchestra/pull/9465))
- [Netbox] Support version 4.5.x (PR [#9445](https://github.com/vatesfr/xen-orchestra/pull/9445))
- [Storage] Add possibility to create VDI in qcow2 format if size > 2TB - 8KB (PR [#9493](https://github.com/vatesfr/xen-orchestra/pull/9493))
- [Backups] Improve VHD dist handling an rework disk merge (delta backups) (PR [#9300](https://github.com/vatesfr/xen-orchestra/pull/9300))
- [Host] Add persistent option to `host.disable` to persist across host reboots (PR [#9503](https://github.com/vatesfr/xen-orchestra/pull/9503))

- **REST API:**
  - [REST API] Added POST `/srs/{id}/actions/reclaim_space` rest route (PR [#9486](https://github.com/vatesfr/xen-orchestra/pull/9486))
  - [REST API] Add `objectType` to tasks for resolved object references (PR [#9429](https://github.com/vatesfr/xen-orchestra/pull/9429))
  - [REST API] Added POST `/srs/{id}/actions/scan` rest routes (PR [#9514](https://github.com/vatesfr/xen-orchestra/pull/9514))

- **XO 5:**
  - [Patches] Warn about updating XOSTOR before installing patches (PR [#9517](https://github.com/vatesfr/xen-orchestra/pull/9517))

### Bug fixes

- [HUB Recipe] A bug in the Pyrgos recipe requires to remove the DHCP option of the recipe form (PR [#9454](https://github.com/vatesfr/xen-orchestra/pull/9454))
- [OpenMetrics] Fix ECONNREFUSED on IPv6-only systems by binding to `localhost` instead of `127.0.0.1` (PR [#9489](https://github.com/vatesfr/xen-orchestra/pull/9489))
- [REST API] Exclude removable and ISO storage from top 5 SRs usage (PR [#9495](https://github.com/vatesfr/xen-orchestra/pull/9495))
- [xo-server-sdn-controller] traffic rules robustness (PR [#9442](https://github.com/vatesfr/xen-orchestra/pull/9442))
- [Backups] Fix error during backup and health check (PR [#9508](https://github.com/vatesfr/xen-orchestra/pull/9508))
- [Backups] remove the `cleanVm: incorrect backup size in metadata` error (PR [#9527](https://github.com/vatesfr/xen-orchestra/pull/9527))

### Released packages

- @xen-orchestra/fs 4.6.7
- @xen-orchestra/backups-cli 1.1.8
- @xen-orchestra/immutable-backups 1.0.30
- @xen-orchestra/vmware-explorer 0.11.0
- xo-server-load-balancer 0.12.0
- xo-server-netbox 1.11.0
- xo-server-openmetrics 1.2.0
- xo-server-sdn-controller 1.2.1
- @xen-orchestra/backups 0.69.1
- complex-matcher 1.1.0
- @xen-orchestra/proxy 0.29.48
- xo-web 5.194.0
- @vates/types 1.21.0
- @xen-orchestra/rest-api 0.27.0
- xo-server 5.197.2
- @xen-orchestra/web-core 0.45.0
- @xen-orchestra/mcp 1.0.1
- @xen-orchestra/web 0.43.0

## **6.1.2** (2026-02-10)

<img id="stable" src="https://badgen.net/badge/channel/stable/green" alt="Channel: stable" />

### Bug fixes

- [xo-server] Force delete a running VM now bypass `hard_shutdown` blocked operations (PR [#9473](https://github.com/vatesfr/xen-orchestra/pull/9473))
- [Backup] Ensure VM created by healthcheck are removed by backup process (PR [#9473](https://github.com/vatesfr/xen-orchestra/pull/9473))

### Released packages

- @xen-orchestra/xapi 8.6.6
- @xen-orchestra/backups 0.68.2
- @xen-orchestra/proxy 0.29.46
- xo-server 5.196.3

## **6.1.1** (2026-02-05)

<img id="latest" src="https://badgen.net/badge/channel/latest/yellow" alt="Channel: latest" />

### Enhancements

- [Settings] Add various themes (PR [#9387](https://github.com/vatesfr/xen-orchestra/pull/9387))
- [VM] Add delete and snapshot buttons to manage VM (PR [9410](https://github.com/vatesfr/xen-orchestra/pull/9410))
- [Site] Update dashboard with new info from endpoint (PR [#8964](https://github.com/vatesfr/xen-orchestra/pull/8964))
- [i18n] Update Czech, Danish, German, Spanish, Persian, Finnish, Italian, Japanese, Korean, Norwegian, Polish, Dutch, Portuguese (Brasil), Russian, Swedish and Ukrainian translations (PR [#9440](https://github.com/vatesfr/xen-orchestra/pull/9440))
- [REST API] Added POST `/vifs` and DELETE `/vifs/:id` rest routes (PR [#9393](https://github.com/vatesfr/xen-orchestra/pull/9393))

### Bug fixes

- [REST API] Close SSE connections when clients are too slow, to avoid increased memory consumption (PR [#9439](https://github.com/vatesfr/xen-orchestra/pull/9439))
- [REST API] `message` objects are no longer sent via the SSE when subscribing to the`alarm` collection (PR [#9439](https://github.com/vatesfr/xen-orchestra/pull/9439))
- [REST API] Do no longer create an `XO user authentication` task, when using an authentication token (PR [#9439](https://github.com/vatesfr/xen-orchestra/pull/9439))
- [Backup] ensure no snapshot are left unattended after a job (PR [#9434](https://github.com/vatesfr/xen-orchestra/pull/9434))
- [Backup] Fix replication leaving replica after partial incremental replication (PR [#9435](https://github.com/vatesfr/xen-orchestra/pull/9435))
- [REST API] Fix ISO not mounted when creating a VM from `/pools/:id/actions/create_vm` (PR [#9461](https://github.com/vatesfr/xen-orchestra/pull/9461))
- [REST API] Fix href path for backup-archives (PR [#9460](https://github.com/vatesfr/xen-orchestra/pull/9460))
- [REST API/Pool/Dashboard] Only consider running VMs for the `cpuProvisioning.assigned` value [Forum#11604](https://xcp-ng.org/forum/topic/11604/xo-6-dedicated-thread-for-all-your-feedback/84) (PR [#9456](https://github.com/vatesfr/xen-orchestra/pull/9456))
- [CopyButton] Fix copy to clipboard not working in non-HTTPS environments (PR [#9426](https://github.com/vatesfr/xen-orchestra/pull/9426))
- [Backup/immutability] Fix typo in sample config file (PR [#9444](https://github.com/vatesfr/xen-orchestra/pull/9444))
- [Host] Fix host dashboard CPU provisioning calculation [Forum#101359](https://xcp-ng.org/forum/topic/11604/xo-6-dedicated-thread-for-all-your-feedback/84) (PR [#9459](https://github.com/vatesfr/xen-orchestra/pull/9459))

### Released packages

- @vates/types 1.19.0
- @xen-orchestra/backups 0.68.1
- @xen-orchestra/immutable-backups 1.0.29
- @xen-orchestra/web-core 0.42.0
- @xen-orchestra/rest-api 0.24.1
- @xen-orchestra/web 0.40.0
- @xen-orchestra/fs 4.6.6
- @xen-orchestra/proxy 0.29.45
- xo-server 5.196.2

## **6.1.0** (2026-01-29)

### Highlights

- [i18n] Add Finnish, Polish and update Czech, Danish, German, Spanish, Persian, Italian, Japanese, Korean, Norwegian, Dutch, Portuguese (Brasil), Russian, Swedish and Ukrainian translations (PR [#9330](https://github.com/vatesfr/xen-orchestra/pull/9330))
- [VM] Add all actions to manage VM life cycle (PR [#9403](https://github.com/vatesfr/xen-orchestra/pull/9403))
- [Backup] show the backup archive that will be kept for Long Term Retention (PR [#9364](https://github.com/vatesfr/xen-orchestra/pull/9364))
- [OpenMetrics] Expose SR capacity metrics: `xcp_sr_virtual_size_bytes`, `xcp_sr_physical_size_bytes`, `xcp_sr_physical_usage_bytes` (PR [#9360](https://github.com/vatesfr/xen-orchestra/pull/9360))
- [Backup] Fix `read xxx bytes, maximum size allowed is yyy` for full backup on S3 (PR [#9396](https://github.com/vatesfr/xen-orchestra/pull/9396))
- [Backup] Fix disk export stuck at 99% (PR [#9407](https://github.com/vatesfr/xen-orchestra/pull/9407))
- [VM/New] Added VTPM support (PR [#9389](https://github.com/vatesfr/xen-orchestra/pull/9389))
- [REST API] Add endpoints to reconfigure management interface for hosts and pools (PR [#9369](https://github.com/vatesfr/xen-orchestra/pull/9369))
- [REST API] Add `POST /vbds` endpoint to create a VBD (attach a VDI to a VM) (PR [#9391](https://github.com/vatesfr/xen-orchestra/pull/9391))
- [REST API] Add `createVtpm` parameter to VM creation endpoint (PR [#9412](https://github.com/vatesfr/xen-orchestra/pull/9412))
- [REST API] Add `secureBoot` parameter to VM creation endpoint (PR [#9417](https://github.com/vatesfr/xen-orchestra/pull/9417))
- [REST API] Add `DELETE /vbds/{id}` endpoint to remove a VBD (PR [#9394](https://github.com/vatesfr/xen-orchestra/pull/9394))
- [REST API] Add `POST /vbds/:id/actions/connect` and `POST /vbds/:id/actions/disconnect` endpoints to hotplug/unplug VBDs from running VMs (PR [#9399](https://github.com/vatesfr/xen-orchestra/pull/9399))
- [REST API] Add `POST /vdis/:id/actions/migrate` endpoint to migrate a VDI to another SR (PR [#9408](https://github.com/vatesfr/xen-orchestra/pull/9408))
- [TreeView] Scroll to current item in list view (PR [#9268](https://github.com/vatesfr/xen-orchestra/pull/9268))
- [SIDEPANEL] Remove text ellipsis on sides panel (PR [#9328](https://github.com/vatesfr/xen-orchestra/pull/9238))
- [Icons] Update icons to use new styles (PR [#8989](https://github.com/vatesfr/xen-orchestra/pull/8989) and PR [#9424](https://github.com/vatesfr/xen-orchestra/pull/9424))

### Security

- [Backups] Update node-tar dependency to handle CVE-2026-23745 (PR [#9406](https://github.com/vatesfr/xen-orchestra/pull/9406))

### Enhancements

- [REST API] Update `/dashboard` endpoint to also return disconnected servers, disabled hosts, the status of all VMs, and compute `jobs` from the last seven days (PR [#9207](https://github.com/vatesfr/xen-orchestra/pull/9207))
- [vhd-cli] Prevent using invalid options (PR [#9386](https://github.com/vatesfr/xen-orchestra/pull/9386))
- [VM] Add "Change state" button on VM view (PR [#9317](https://github.com/vatesfr/xen-orchestra/pull/9317))
- [V2V] Add endpoint to export one disk from Vmware to VHD or QCOW2 `VDI_IO_ERROR` (PR [#9411](https://github.com/vatesfr/xen-orchestra/pull/9411))

### Bug fixes

- [REST API] Fix `/vms/:id/dashboard` _cannot read properties of undefined (reading 'id')_ (PR [#9380](https://github.com/vatesfr/xen-orchestra/pull/9380))
- [REST API] `vms/:id/dashboard` return now an empty object for the `replication` key instead of undefined (in case of no replication) (PR [#9380](https://github.com/vatesfr/xen-orchestra/pull/9380))
- [REST API] `vms/:id/dashboard` rename `not-in-job` into `not-in-active-job` for the `vmProtection` key to avoid confusion (PR [#9380](https://github.com/vatesfr/xen-orchestra/pull/9380))
- [REST API] Don't return VDI-snapshot for `/vms/:id/vdis` endpoints (PR [#9381](https://github.com/vatesfr/xen-orchestra/pull/9381))
- [Plugins/Backup-reports] Prevent succesful backups from occasionally being reported as interrupted [Forum#11721](https://xcp-ng.org/forum/topic/11721) (PR [#9400](https://github.com/vatesfr/xen-orchestra/pull/9400))
- [REST API] `/dashboard` return now `{isEmpty: true}` instead of undefined in case there is no data to compute (PR [#9395](https://github.com/vatesfr/xen-orchestra/pull/9395))
- [OpenMetrics] Add missing `sr_name` label to VM disk metrics (PR [#9353](https://github.com/vatesfr/xen-orchestra/pull/9353))
- [REST API] Fix `/vms/:id/actions/start` ignored request body (to start a virtual machine on a specific host) (PR [#9416](https://github.com/vatesfr/xen-orchestra/pull/9416))
- [Backup] Fix reverted VM making the next backup run fails with `VM must be a snapshot` error (PR [#9397](https://github.com/vatesfr/xen-orchestra/pull/9397))
- [Sidebar] Removal borders top and right of sidebar in mobile (PR [#9366](https://github.com/vatesfr/xen-orchestra/pull/9366))
- [V2V] Fix `VDI_IO_ERROR` when importing some unaligned disks into a qcow2 storage (PR [#9411](https://github.com/vatesfr/xen-orchestra/pull/9411))
- [New/SR] Fix `Require "-o" along with xe-mount-iso-sr` error during NFS ISO SR creation (PR [#9425](https://github.com/vatesfr/xen-orchestra/pull/9425))

### Released packages

- vhd-lib 4.14.7
- @xen-orchestra/qcow2 1.1.2
- @xen-orchestra/backups 0.68.0
- @xen-orchestra/backups-cli 1.1.7
- @xen-orchestra/immutable-backups 1.0.28
- xo-server-openmetrics 1.1.0
- xo-web 5.192.0
- @vates/nbd-client 3.2.3
- @vates/types 1.18.0
- @xen-orchestra/xapi 8.6.5
- @xen-orchestra/web-core 0.41.0
- @xen-orchestra/proxy 0.29.43
- @xen-orchestra/rest-api 0.24.0
- @xen-orchestra/web 0.39.0
- vhd-cli 1.1.1
- xo-server 5.196.0

## **6.0.3** (2026-01-06)

### Security

### Enhancements

### Bug fixes

- [V2V] Better handling of block alignment (PR [#9293](https://github.com/vatesfr/xen-orchestra/pull/9293))
- [Hub] Fix _m.downloadAndInstallResource is not a function_ error [Forum#11735](https://xcp-ng.org/forum/topic/11735/hub-is-bugged) (PR [#9362](https://github.com/vatesfr/xen-orchestra/pull/9362))

### Released packages

- vhd-lib 4.14.6
- @xen-orchestra/disk-transform 1.2.1
- @xen-orchestra/qcow2 1.1.1
- @xen-orchestra/xapi 8.6.3
- @xen-orchestra/backups 0.67.2
- @xen-orchestra/web-core 0.40.0
- @xen-orchestra/proxy 0.29.41
- @xen-orchestra/web 0.37.2
- xo-server 5.194.6
- xo-web 5.191.3

## **6.0.2** (2025-12-23)

### Bug fixes

- **XO5**:
  - [XOA/Updates] Fix xoa-updater service appears to be down (PR [#9349](https://github.com/vatesfr/xen-orchestra/pull/9349))
  - [Netdata] Fix netdata URL (PR [#9354](https://github.com/vatesfr/xen-orchestra/pull/9354))

- [OpenMetrics] Fix compliance with OpenMetrics 1.0 specification: use correct Content-Type header and timestamps in seconds [#9351](https://github.com/vatesfr/xen-orchestra/pull/9351)
- [OpenMetrics] Fix authentication bypass for `/openmetrics` routes to allow Prometheus scraping with Bearer token [#9351](https://github.com/vatesfr/xen-orchestra/pull/9351)
- [Select component] Fix randomly empty select component at initialization (PR [#9282](https://github.com/vatesfr/xen-orchestra/pull/9282))
- [TaskItem] Fix tree on task item component due to a different behavior on firefox (PR [#9352](https://github.com/vatesfr/xen-orchestra/pull/9352))

### Released packages

- @xen-orchestra/web-core 0.39.1
- @xen-orchestra/web 0.37.1
- xo-server 5.194.5
- xo-server-openmetrics 1.0.2

## **6.0.1** (2025-12-19)

### Security

- [Openmetrics] Hardcode port and bind address for security and compatibility with the system firewall (PR [#9337](https://github.com/vatesfr/xen-orchestra/pull/9337))

### Enhancements

### Bug fixes

- [OTP] Fix rendering of OTP signin page (PR [#9340](https://github.com/vatesfr/xen-orchestra/pull/9340))
- **XO 5:**
  - Fix infinite loading when `redirectToHttps=true` (PR [#9339](https://github.com/vatesfr/xen-orchestra/pull/9339))

### Released packages

- xo-server 5.194.4
- xo-server-openmetrics 1.0.1

## **6.0.0** (2025-12-18)

### Highlights

- [i18n] Update Czech, German, Persian, Italian, Japanese, Korean, Norwegian, Dutch, Russian, Swedish and Ukrainian translations (PR [#9305](https://github.com/vatesfr/xen-orchestra/pull/9305))
- [i18n] Update Czech, Danish, Spanish, French, Italian, Dutch, Portuguese (Brazil), and Russian translations (PR [#9243](https://github.com/vatesfr/xen-orchestra/pull/9243))
- [Navigation] Navigation state is now persisted in localStorage and items are now collapsible while filtering. (PR [#9277](https://github.com/vatesfr/xen-orchestra/pull/9277))
- [Reactivity] Tasks are now reactive (PR [#9271](https://github.com/vatesfr/xen-orchestra/pull/9271))
- [XO] XO6 is now the default page (PR [#9212](https://github.com/vatesfr/xen-orchestra/pull/9212))
- [Site/Tasks] Implement tasks view and side panel information (PR [#9063](https://github.com/vatesfr/xen-orchestra/pull/9063))
- [Pool/Tasks] Implement tasks view and side panel information (PR [#9312](https://github.com/vatesfr/xen-orchestra/pull/9312))
- [Host/Tasks] Implement tasks view and side panel information (PR [#9311](https://github.com/vatesfr/xen-orchestra/pull/9311))
- [VMs/Tasks] Implement tasks view and side panel information (PR [#9313](https://github.com/vatesfr/xen-orchestra/pull/9313))

### Enhancements

- **XO 6:**
  - [Navigation] Add links to XO 5 for actions and pages not yet implemented in XO 6 (PR [#9214](https://github.com/vatesfr/xen-orchestra/pull/9214))

- [Backups/s3] Update filesystem handling to use DeleteObjectsCommand in order to improve performance (PR [#9281](https://github.com/vatesfr/xen-orchestra/pull/9281))
- [REST API] Add link to the openAPI JSON directly in the swagger description (PR [#9285](https://github.com/vatesfr/xen-orchestra/pull/9285))
- [REST-API/SSE] Possibility to subscribe to XO task (PR [#9269](https://github.com/vatesfr/xen-orchestra/pull/9269))
- [XO5] Remove XOSAN (PR [#9248](https://github.com/vatesfr/xen-orchestra/pull/9248))
- [Plugins/Backup-reports] Add optional context in email subject and Pool ID in summary [#8544](https://github.com/vatesfr/xen-orchestra/issues/8544) (PR [#8973](https://github.com/vatesfr/xen-orchestra/pull/8973))
- [Plugins/Openmetrics] Expose XCP-NG metrics in OpenMetrics format for Prometheus/Grafana (PR [#9323](https://github.com/vatesfr/xen-orchestra/pull/9323))

### Bug fixes

- [Backups] Allow offline backups for more types of backups [Forum#11578](https://xcp-ng.org/forum/topic/11578) (PR [#9228](https://github.com/vatesfr/xen-orchestra/pull/9228))
- [xo-server] better handling of xapi snapshots when converting to xo object (PR [#9231](https://github.com/vatesfr/xen-orchestra/pull/9231))
- [REST API/VM Dashboard] Return `vmProtection: 'protected' | 'unprotected' | 'not-in-job'` instead of `vmProtected: boolean` (PR [#9288](https://github.com/vatesfr/xen-orchestra/pull/9288))
- [Backup]clean up .vhd.checksum files (PR [#9291](https://github.com/vatesfr/xen-orchestra/pull/9291))
- [Backup] Prevent "No new data to upload for this VM" info on mirror backups when it was false [Forum#11623](https://xcp-ng.org/forum/topic/11623) (PR [#9286](https://github.com/vatesfr/xen-orchestra/pull/9286))
- [REST API] Fix various _cannot convert undefined or null to object_ (PR [#9304](https://github.com/vatesfr/xen-orchestra/pull/9304))
- [REST API/VM Dashboard] Fix _cannot read property of undefined_ (PR [#9304](https://github.com/vatesfr/xen-orchestra/pull/9304))
- [Backups] Don't fail backup with memory on "INVALID_UUID" error (PR [#9308](https://github.com/vatesfr/xen-orchestra/pull/9308))
- [Plugins/Perf-alert] Unload configuration when the plugin is disabled (PR [#9306](https://github.com/vatesfr/xen-orchestra/pull/9306))
- [REST-API] Fix duplicate entries using `ndjson` (PR [#9320](https://github.com/vatesfr/xen-orchestra/pull/9320))
- [Host] Report 0 RAM usage for halted hosts instead of incorrect values (PR [#9272](https://github.com/vatesfr/xen-orchestra/pull/9272))
- [Plugins/OIDC] Fix group import on string (PR [#9280](https://github.com/vatesfr/xen-orchestra/pull/9280))
- [Vm Import] Fix `error intermediate value not iterable` (PR [#9327](https://github.com/vatesfr/xen-orchestra/pull/9327))
- [XO5/Restore] Replace deprecated endpoint call (PR [#9316](https://github.com/vatesfr/xen-orchestra/pull/9316))

- **XO 6:**
  - [VDIs] Fix broken fallback link to XO 5 VDIs page (PR [#9267](https://github.com/vatesfr/xen-orchestra/pull/9267))
  - Redirect non admin user to XO5 (PR [#9219](https://github.com/vatesfr/xen-orchestra/pull/9219))
  - [VM/New] Fix wording in "Memory" section (PR [#9309](https://github.com/vatesfr/xen-orchestra/pull/9309))
  - [Nav/AccountMenu] License URL wasn’t redirecting properly to XO 5 (PR [#9321](https://github.com/vatesfr/xen-orchestra/pull/9321))

### Released packages

- @xen-orchestra/fs 4.6.5
- @xen-orchestra/backups 0.67.1
- @vates/types 1.16.0
- @xen-orchestra/mixins 0.18.0
- xen-api 4.7.6
- @xen-orchestra/xapi 8.6.2
- @xen-orchestra/web-core 0.39.0
- @xen-orchestra/proxy 0.29.40
- @xen-orchestra/rest-api 0.22.1
- @xen-orchestra/web 0.37.0
- xo-server 5.194.3
- xo-server-audit 0.15.0
- xo-server-auth-oidc 0.4.2
- xo-server-backup-reports 1.7.0
- xo-server-openmetrics 1.0.0
- xo-server-perf-alert 1.1.0
- xo-web 5.191.2

## Previous changelogs

- [Xen Orchestra 5](./CHANGELOG.v5.md)
- [Xen Orchestra 4](./CHANGELOG.v4.md)
- [Xen Orchestra 3](./CHANGELOG.v3.md)
