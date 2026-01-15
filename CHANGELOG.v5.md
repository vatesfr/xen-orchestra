## **5.113.2** (2025-12-09)

### Bug fixes

- [Plugins/OIDC] Fix group import on string (PR [#9280](https://github.com/vatesfr/xen-orchestra/pull/9280))
- [Plugins/Perf-alert] Improve email subject (PR [#9283](https://github.com/vatesfr/xen-orchestra/pull/9283))

### Released packages

- xo-server-auth-oidc 0.4.1
- xo-server-perf-alert 1.0.4

## **5.113.1** (2025-11-28)

### Released packages

- xo-server-perf-alert 1.0.3

## **5.113.0** (2025-11-27)

### Highlights

- [vhd-cli] **Breaking changes** Changed commands input to make plugin usable on encrypted remotes (PR [#9235](https://github.com/vatesfr/xen-orchestra/pull/9235))
- [Backups] Update wordings for backup jobs' modes to match XO documentation (PR [#9199](https://github.com/vatesfr/xen-orchestra/pull/9199))
- [i18n] Update Czech, German, French, Italian, Dutch, Portuguese (Brazil), and Ukrainian translations, and add Danish translation (PR [#9165](https://github.com/vatesfr/xen-orchestra/pull/9165))
- [Plugins/OIDC] Import user groups from OIDC (PR [#9206](https://github.com/vatesfr/xen-orchestra/pull/9206))
- [Plugins/Perf-alert] **Breaking changes** Improve performance of plugins, remove Alarm generation (PR [#9070](https://github.com/vatesfr/xen-orchestra/pull/9070))
- [VIF] Fix VIFs with device > 7 being destroyed when changing network - now uses non-destructive VIF.move API (XenServer 7.1+) that preserves VIF UUID and avoids network downtime (PR [#9221](https://github.com/vatesfr/xen-orchestra/pull/9221))
- [Plugins/load balancer] Add 'Affinity tag' option in plugin configuration (PR [#9116](https://github.com/vatesfr/xen-orchestra/pull/9116))
- [Plugins/Usage Report] Add RAM and CPU allocation columns to reports to help identify over/under-provisioned VMs (PR [#9224](https://github.com/vatesfr/xen-orchestra/pull/9224))

- **XO 6:**
  - [Dashboards/Alarms] fix double scrollbar in Alarms lists due to incorrect height setting (PR [#9246](https://github.com/vatesfr/xen-orchestra/pull/9246))
  - Implement reactivity for VMs, VM templates, VM controllers, VIFs, VDIs, VBDs, SRs, pools, PIFs, PGPUs, PCIs, networks, alarms, and hosts (PR [#9183](https://github.com/vatesfr/xen-orchestra/pull/9183))
  - [New/VM] Display unsupported features information message (PR [#9203](https://github.com/vatesfr/xen-orchestra/pull/9203))
  - [VM/New] Add boot firmware to VM creation form (PR [#9158](https://github.com/vatesfr/xen-orchestra/pull/9158))
  - [VM/VDIs] Implement vdis view and side panel information (PR [#9232](https://github.com/vatesfr/xen-orchestra/pull/9232))
  - [Pool/VMs] Implement VMs view and side panel information (PR [#9196](https://github.com/vatesfr/xen-orchestra/pull/9196))
  - [Host/VMs] Implement VMs view and side panel information (PR [#9193](https://github.com/vatesfr/xen-orchestra/pull/9193))
  - [Site/VMs] Implement VMs view and side panel information (PR [#9145](https://github.com/vatesfr/xen-orchestra/pull/9145))
  - [Pool/Hosts] Implement hosts view and side panel information (PR [#9218](https://github.com/vatesfr/xen-orchestra/pull/9218))
  - [Header] Add EasyVirt DC Scope and DC NetScope buttons to install and access EasyVirt solutions (PR [#9242](https://github.com/vatesfr/xen-orchestra/pull/9242))
  - [Pool] Add Storage Repositories page to display all SRs in the pool (PR [#9134](https://github.com/vatesfr/xen-orchestra/pull/9134))
  - [Host] Add Storage Repositories page to display all SRs in the host (PR [#9137](https://github.com/vatesfr/xen-orchestra/pull/9137))

### Security

> Security fixes and new features should go in this section

- [Packages] Update xml2js dependency (PR [#9216](https://github.com/vatesfr/xen-orchestra/pull/9216))
- [Proxy] Update cookie package (PR [#9220](https://github.com/vatesfr/xen-orchestra/pull/9220))
- [Plugins/transport-email] Update nodemailer (PR [#9217](https://github.com/vatesfr/xen-orchestra/pull/9217))
- Update dependency ansi_up (PR [#9226](https://github.com/vatesfr/xen-orchestra/pull/9226))

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Expose `GET /rest/v0/events` to open an SSE connection (PR [#9130](https://github.com/vatesfr/xen-orchestra/pull/9130))
- [REST API] Expose `POST /rest/v0/events/:id/subscriptions` to add a subscription in the SSE connection (PR [#9130](https://github.com/vatesfr/xen-orchestra/pull/9130))
- [REST API] Expose `DELETE /rest/v0/events/:id/subscriptions` to remove a subscription in the SSE connection (PR [#9130](https://github.com/vatesfr/xen-orchestra/pull/9130))
- [Backup] Add warning message: enabling/disabling backup job from VM > Backup affects all VMs in the job (PR [#9155](https://github.com/vatesfr/xen-orchestra/pull/9155))
- [Plugins/Usage Report] Add operating system information to reports - displays OS distribution statistics and includes OS details (name, distribution, version) in both HTML reports and CSV exports (PR [#9179](https://github.com/vatesfr/xen-orchestra/pull/9179))
- [Backup archives] Add `vm.tags` to `backups archives` (PR [#9190](https://github.com/vatesfr/xen-orchestra/pull/9190))
- [Menu] Add link from XO 5 to XO 6 (PR [#9187](https://github.com/vatesfr/xen-orchestra/pull/9187))
- [REST API] Expose VM dashboard endpoint `GET /rest/v0/vms/:vm-id/dashboard` (PR [#9143](https://github.com/vatesfr/xen-orchestra/pull/9143))
- [REST API] **Breaking changes** Async actions now return `application/json` (PR [#9209](https://github.com/vatesfr/xen-orchestra/pull/9209))
- [HUB Recipe] Support custom cluster CIDR and Xo CCM (Cloud Controller Manager) in Pyrgos recipe
- [Disk] Add warning before disconnecting a VBD (PR [#9211](https://github.com/vatesfr/xen-orchestra/pull/9211))

- **XO 6:**
  - [XO routes] fetch xo gui routes (PR [#9138](https://github.com/vatesfr/xen-orchestra/pull/9138))
  - [Input search] update design of input search (PR [#9156](https://github.com/vatesfr/xen-orchestra/pull/9156))
  - [Site/Hosts] Implement hosts view and side panel information (PR [#9128](https://github.com/vatesfr/xen-orchestra/pull/9128))
  - [Settings page] Create settings page accessible from user menu (PR [#9175](https://github.com/vatesfr/xen-orchestra/pull/9175))
  - [Core] Add tooltip on tag component if the text is cut (PR [#9184](https://github.com/vatesfr/xen-orchestra/pull/9184))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backups] use the oldest record for Long Term Retention instead of newest (PR [#9180](https://github.com/vatesfr/xen-orchestra/pull/9180))
- [Backups] fix infinite chain of snapshot and replication [Forum#11540](https://xcp-ng.org/forum/topic/11540) [Forum#11539](https://xcp-ng.org/forum/topic/11539) (PR [#9202](https://github.com/vatesfr/xen-orchestra/pull/9202))
- [V2V] fix missing libssl.so.3 in path on debian 11 (PR [#9208](https://github.com/vatesfr/xen-orchestra/pull/9208))
- [Backups/File level restore] ignore swap partition (PR [#9182](https://github.com/vatesfr/xen-orchestra/pull/9182))
- [Backups/File level restore] Better handling of LVM on GPT partition (PR [#9182](https://github.com/vatesfr/xen-orchestra/pull/9182))
- [REST API] Fix `/rest/v0/backup-jobs` return non backup-jobs (PR [#9210](https://github.com/vatesfr/xen-orchestra/pull/9210))
- [Backups] use the oldest record for Long Term Retention instead of newest (PR [#9180](https://github.com/vatesfr/xen-orchestra/pull/9180))
- [Backups] fix infinite chain of snapshot and replication [Forum#11540](https://xcp-ng.org/forum/topic/11540) [Forum#11539](https://xcp-ng.org/forum/topic/11539) (PR [#9202](https://github.com/vatesfr/xen-orchestra/pull/9202))
- [V2V] fix missing libssl.so.3 in path on debian 11 (PR [#9208](https://github.com/vatesfr/xen-orchestra/pull/9208))
- [xo-server] imporve esxi 6 importing from wmware failure fallback by using COWD file (PR [#9223](https://github.com/vatesfr/xen-orchestra/pull/9223))
- [REST API] Fix `/rest/v0/backup-archives` return error 500 _Cannot convert undefined or null to object_ (PR [#9240](https://github.com/vatesfr/xen-orchestra/pull/9240))

- **XO 6:**
  - [Host/Vm] fix issues on dashboards, and translation on charts (PR [#9204](https://github.com/vatesfr/xen-orchestra/pull/9204))
  - [Dashboards] Prevent charts reloading every 30 seconds (PR [#8939](https://github.com/vatesfr/pull/8939))
  - [Host/HostSystemResourceManagement] Fix display when control domain memory is undefined (PR [#9197](https://github.com/vatesfr/xen-orchestra/pull/9197))
- [V2V] fix transfer failing at 99% for unaligned disk (PR [#9233](https://github.com/vatesfr/xen-orchestra/pull/9233))
- [REST API] _parse error: expected end of input at position #_ when an invalid query parameter is provided, a 400 error is returned with more details (PR [#9244](https://github.com/vatesfr/xen-orchestra/pull/9244))
  - [Host/HostSystemResourceManagement] Fix display when control domain memory is undefined (PR [#9197](https://github.com/vatesfr/xen-orchestra/pull/9197))

### Released packages

- xo-collection 0.6.0
- xen-api 4.7.5
- @vates/types 1.15.0
- @xen-orchestra/xapi 8.6.1
- @xen-orchestra/backups 0.67.0
- @xen-orchestra/backups-cli 1.1.6
- @xen-orchestra/immutable-backups 1.0.27
- @xen-orchestra/proxy 0.29.36
- xo-vmdk-to-vhd 2.5.9
- xo-server-load-balancer 0.11.0
- xo-server-transport-email 1.1.1
- xo-server-usage-report 0.11.0
- vhd-cli 1.0.0
- vhd-lib 4.14.5
- @vates/nbd-client 3.2.2
- @xen-orchestra/rest-api 0.21.1
- @xen-orchestra/vmware-explorer 0.10.6
- xo-server 5.193.1
- xo-server-auth-oidc 0.4.0
- xo-web 5.191.0
- @xen-orchestra/web-core 0.35.1
- @xen-orchestra/web 0.34.2
- xo-server-perf-alert 1.0.2

## **5.112.1** (2025-11-03)

<img id="stable" src="https://badgen.net/badge/channel/stable/green" alt="Channel: stable" />

### Bug fixes

- [Hub/EasyVirt] Fix the EasyVirt deployment form to allow static network configuration and password for DC Netscope web interface (PR [#9107](https://github.com/vatesfr/xen-orchestra/pull/9107))
- [Backup] use qcow2 export for qcow2 disks backup and replication (PR [#9170](https://github.com/vatesfr/xen-orchestra/pull/9170))

- **XO 6:**
  - [Site/Backups/Settings] Fix a reactivity issue in displayed settings when the backup job object changes (PR [#9169](https://github.com/vatesfr/xen-orchestra/pull/9169))

### Released packages

- vhd-lib 4.14.4
- @xen-orchestra/xapi 8.6.0
- @xen-orchestra/proxy 0.29.35
- @xen-orchestra/web 0.32.1
- xo-server 5.192.1
- xo-web 5.189.0

## **5.112.0** (2025-10-30)

### Highlights

- [Backups] Add `Merge backups synchronously` to mirror backup (PR [#9118](https://github.com/vatesfr/xen-orchestra/pull/9118))
- [Backups] Fix VDI_NO_MANAGED error during replication (PR [#9117](https://github.com/vatesfr/xen-orchestra/pull/9117))
- [REST API] Expose `/rest/v0/pbds` and `/rest/v0/pbds/:id` (PR [#9106](https://github.com/vatesfr/xen-orchestra/pull/9106))
- [REST API] Possibility to use `Basic Auth` for authenticated endpoints (PR [#9102](https://github.com/vatesfr/xen-orchestra/pull/9102))
- [REST API] Expose `GET /rest/v0/ping` (PR [#9129](https://github.com/vatesfr/xen-orchestra/pull/9129))
- [REST API] Expose `GET /rest/v0/backup-archives` and `GET /rest/v0/backup-archives/:id` (PR [#8982](https://github.com/vatesfr/xen-orchestra/pull/8982))

- **XO 6:**
  - [Treeview search] Add loader when search is triggered and ability to clear search (PR [#9122](https://github.com/vatesfr/xen-orchestra/pull/9122))
  - [Collections] Implement virtual lists for tasks and alarms to improve performance (PR [#9077](https://github.com/vatesfr/xen-orchestra/pull/9077))
  - [Treeview] Move search loader from input to Treeview (PR [#9142](https://github.com/vatesfr/xen-orchestra/pull/9142))
  - [i18n] Update Czech, German, Spanish, Italian, Dutch, Portuguese (Brazil), Russian, Swedish and Ukrainian translations (PR [#9095](https://github.com/vatesfr/xen-orchestra/pull/9095))
  - [Site/Backups] Add backup targets view (PR [#9048](https://github.com/vatesfr/xen-orchestra/pull/9048))
  - [Site/Backups] Add backed-up VMs view (PR [#9018](https://github.com/vatesfr/xen-orchestra/pull/9018))
  - [Site/Backups] Add backup runs view (PR [#9007](https://github.com/vatesfr/xen-orchestra/pull/9007))
  - [Site/Backups] Add backup job configuration view (PR [#9008](https://github.com/vatesfr/xen-orchestra/pull/9008))

### Enhancements

- [Plugins/SAML] Add two fields to configure assertions and responses signatures (PR [#9093](https://github.com/vatesfr/xen-orchestra/pull/9093))
- [V2V] support import of disk bigger than 2TB toward qcow enabled SR (PR [#9148](https://github.com/vatesfr/xen-orchestra/pull/9148))
- [Host/General] Display additional hardware data for Lenovo server (PR [#9149](https://github.com/vatesfr/xen-orchestra/pull/9149))
- [Netbox] Support Netbox v4.4.x (PR [#9153](https://github.com/vatesfr/xen-orchestra/pull/9153))
- [REST API] `/rest/v0` redirect now to `/rest/v0/docs` and the swagger is now available for unauthenticated users (PR [#9101](https://github.com/vatesfr/xen-orchestra/pull/9101))
- [REST API] Expose `/rest/v0/users/:id/authentication_tokens` (PR [#9102](https://github.com/vatesfr/xen-orchestra/pull/9102))
- [REST API] Expose `GET /rest/v0/gui-routes` (PR [#9133](https://github.com/vatesfr/xen-orchestra/pull/9133))
- [REST API] Add boot firmware for VM creation (PR [#9147](https://github.com/vatesfr/xen-orchestra/pull/9147))

- **XO 6:**
  - [Core/Guidelines] Update logical properties section in CSS guidelines (PR [#9132](https://github.com/vatesfr/xen-orchestra/pull/9132))
  - [User Menu] Added new links in the user menu and customized it (PR [#9126](https://github.com/vatesfr/xen-orchestra/pull/9126))
  - [Site/Backups] Update head bar to use breadcrumb component for better navigation (PR [#9159](https://github.com/vatesfr/xen-orchestra/pull/9159))

- **Migrated REST API endpoints**:
  - `GET /rest/v0/pifs/<pif-id>/messages` (PR [#9021](https://github.com/vatesfr/xen-orchestra/pull/9021))
  - `GET /rest/v0/networks/<network-id>/messages` (PR [#9023](https://github.com/vatesfr/xen-orchestra/pull/9023))
  - `GET /rest/v0/vdi-snapshots/<vdi-snapshot-id>/messages` (PR [#9043](https://github.com/vatesfr/xen-orchestra/pull/9043))
  - `GET /rest/v0/vdis/<vdi-id>/messages` (PR [#9044](https://github.com/vatesfr/xen-orchestra/pull/9044))
  - `GET /rest/v0/vifs/<vif-id>/messages` (PR [#9049](https://github.com/vatesfr/xen-orchestra/pull/9049))
  - `GET /rest/v0/vm-controllers/<vm-controller-id>/messages` (PR [#9050](https://github.com/vatesfr/xen-orchestra/pull/9050))
  - `GET /rest/v0/vm-snapshots/<vm-snapshot-id>/tasks` (PR [#9005](https://github.com/vatesfr/xen-orchestra/pull/9005))
  - `GET /rest/v0/servers/<server-id>/tasks` (PR [#9065](https://github.com/vatesfr/xen-orchestra/pull/9065))
  - `GET /rest/v0/vm-templates/<vm-template-id>/tasks` (PR [#9004](https://github.com/vatesfr/xen-orchestra/pull/9004))
  - `GET /rest/v0/users/<user-id>/tasks` (PR [#9066](https://github.com/vatesfr/xen-orchestra/pull/9066))
  - `GET /rest/v0/groups/<group-id>/tasks` (PR [#9072](https://github.com/vatesfr/xen-orchestra/pull/9072))
  - `GET /rest/v0/vm-controllers/<vm-controller-id>/tasks` (PR [#9069](https://github.com/vatesfr/xen-orchestra/pull/9069))
  - `GET /rest/v0/vifs/<vif-id>/tasks` (PR [#9075](https://github.com/vatesfr/xen-orchestra/pull/9075))
  - `GET /rest/v0/pifs/<pif-id>/tasks` (PR [#9078](https://github.com/vatesfr/xen-orchestra/pull/9078))
  - `GET /rest/v0/networks/<network-id>/tasks` (PR [#9076](https://github.com/vatesfr/xen-orchestra/pull/9076))
  - `GET /rest/v0/hosts/<host-id>/tasks` (PR [#9074](https://github.com/vatesfr/xen-orchestra/pull/9074))
  - `GET /rest/v0/vbds/<vbd-id>/messages` (PR [#9029](https://github.com/vatesfr/xen-orchestra/pull/9029))
  - `GET /rest/v0/vdis/<vdi-id>/tasks` (PR [#9079](https://github.com/vatesfr/xen-orchestra/pull/9079))
  - `GET /rest/v0/vdi-snapshots/<vdi-snaphot-id>/tasks` (PR [#9082](https://github.com/vatesfr/xen-orchestra/pull/9082))
  - `PUT /rest/v0/hosts/<host-id>/tags/:tag` (PR [#9037](https://github.com/vatesfr/xen-orchestra/pull/9037))
  - `DELETE /rest/v0/hosts/<host-id>/tags/:tag` (PR [#9037](https://github.com/vatesfr/xen-orchestra/pull/9037))
  - `PUT /rest/v0/networks/<network-id>/tags/:tag` (PR [#9087](https://github.com/vatesfr/xen-orchestra/pull/9087))
  - `DELETE /rest/v0/networks/<network-id>/tags/:tag` (PR [#9087](https://github.com/vatesfr/xen-orchestra/pull/9087))
  - `PUT /rest/v0/pools/<pool-id>/tags/:tag` (PR [#9088](https://github.com/vatesfr/xen-orchestra/pull/9088))
  - `DELETE /rest/v0/pools/<pool-id>/tags/:tag` (PR [#9088](https://github.com/vatesfr/xen-orchestra/pull/9088))
  - `GET /rest/v0/pools/<pool-id>/tasks` (PR [#9080](https://github.com/vatesfr/xen-orchestra/pull/9080))
  - `GET /rest/v0/vbds/<vbd-id>/tasks` (PR [#9085](https://github.com/vatesfr/xen-orchestra/pull/9085))
  - `GET /rest/v0/srs/<sr-id>/tasks` (PR [#9086](https://github.com/vatesfr/xen-orchestra/pull/9086))
  - `PUT /rest/v0/vms/<vm-id>/tags/:tag` (PR [#9092](https://github.com/vatesfr/xen-orchestra/pull/9092))
  - `DELETE /rest/v0/vms/<vm-id>/tags/:tag` (PR [#9092](https://github.com/vatesfr/xen-orchestra/pull/9092))
  - **removed** `PUT /rest/v0/vbds/<vbd-id>/tags/:tag` (PR [#9090](https://github.com/vatesfr/xen-orchestra/pull/9090))
  - **removed** `DELETE /rest/v0/vbds/<vbd-id>/tags/:tag` (PR [#9090](https://github.com/vatesfr/xen-orchestra/pull/9090))
  - **removed** `PUT /rest/v0/vifs/<vif-id>/tags/:tag` (PR [#9096](https://github.com/vatesfr/xen-orchestra/pull/9096))
  - **removed** `DELETE /rest/v0/vifs/<vif-id>/tags/:tag` (PR [#9096](https://github.com/vatesfr/xen-orchestra/pull/9096))
  - `PUT /rest/v0/vdi-snapshots/<vdi-snapshot-id>/tags/:tag` (PR [#9091](https://github.com/vatesfr/xen-orchestra/pull/9087))
  - `DELETE /rest/v0/vdi-snapshots/<vdi-snapshot-id>/tags/:tag` (PR [#9091](https://github.com/vatesfr/xen-orchestra/pull/9091))
  - `PUT /rest/v0/vdis/<vdi-id>/tags/:tag` (PR [#9094](https://github.com/vatesfr/xen-orchestra/pull/9094))
  - `DELETE /rest/v0/vdis/<vdi-id>/tags/:tag` (PR [#9094](https://github.com/vatesfr/xen-orchestra/pull/9094))
  - `PUT /rest/v0/srs/<sr-id>/tags/:tag` (PR [#9089](https://github.com/vatesfr/xen-orchestra/pull/9089))
  - `DELETE /rest/v0/srs/<sr-id>/tags/:tag` (PR [#9089](https://github.com/vatesfr/xen-orchestra/pull/9089))
  - `PUT /rest/v0/vm-snapshots/<vm-snapshot-id>/tags/:tag` (PR [#9098](https://github.com/vatesfr/xen-orchestra/pull/9098))
  - `DELETE /rest/v0/vm-snapshots/<vm-snapshot-id>/tags/:tag` (PR [#9098](https://github.com/vatesfr/xen-orchestra/pull/9098))
  - `DELETE /rest/v0/vm-templates/<vm-template-id>/tags/:tag` (PR [#9099](https://github.com/vatesfr/xen-orchestra/pull/9099))
  - `GET /rest/v0/vm-templates/<vm-template-id>/tasks` (PR [#9099](https://github.com/vatesfr/xen-orchestra/pull/9099))
  - `PUT /rest/v0/vm-controllers/<vm-controller-id>/tags/:tag` (PR [#9097](https://github.com/vatesfr/xen-orchestra/pull/9097))
  - `DELETE /rest/v0/vm-controllers/<vm-controller-id>/tags/:tag` (PR [#9097](https://github.com/vatesfr/xen-orchestra/pull/9097))
  - `PUT /rest/v0/vdis/<vdi-id>.(vhd|raw)` (PR [#9038](https://github.com/vatesfr/xen-orchestra/pull/9038))
  - **removed** `PUT /rest/v0/vdi-snapshots/<vdi-snapshot-id>.(vhd|raw)` (PR [#9038](https://github.com/vatesfr/xen-orchestra/pull/9038))
  - **deprecated** `POST /rest/v0/users/authentication_tokens` (PR [#9102](https://github.com/vatesfr/xen-orchestra/pull/9102))

### Bug fixes

- [VM] Fix some action buttons being hidden from admin users when VM had been created with Self Service (PR [#9061](https://github.com/vatesfr/xen-orchestra/pull/9061))
- [Copy to clipboard] Fix button sometimes disappearing when trying to reach it (PR [#9059](https://github.com/vatesfr/xen-orchestra/pull/9059))
- [Plugins/SAML] Fix SAML authentication with audience matching (PR [#9093](https://github.com/vatesfr/xen-orchestra/pull/9093))
- [Backup/immutabiltiy] Fix double delete file that can block immutability lifting (PR [#9104](https://github.com/vatesfr/xen-orchestra/pull/9104))
- [VM/advanced] Fix error while changing running VM memory limit (PR [#9121](https://github.com/vatesfr/xen-orchestra/pull/9121))
- [Plugins/load balancer] Avoid migrating VMs tagged with anti-affinity when balancing performance (PR [#9139](https://github.com/vatesfr/xen-orchestra/pull/9139))
- [VM] Set a default `cores-per-socket` value for all new VM [#9111](https://github.com/vatesfr/xen-orchestra/issues/9111) (PR [#9136](https://github.com/vatesfr/xen-orchestra/pull/9136))
- [VM] Update invalid `platform.cores-per-socket` for all existing VM with invalid value [#9111](https://github.com/vatesfr/xen-orchestra/issues/9111) (PR [#9136](https://github.com/vatesfr/xen-orchestra/pull/9136))
- [XO5/VM] Fix format qcow2 not showing (PR [#9157](https://github.com/vatesfr/xen-orchestra/pull/9157))

- **XO 6**:
  - [User Menu] Fix display user menu in front of tree structure (PR [#9115](https://github.com/vatesfr/xen-orchestra/pull/9115))
  - [Site/Backups] Fix an issue properties of undefined in backups tab (PR [#9064](https://github.com/vatesfr/xen-orchestra/pull/9064))
  - [Site/Backups] Fixed an issue related to date formatting and language switching (PR [#9124](https://github.com/vatesfr/xen-orchestra/pull/9124))

### Released packages

- @vates/fatfs 0.11.1
- @vates/generator-toolbox 1.1.0
- @xen-orchestra/disk-transform 1.2.0
- @xen-orchestra/vmware-explorer 0.10.4
- xo-server-auth-saml 0.12.0
- xo-server-load-balancer 0.10.4
- vhd-lib 4.14.3
- @vates/types 1.14.0
- @xen-orchestra/qcow2 1.1.0
- @xen-orchestra/xapi 8.5.0
- @xen-orchestra/backups 0.66.0
- @xen-orchestra/backups-cli 1.1.5
- @xen-orchestra/immutable-backups 1.0.26
- @xen-orchestra/web-core 0.33.0
- @xen-orchestra/proxy 0.29.34
- @xen-orchestra/rest-api 0.20.0
- @xen-orchestra/web 0.32.0
- xo-server 5.192.0
- xo-server-netbox 1.10.0
- xo-web 5.188.0

## **5.111.1** (2025-10-06)

<img id="stable" src="https://badgen.net/badge/channel/stable/green" alt="Channel: stable" />

### Enhancements

- **Migrated REST API endpoints**:
  - `GET /rest/v0/srs/<sr-id>/messages` (PR [#9028](https://github.com/vatesfr/xen-orchestra/pull/9028))
  - `GET /rest/v0/hosts/<host-id>/messages` (PR [#9027](https://github.com/vatesfr/xen-orchestra/pull/9027))
  - `GET /rest/v0/pools/<pool-id>/messages` (PR [#9022](https://github.com/vatesfr/xen-orchestra/pull/9022))

### Bug fixes

- [V2V] Do not lock stopped VMs (PR [#9047](https://github.com/vatesfr/xen-orchestra/pull/9047))
- [Backups] Fix EEXIST error when retrying a backup (PR [#9039](https://github.com/vatesfr/xen-orchestra/pull/9039))
- [Backups] Fix stuck backup when the source is timing out (PR [#9039](https://github.com/vatesfr/xen-orchestra/pull/9039))
- [V2V] Fix import stuck before any disk data (PR [#9045](https://github.com/vatesfr/xen-orchestra/pull/9045))

### Released packages

- @vates/async-each 1.0.1
- @xen-orchestra/fs 4.6.4
- @vates/types 1.12.1
- @xen-orchestra/proxy 0.29.32
- @xen-orchestra/rest-api 0.18.0
- @xen-orchestra/vmware-explorer 0.10.3
- @xen-orchestra/web 0.30.1
- xo-server 5.190.1
- xo-server-auth-saml 0.11.1

## **5.111.0** (2025-09-30)

### Highlights

- [Hub/Recipe] Add new recipe to deploy EasyVirt's DC Scope and DC NetScope VMs (PRs [#8797](https://github.com/vatesfr/xen-orchestra/pull/8797) [#8951](https://github.com/vatesfr/xen-orchestra/pull/8951))
- [XO5/Templates] Show template id when expanded the templates list (PR [#8949](https://github.com/vatesfr/xen-orchestra/pull/8949))
- [SR/Advanced] Add a security to prevent accidentally reclaiming freed space during backups (PR [#8947](https://github.com/vatesfr/xen-orchestra/pull/8947))
- [Host/PIFs] Use a natural sort when sorting by device (eth9 < eth10) (PR [#8967](https://github.com/vatesfr/xen-orchestra/pull/8967))
- [New VM] Add a new variable in custom cloud config to easily add SSH keys (PR [#8968](https://github.com/vatesfr/xen-orchestra/pull/8968))
- [XOSTOR] Show resource without volumes in XOSTOR view (PR [#8944](https://github.com/vatesfr/xen-orchestra/pull/8944))
- [sdn-controller] Use the XCP-ng plugin instead of a direct channel to drive openflow (PR [#8488](https://github.com/vatesfr/xen-orchestra/pull/8488))

- **XO 6:**
  - [VM/dashboard] Update QuickInfo card in dashboard to show more information (PR [#8952](https://github.com/vatesfr/xen-orchestra/pull/8952))
  - [StateHero] Update VtsStateHero component and modify usages in every component (PR [#8910](https://github.com/vatesfr/pull/8910))
  - [VM] Add Backup Jobs page (PR [#8976](https://github.com/vatesfr/xen-orchestra/pull/8976))
  - [Site/Backups] Add side panel to backup jobs view (PR [#8966](https://github.com/vatesfr/xen-orchestra/pull/8966))
  - [VM/Backups] Add side panel to VM backup jobs view (PR [#8978](https://github.com/vatesfr/xen-orchestra/pull/8978))
  - [HOST/VM/Alarms] Implement alarms component in host and vm pages (PR [#8937](https://github.com/vatesfr/xen-orchestra/pull/8937))

### Enhancements

- **Migrated REST API endpoints**:
  - `DELETE /rest/v0/tasks` (PR [#8905](https://github.com/vatesfr/xen-orchestra/pull/8905))
  - `DELETE /rest/v0/tasks/<task-id>` (PR [#8905](https://github.com/vatesfr/xen-orchestra/pull/8905))
  - `DELETE /rest/v0/vms/<vm-id>` (PR [#8938](https://github.com/vatesfr/xen-orchestra/pull/8938))
  - `DELETE /rest/v0/vm-templates/<vm-template-id>` (PR [#8938](https://github.com/vatesfr/xen-orchestra/pull/8938))
  - `DELETE /rest/v0/vm-snapshots/<vm-snapshot-id>` (PR [#8938](https://github.com/vatesfr/xen-orchestra/pull/8938))
  - `DELETE /rest/v0/vdis/<vdi-id>` (PR [#8961](https://github.com/vatesfr/xen-orchestra/pull/8961))
  - `DELETE /rest/v0/vdi-snapshots/<vdi-snapshot-id>` (PR [#8961](https://github.com/vatesfr/xen-orchestra/pull/8961))
  - `POST /rest/v0/tasks/<task-id>/actions/abort` (PR [#8908](https://github.com/vatesfr/xen-orchestra/pull/8908))
  - `POST /rest/v0/srs/<sr-id>/vdis` (PR [#8984](https://github.com/vatesfr/xen-orchestra/pull/8984))
  - `GET /rest/v0/vdis/<vdi-id>.(raw|vhd)` (PR [#8923](http://github.com/vatesfr/xen-orchestra/pull/8923))
  - `GET /rest/v0/vdi-snapshots/<vdi-snapshot-id>.(raw|vhd)` (PR [#8923](http://github.com/vatesfr/xen-orchestra/pull/8923))
  - `GET /rest/v0/vms/<vm-id>.(xva|ova)` (PR [#8929](https://github.com/vatesfr/xen-orchestra/pull/8929))
  - `GET /rest/v0/vm-templates/<vm-template-id>.(xva|ova)` (PR [#8929](https://github.com/vatesfr/xen-orchestra/pull/8929))
  - `GET /rest/v0/vm-snapshots/<vm-snapshot-id>.(xva|ova)` (PR [#8929](https://github.com/vatesfr/xen-orchestra/pull/8929))
  - `GET /rest/v0/groups/<group-id>/users` (PR [#8932](https://github.com/vatesfr/xen-orchestra/pull/8932))
  - `GET /rest/v0/users/<user-id>/groups` (PR [#8936](https://github.com/vatesfr/xen-orchestra/pull/8936))
  - `GET /rest/v0/users/me` (PR [#8985](https://github.com/vatesfr/xen-orchestra/pull/8985))
  - `GET /rest/v0/users/me/*` (PR [#8985](https://github.com/vatesfr/xen-orchestra/pull/8985))
  - **deprecated** `GET /rest/v0/backup/jobs/vm` (PR [#8970](https://github.com/vatesfr/xen-orchestra/pull/8970))
  - **deprecated** `GET /rest/v0/backup/jobs/vm/<backup-job-id>` (PR [#8970](https://github.com/vatesfr/xen-orchestra/pull/8970))
  - **deprecated** `GET /rest/v0/backup/jobs/metadata` (PR [#8970](https://github.com/vatesfr/xen-orchestra/pull/8970))
  - **deprecated** `GET /rest/v0/backup/jobs/metadata/<backup-job-id>` (PR [#8970](https://github.com/vatesfr/xen-orchestra/pull/8970))
  - **deprecated** `GET /rest/v0/backup/jobs/mirror` (PR [#8970](https://github.com/vatesfr/xen-orchestra/pull/8970))
  - **deprecated** `GET /rest/v0/backup/jobs/mirror/<backup-job-id>` (PR [#8970](https://github.com/vatesfr/xen-orchestra/pull/8970))
  - **deprecated** `GET /rest/v0/backup/logs` (PR [#8987](https://github.com/vatesfr/xen-orchestra/pull/8987))
  - **deprecated** `GET /rest/v0/backup/logs/<backup-log-id>` (PR [#8987](https://github.com/vatesfr/xen-orchestra/pull/8987))
  - **deprecated** `GET /rest/v0/restore/logs` (PR [#8987](https://github.com/vatesfr/xen-orchestra/pull/8987))
  - **deprecated** `GET /rest/v0/restore/logs/<restore-log-id>` (PR [#8987](https://github.com/vatesfr/xen-orchestra/pull/8987))
  - `GET /rest/v0/vms/<vm-id>/messages` (PR [#8988](https://github.com/vatesfr/xen-orchestra/pull/8988))
  - `GET /rest/v0/users/<user-id>/authentication_tokens` (PR [#8865](https://github.com/vatesfr/xen-orchestra/pull/8865))
  - `GET /rest/v0/vms/<vm-id>/tasks` (PR[#8955](https://github.com/vatesfr/xen-orchestra/pull/8955))
  - `GET /rest/v0/vm-snapshots/<vm-snapshot-id>/messages` (PR [#8997](https://github.com/vatesfr/xen-orchestra/pull/8997))
  - `GET /rest/v0/vm-templates/<vm-template-id>/messages` (PR [#8995](https://github.com/vatesfr/xen-orchestra/pull/8995))

- [REST API] Expose `/rest/v0/proxies` and `/rest/v0/proxies/<proxy-id>` (PR [#8920](https://github.com/vatesfr/xen-orchestra/pull/8920))
- [REST API] Expose `/rest/v0/vms/<vm-id>/backup-jobs` (PR [#8948](https://github.com/vatesfr/xen-orchestra/pull/8948))
- [REST API] Expose `/rest/v0/backup-jobs` and `/rest/v0/backup-jobs/<backup-job-id>` (PR [#8970](https://github.com/vatesfr/xen-orchestra/pull/8970))
- [REST API] Expose `/rest/v0/backup-logs` and `/rest/v0/backup-logs/<backup-log-id>` (PR [#8987](https://github.com/vatesfr/xen-orchestra/pull/8987))
- [REST API] Expose `/rest/v0/restore-logs` and `/rest/v0/restore-logs/<restore-log-id>` (PR [#8987](https://github.com/vatesfr/xen-orchestra/pull/8987))

- **XO 6:**
  - [Treeview] Add a debounce function to the search input to improve user experience (PR [#8892](https://github.com/vatesfr/xen-orchestra/pull/8892))
  - [i18n] Update some wordings in French translation (contribution by [@Luxinenglish](https://github.com/Luxinenglish)) (PR [#8983](https://github.com/vatesfr/xen-orchestra/pull/8983))
  - [i18n] Update Czech, Spanish, Italian, Dutch, Portuguese (Brazil), Russian and Ukrainian translations (PR [#8901](https://github.com/vatesfr/xen-orchestra/pull/8901))

### Bug fixes

- [Task/Schedule] Set sequences as completely done on success (PR [#8527](https://github.com/vatesfr/xen-orchestra/pull/8527))
- [Pool/HA] Prevent SRs from other pools to be selectable on HA enabling modal (PR [#8924](https://github.com/vatesfr/xen-orchestra/pull/8924))
- [VIFs] Fix sorting by VIF device (PR [#8877](https://github.com/vatesfr/xen-orchestra/pull/8877))
- [Home/Pool] Fix "an error has occurred" for non-admin users (PR [#8946](https://github.com/vatesfr/xen-orchestra/pull/8946))
- [Backup] Fix VDI_NOT_MANAGED error during incremental replication (PR [#8935](https://github.com/vatesfr/xen-orchestra/pull/8935))
- [Backup] Fix replication delta always falling back to full [Forum#11261](https://xcp-ng.org/forum/topic/11261/continuous-replication-jobs-creates-full-backups-every-time-since-2025-09-06-xo-from-source) (PR [#8971](https://github.com/vatesfr/xen-orchestra/pull/8971))
- [API] Fix resource set limits being deleted when calling `resourceSet.set` on the API (PR [#8979](https://github.com/vatesfr/xen-orchestra/pull/8979))
- [Plugins/Load balancer] Prevent mass migration when receiving incorrect host data (PR [#8965](https://github.com/vatesfr/xen-orchestra/pull/8965))
- [Backup] Fix _INTERNAL_ERROR(Failure(\"Expected string, got 'N'\"))_ for backup on VM with VTPM (PR [#8990](https://github.com/vatesfr/xen-orchestra/pull/8990))
- [XOA] Fix XOA UI showing expired license error during trial (PR [#8991](https://github.com/vatesfr/xen-orchestra/pull/8991))
- [SDN-controller] Fix `No PIF found in center` (PR [#8319](https://github.com/vatesfr/xen-orchestra/pull/9000))

- **XO 6:**
  - [VM/New] Fix `auto_poweron is an excess property and therefore is not allowed` during VM creation (PR [#8998](https://github.com/vatesfr/xen-orchestra/pull/8998))
  - [sdn-controller] Remove port for ICMP filtering (PR [#8488](https://github.com/vatesfr/xen-orchestra/pull/8488))
  - Fix the impossibility to change tab in the tasks quick panel (PR [#8930](https://github.com/vatesfr/xen-orchestra/pull/8930))

### Released packages

- complex-matcher 1.0.0
- @vates/types 1.12.0
- @xen-orchestra/backups 0.64.3
- @xen-orchestra/proxy 0.29.31
- xo-server-load-balancer 0.10.3
- @xen-orchestra/rest-api 0.17.0
- xo-server 5.190.0
- xo-server-sdn-controller 1.2.0
- xo-web 5.187.0
- @xen-orchestra/web-core 0.31.1
- @xen-orchestra/web 0.30.0

## **5.110.1** (2025-09-04)

### Enhancements

- [V2V] Add task to track library installation progress and error (PR [#8927](https://github.com/vatesfr/xen-orchestra/pull/8927))
- [Import] Make timeout for import xva from url configurable (PR [#8931](https://github.com/vatesfr/xen-orchestra/pull/8931))

### Bug fixes

- [XO6/New VM] Display only ISO VDIs for the ISO input (PR [#8922](https://github.com/vatesfr/xen-orchestra/pull/8922))
- [Backups] Display a warning in backup logs when delta replication falls back to a full replication (PR [#8926](https://github.com/vatesfr/xen-orchestra/pull/8926))
- [V2V] Fix resuming importing retransfering the full VM (PR [#8928](https://github.com/vatesfr/xen-orchestra/pull/8928))
- [V2V] Fix vddk check icon (PR [#8927](https://github.com/vatesfr/xen-orchestra/pull/8927))

### Released packages

- @xen-orchestra/xapi 8.4.1
- @xen-orchestra/backups 0.64.2
- @xen-orchestra/proxy 0.29.30
- @xen-orchestra/vmware-explorer 0.10.2
- @xen-orchestra/web 0.27.1
- xo-server 5.188.0
- xo-web 5.185.0

## **5.110.0** (2025-08-28)

### Highlights

- [V2V] Use vddk to transfer data from VMware (PR [#8840](https://github.com/vatesfr/xen-orchestra/pull/8840))
- [REST API] Expose `/rest/v0/docs/swagger.json` (PR [#8892](https://github.com/vatesfr/xen-orchestra/pull/8892))
- [web] Add link to the rest api docs (PR [#8902](https://github.com/vatesfr/xen-orchestra/pull/8902))
- [Backup/Sequences] Prevent sequences from ending prematurely when a backup job is skipped (PR [#8859](https://github.com/vatesfr/xen-orchestra/pull/8859))
- **XO 6**:
  - [Pool,Host,VM/Dashboard] Remember the last visited tab per object type (Pool/Host/VM) when navigating (PR [#8873](https://github.com/vatesfr/xen-orchestra/pull/8873))
  - [Site] Add Backup Jobs page (PR [#8889](https://github.com/vatesfr/xen-orchestra/pull/8889))
  - [Account Menu] Add link to REST API documentation (PR [#8904](https://github.com/vatesfr/xen-orchestra/pull/8904))
- **Migrated REST API endpoints**:
  - `GET /rest/v0/tasks` (PR [#8801](https://github.com/vatesfr/xen-orchestra/pull/8843))
  - `GET /rest/v0/tasks/<task-id>` (PR [#8801](https://github.com/vatesfr/xen-orchestra/pull/8843))

### Enhancements

- [Host/General] Display additional hardware data for Dell server (PR [#8861](https://github.com/vatesfr/xen-orchestra/pull/8861))
- [V2V] Show if any prerequisite on XO is missing before import (PR [#8840](https://github.com/vatesfr/xen-orchestra/pull/8840))
- [V2V] Show a form to install the VDDK library (PR [#8840](https://github.com/vatesfr/xen-orchestra/pull/8840))
- [V2V] Auto install library (PR [#8911](https://github.com/vatesfr/xen-orchestra/pull/8911))

- **Migrated REST API endpoints**:
  - `GET /rest/v0/hosts/<host-id>/smt` (PR [#8863](http://github.com/vatesfr/xen-orchestra/pull/8863))
  - `GET /rest/v0/vms/<vm-id>/vdis` (PR [#8876](http://github.com/vatesfr/xen-orchestra/pull/8876))
  - `GET /rest/v0/vm-templates/<vm-template-id>/vdis` (PR [#8876](http://github.com/vatesfr/xen-orchestra/pull/8876))
  - `GET /rest/v0/vm-snapshots/<vm-snapshot-id>/vdis` (PR [#8876](http://github.com/vatesfr/xen-orchestra/pull/8876))
  - `GET /rest/v0/vm-controllers/<vm-controller-id>/vdis` (PR [#8876](http://github.com/vatesfr/xen-orchestra/pull/8876))
  - `GET /rest/v0/pools/<pool-id>/missing_patches` (PR [#8871](http://github.com/vatesfr/xen-orchestra/pull/8871))
  - `GET /rest/v0/hosts/<host-id>/missing_patches` (PR [#8862](https://github.com/vatesfr/xen-orchestra/pull/8862))

- **XO 6**:
  - Replace native `select` with a new custom component (PR [#8681](https://github.com/vatesfr/xen-orchestra/pull/8681))
  - [i18n] Add Portuguese (Brazil) and update Czech, German, Spanish, Italian, Dutch and Swedish translations (PR [#8837](https://github.com/vatesfr/xen-orchestra/pull/8837))

### Bug fixes

- [Backups] Fix healthCheck triggered even when no data is transfered in delta backups (PR [#8879](https://github.com/vatesfr/xen-orchestra/pull/8879))
- [Backup] Update timeout in filesystem for expensive listing requests (PR [#8903](https://github.com/vatesfr/xen-orchestra/pull/8903))
- [Plugins/audit] Prevent audit plugin disabling from failing (PR [#8898](https://github.com/vatesfr/xen-orchestra/pull/8898))
- [Backup] fix error footer1 !== footer2 (PR [#8882](https://github.com/vatesfr/pull/8882))

### Released packages

- @vates/read-chunk 1.2.1
- @xen-orchestra/fs 4.6.3
- xo-common 0.9.0
- xen-api 4.7.4
- @vates/types 1.11.0
- @xen-orchestra/xapi 8.4.0
- @xen-orchestra/backups-cli 1.1.3
- @xen-orchestra/immutable-backups 1.0.24
- @xen-orchestra/mixins 0.16.5
- @xen-orchestra/rest-api 0.15.0
- xo-acl-resolver 0.5.2
- xo-server-audit 0.14.1
- xo-server-test 0.0.2
- vhd-lib 4.14.1
- @vates/nbd-client 3.2.1
- @xen-orchestra/backups 0.64.1
- @xen-orchestra/web-core 0.29.0
- @xen-orchestra/proxy 0.29.29
- @xen-orchestra/vmware-explorer 0.10.1
- @xen-orchestra/web 0.27.0
- xo-server 5.187.0
- xo-web 5.184.0

## **5.109.1** (2025-08-06)

### Bug fixes

- [SR/disks] Do not display "Image format" column if SR is ISO type (PR [#8852](https://github.com/vatesfr/xen-orchestra/pull/8852))
- Fix `incorrect state` error when trying to delete a disabled server [#11128](https://xcp-ng.org/forum/topic/11128/can-t-delete-disconnected-server-in-settings) (PR [#8854](https://github.com/vatesfr/xen-orchestra/pull/8854))

- **XO 6:**
  - [Pool,Host/Dashboard] CPU provisioning considers all VMs instead of just running VMs (PR [#8858](https://github.com/vatesfr/xen-orchestra/pull/8858))

### Released packages

- @xen-orchestra/web-core 0.26.1
- @xen-orchestra/rest-api 0.13.1
- @xen-orchestra/web 0.24.1
- xo-server 5.184.2
- xo-web 5.182.0

## **5.109.0** (2025-07-31)

### Highlights

- **XO 6:**
  - [SearchBar] Updated query search bar to work in responsive (PR [#8761](https://github.com/vatesfr/xen-orchestra/pull/8761))
  - [Sidebar] Updated sidebar to auto close when the screen is small (PR [#8760](https://github.com/vatesfr/xen-orchestra/pull/8760))
  - [i18n] Update Czech, German, Spanish, Italian, Dutch and Russian translations (PR [#8765](https://github.com/vatesfr/xen-orchestra/pull/8765))
  - [Pool/connect] add page to connect new pool (PR [#8763](https://github.com/vatesfr/xen-orchestra/pull/8763))
  - [Pool/dashboard] add pool dashboard information (PR [#8791](https://github.com/vatesfr/xen-orchestra/pull/8791))
  - [Site/dashboard] add alarms component in dashboard (PR [#8838](https://github.com/vatesfr/xen-orchestra/pull/8838))

### Enhancements

- **Migrated REST API endpoints**:
  - `GET /rest/v0/hosts/<host-id>/alarms` (PR [#8800](http://github.com/vatesfr/xen-orchestra/pull/8800))
  - `GET /rest/v0/networks/<network-id>/alarms` (PR [#8801](https://github.com/vatesfr/xen-orchestra/pull/8801))
  - `GET /rest/v0/pifs/<pif-id>/alarms` (PR [#8802](http://github.com/vatesfr/xen-orchestra/pull/8802))
  - `GET /rest/v0/vdis/<vdi-id>/alarms` (PR [#8824](http://github.com/vatesfr/xen-orchestra/pull/8824))
  - `GET /rest/v0/vdi-snapshots/<vdi-snapshot-id>/alarms` (PR [#8823](http://github.com/vatesfr/xen-orchestra/pull/8823))
  - `GET /rest/v0/vm-templates/<vm-template-id>/alarms` (PR [#8828](http://github.com/vatesfr/xen-orchestra/pull/8828))
  - `GET /rest/v0/hosts/<host-id>/logs.tgz` (PR [#8830](https://github.com/vatesfr/xen-orchestra/pull/8830))
  - `GET /rest/v0/srs/<sr-id>/alarms` (PR [#8810](http://github.com/vatesfr/xen-orchestra/pull/8810))
  - `GET /rest/v0/pools/<pool-id>/alarms` (PR [#8805](http://github.com/vatesfr/xen-orchestra/pull/8805))
  - `GET /rest/v0/vm-controllers/<vm-controller-id>/alarms` (PR [#8826](http://github.com/vatesfr/xen-orchestra/pull/8826))
  - `GET /rest/v0/vifs/<vif-id>/alarms` (PR [#8825](http://github.com/vatesfr/xen-orchestra/pull/8825))
  - `GET /rest/v0/vbds/<vbd-id>/alarms` (PR [#8822](http://github.com/vatesfr/xen-orchestra/pull/8822))
  - `GET /rest/v0/vms/<vm-id>/alarms` (PR [#8829](http://github.com/vatesfr/xen-orchestra/pull/8829))
  - `GET /rest/v0/vm-snapshots/<vm-snapshot-id>/alarms` (PR [#8827](http://github.com/vatesfr/xen-orchestra/pull/8827))
  - `PUT /rest/v0/groups/<group-id>/users/<user-id>` (PR [#8705](https://github.com/vatesfr/xen-orchestra/pull/8705))
  - `POST /rest/v0/users` (PR [#8697](https://github.com/vatesfr/xen-orchestra/pull/8697))
  - `POST /rest/v0/groups` (PR [#8703](https://github.com/vatesfr/xen-orchestra/pull/8703))
  - `PATCH /rest/v0/groups/<group-id>` (PR [#8790](https://github.com/vatesfr/xen-orchestra/pull/8790))
  - `PATCH /rest/v0/users/<user-id>` (PR [#8784](https://github.com/vatesfr/xen-orchestra/pull/8784))
  - `DELETE /rest/v0/users/<user-id>` (PR [#8698](https://github.com/vatesfr/xen-orchestra/pull/8698))
  - `DELETE /rest/v0/groups/<group-id>` (PR [#8704](https://github.com/vatesfr/xen-orchestra/pull/8704))
  - `DELETE /rest/v0/groups/<group-id>/users/<user-id>` (PR [#8773](https://github.com/vatesfr/xen-orchestra/pull/8773))

- [REST API] Expose `/rest/v0/pools/<pool-id>/dashboard` (PR [#8768](https://github.com/vatesfr/xen-orchestra/pull/8768))
- [REST API] Expose `/rest/v0/backup-repositories` and `/rest/v0/backup-repositories/<repository-id>` (PR [#8831](https://github.com/vatesfr/xen-orchestra/pull/8831))
- [REST API] Ability to create a VM with `name_description`, `memory` and `autoPoweron` (PR [#8798](https://github.com/vatesfr/xen-orchestra/pull/8798))
- [ACL] Confirmation message when deleting an ACL rule (PR [#8774](https://github.com/vatesfr/xen-orchestra/pull/8774))
- [xo-server] Display build commit at start-up and with `xo-server --help`
- [xo-server] Warn if build is out of sync with local git repository
- [Storage/Disks & VM/Disks] Add image format in disks tabs (PR [#8835](https://github.com/vatesfr/xen-orchestra/pull/8835))
- [Backups] Extra confirmation step when deleting specific VM backups (PR [#8813](https://github.com/vatesfr/xen-orchestra/pull/8813))
- [Storage/Advanced] Add supported_image_format in storage advanced tab (PR [#8834](https://github.com/vatesfr/xen-orchestra/pull/8834))

### Bug fixes

- [Backup] Fix full backup retry failing with EEXIST error (PR [#8776](https://github.com/vatesfr/xen-orchestra/pull/8776))
- [Backup] Force snapshot if one of its VDIs has a NOBAK tag (PR [#8820](https://github.com/vatesfr/xen-orchestra/pull/8820))
- [Backup] Better handling of filesystem error while reading file (PR [#8818](https://github.com/vatesfr/xen-orchestra/pull/8818))

- **XO 6:**
  - [Host/VM/Dashboard] Fix display error due to inversion of upload and download (PR [#8793](https://github.com/vatesfr/xen-orchestra/pull/8793))

- [Health] Fix labels and modals mentioning VMs instead of snapshots when deleting snapshots (PR [#8775](https://github.com/vatesfr/xen-orchestra/pull/8775))
- [REST API] Alarm time is now in milliseconds and body value is now in percentage (PR [#8802](https://github.com/vatesfr/xen-orchestra/pull/8802))
- [REST API/XOA/Dashboard] Fix some type issues. Some object may return `{error: true}` instead of `undefined` on error.`s3` and `other` object may be undefined (if no S3 or other backup repositories detected) (PR [#8806](https://github.com/vatesfr/xen-orchestra/pull/8806))
- [REST API] An unauthenticated request no longer creates a failed XO task `XO user authentication` ([#8821](https://github.com/vatesfr/xen-orchestra/pull/8821))
- [REST API/Dashboard] Consider a host disabled only if it is running ([#8833](https://github.com/vatesfr/xen-orchestra/pull/8833))

### Released packages

- @vates/generator-toolbox 1.0.4
- @vates/types 1.9.0
- @xen-orchestra/xapi 8.3.3
- @xen-orchestra/backups 0.63.0
- @xen-orchestra/backups-cli 1.1.2
- @xen-orchestra/immutable-backups 1.0.23
- @xen-orchestra/mixins 0.16.4
- @xen-orchestra/openflow 0.1.3
- @xen-orchestra/web-core 0.26.0
- @xen-orchestra/rest-api 0.13.0
- @xen-orchestra/web 0.24.0
- @xen-orchestra/fs 4.6.2
- @xen-orchestra/proxy 0.29.27
- xo-server 5.184.1
- xo-web 5.181.1

## **5.108.1** (2025-07-03)

### Enhancements

- **Migrated REST API endpoints**
  - `GET /rest/v0/hosts/<host-id>/audit.txt` (PR [#8757](https://github.com/vatesfr/xen-orchestra/pull/8757))

- [REST API] Expose `/rest/v0/pools/<pool-id>/stats` (PR [#8764](https://github.com/vatesfr/xen-orchestra/pull/8764))

### Bug fixes

- [VM/New] Fix `Cannot read properties of undefined (reading '$ref')` when creating VM configured to PXE boot (PR [#8782](https://github.com/vatesfr/xen-orchestra/pull/8782))
- [Backups] fix backup job getting stuck without NBD (PR [#8780](https://github.com/vatesfr/xen-orchestra/pull/8780))

- **XO 6:**
  - [Charts] Fix tooltip overflow when too close to the edge [Forum#11012](https://xcp-ng.org/forum/topic/11012/graph-in-v0.12.0-48bf9/2) (PR [#8779](https://github.com/vatesfr/xen-orchestra/pull/8779))

### Released packages

- @vates/nbd-client patch
- @vates/types minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi patch
- xen-api patch
- xo-server minor

## **5.108** (2025-06-30)

### Highlights

- **Azure Blob Storage**:
  - [Backups]: Implemented Azure Blob Storage for backups, Integrating with both the Azurite emulator and Azure (PRs [#8415](https://github.com/vatesfr/xen-orchestra/pull/8415) [#8753](https://github.com/vatesfr/xen-orchestra/pull/8753))

- **XO 6:**
  - [Dashboard] Cards are displayed as soon as they are ready (PR [#8695](https://github.com/vatesfr/xen-orchestra/pull/8695))
  - [VM/Dashboard] Display VM information in dashboard tab (PR [#8585](https://github.com/vatesfr/xen-orchestra/pull/8585))
  - [Pool/system] Display pool information in pool/system tab (PR [#8581](https://github.com/vatesfr/xen-orchestra/pull/8581))
  - New Select/Multi-Select component (PR [#8438](https://github.com/vatesfr/xen-orchestra/pull/8438))

- [REST API] Ability to add/remove a data_source in VMs `(PUT|DELETE) /rest/v0/vms/<vm-id>/stats/data_source/<data_source>` (PR [#8699](https://github.com/vatesfr/xen-orchestra/pull/8699))
- [Backup] Support qcow2 disks > 2TB for backup and replication (PR [#8668](https://github.com/vatesfr/xen-orchestra/pull/8668))
- [Export] Support qcow2 disks exports (PR [#8668](https://github.com/vatesfr/xen-orchestra/pull/8668))
- [VM] Ability to hide XSA-468 warnings for specific VMs by adding `HIDE_XSA468` tag (PR [#8665](https://github.com/vatesfr/xen-orchestra/pull/8665))
- Migrate `/rest/v0/dashboard` (PR [#8580](https://github.com/vatesfr/xen-orchestra/pull/8580))

### Enhancements

- **XO 6:**
  - [Host/Dashboard] Update RAM usage components wordings and update CPU provisioning logic (PR [#8648](https://github.com/vatesfr/xen-orchestra/pull/8648))
  - [Site/Dashboard] Update BackupIssues and VtsBackupState components to display data in table (PR [#8674](https://github.com/vatesfr/xen-orchestra/pull/8674))
  - [Site] Add "Site" level in treeview and add "Site" header and tabs (PR [#8694](https://github.com/vatesfr/xen-orchestra/pull/8694))
  - [Tab/Network] Updated side panel in tab network behavior for mobile view (PR [#8688](https://github.com/vatesfr/xen-orchestra/pull/8688))
  - [Site/Pool] Display pools table and side panel information in site/pools tab (PR [#8664](https://github.com/vatesfr/xen-orchestra/pull/8664))
  - [i18n] Update Czech, German, Spanish, Dutch, Russian translations (PR [#8643](https://github.com/vatesfr/xen-orchestra/pull/8643))
  - [Host/system] Display pGpu name in hardware specifications card in host/system tab (PR [#8740](https://github.com/vatesfr/xen-orchestra/pull/8740))
  - [Table] add pagination on table (PR [#8573](https://github.com/vatesfr/xen-orchestra/pull/8573))

- **Migrated REST API endpoints**
  - `/rest/v0/pools/<pool-id>/actions/emergency_shutdown` (PR [#8653](https://github.com/vatesfr/xen-orchestra/pull/8653))
  - `/rest/v0/pools/<pool-id>/actions/rolling_reboot` (PR [#8653](https://github.com/vatesfr/xen-orchestra/pull/8653))
  - `/rest/v0/pools/<pool-id>/actions/rolling_update` (PR [#8653](https://github.com/vatesfr/xen-orchestra/pull/8653))
  - `POST /rest/v0/pools/<pool-id>/vms` (PR [#8748](https://github.com/vatesfr/xen-orchestra/pull/8748))
  - `POST /rest/v0/pools/<pool-id>/actions/create_vm` (PR [#8658](https://github.com/vatesfr/xen-orchestra/pull/8658))

- [OTP] Change wording from "Password" to "OTP code" when enabling OTP (PR [#8666](https://github.com/vatesfr/xen-orchestra/pull/8666))
- [Backups] Fix `HANDLE_INVALID(SR)` when replicated to multiples tagret (PR [#8668](https://github.com/vatesfr/xen-orchestra/pull/8668))
- [REST API] Ability to create a network `POST /rest/v0/pools/<pool-id/actions/createNetwork` (PR [#8671](https://github.com/vatesfr/xen-orchestra/pull/8671))
- [REST API] Ability to delete a network `DELETE /rest/v0/networks/<network-id>` (PR [#8671](https://github.com/vatesfr/xen-orchestra/pull/8671))
- [REST API] Expose `GET /rest/v0/pcis` and `GET /rest/v0/pcis/<pci-id>` (PR [#8686](https://github.com/vatesfr/xen-orchestra/pull/8686))
- [REST API] expose `GET /rest/v0/pgpus` and `GET /rest/v0/pgpus/<pgpu-id>` (PR [#8684](https://github.com/vatesfr/xen-orchestra/pull/8684))
- [REST API] expose `DELETE /rest/v0/servers/<server-id>` (PR [#8710](https://github.com/vatesfr/xen-orchestra/pull/8710))
- [Backup reports] Make content of backup reports independant of 'Report when' parameter (PR [#8670](https://github.com/vatesfr/xen-orchestra/pull/8670))
- [i18n] Ability to switch language to ones newly present in XO6, but not available for XO5 (Thanks [p-bo](https://github.com/p-bo)!) (PR [#8711](https://github.com/vatesfr/xen-orchestra/pull/8711))
- [Backups]: Enable CBT only when the "purge snapshot data is enabled" (PR [#8735](https://github.com/vatesfr/xen-orchestra/pull/8735))
- [REST API] Expose `GET /rest/v0/sms` and `GET /rest/v0/sms/<sm-id>` (PR [#8696](https://github.com/vatesfr/xen-orchestra/pull/8696))
- [XO5/Tasks] hide pending/successful xo tasks (PR [#8676](https://github.com/vatesfr/xen-orchestra/pull/8676))
- [REST API] Expose `POST /rest/v0/vms/<vm-id>/actions/pause` (PR [#8744](https://github.com/vatesfr/xen-orchestra/pull/8744))
- [REST API] Expose `POST /rest/v0/vms/<vm-id>/actions/suspend` (PR [#8744](https://github.com/vatesfr/xen-orchestra/pull/8744))
- [REST API] Expose `POST /rest/v0/vms/<vm-id>/actions/resume` (PR [#8744](https://github.com/vatesfr/xen-orchestra/pull/8744))
- [REST API] Expose `POST /rest/v0/vms/<vm-id>/actions/unpause` (PR [#8744](https://github.com/vatesfr/xen-orchestra/pull/8744))
- [REST API] Add `hostId` in body of `POST /rest/v0/vms/<vm-id>/actions/start` to start a VM on a specific host (PR [#8744](https://github.com/vatesfr/xen-orchestra/pull/8744))

### Bug fixes

- [REST API] Ability to use `ndjson` query parameter also on migrated collections (PR [#8628](https://github.com/vatesfr/xen-orchestra/pull/8628))
- [Backup] Fix EBADF on mirror backup chaining (PR [#8706](https://github.com/vatesfr/xen-orchestra/pull/8706))
- [Backups]: All remotes timeout are now configurable (PR [#8707](https://github.com/vatesfr/xen-orchestra/pull/8707))
- [Server] Fix server deletion now fully disconnects and deletes (PR [#8710](https://github.com/vatesfr/xen-orchestra/pull/8710))
- [Home] Fix middle-click not opening VM, host, etc. in a new tab in Firefox (PR [#8756](https://github.com/vatesfr/xen-orchestra/pull/8756))
- [Host/Advanced] Ability to clear remote syslog (PR [#8746](https://github.com/vatesfr/xen-orchestra/pull/8746))

- **XO 6:**
  - [XO6/stats] Fix graphs that were sometimes not displayed or displayed incorrectly (PR [#8722](https://github.com/vatesfr/xen-orchestra/pull/8722))
  - [Host/Dashboard] Fix accent of tag list (PR [#8731](https://github.com/vatesfr/xen-orchestra/pull/8731))

### Released packages

- xo-remote-parser 0.10.0
- @xen-orchestra/fs 4.6.0
- xen-api 4.7.2
- @vates/task 0.6.2
- vhd-cli 0.9.4
- xo-server-auth-oidc 0.3.3
- xo-server-backup-reports 1.6.0
- xo-server-load-balancer 0.10.2
- xo-server-perf-alert 0.6.3
- xo-server-transport-nagios 1.0.3
- vhd-lib 4.14.0
- @xen-orchestra/disk-transform 1.1.0
- @xen-orchestra/qcow2 1.0.0
- @xen-orchestra/backups 0.62.0
- @xen-orchestra/backups-cli 1.1.1
- @xen-orchestra/immutable-backups 1.0.22
- @xen-orchestra/rest-api 0.10.0
- xo-acl-resolver 0.5.1
- xo-web 5.178.0
- @vates/types 1.7.0
- @xen-orchestra/xapi 8.3.1
- @xen-orchestra/web-core 0.23.0
- @xen-orchestra/proxy 0.29.24
- @xen-orchestra/web 0.21.0
- xo-server 5.180.1

## **5.107.2** (2025-06-05)

### Enhancements

- [VM] Ability to hide XSA-468 warnings for specific VMs by adding `HIDE_XSA468` tag (PR [#8665](https://github.com/vatesfr/xen-orchestra/pull/8665))
- [OTP] Change wording from "Password" to "OTP code" when enabling OTP (PR [#8666](https://github.com/vatesfr/xen-orchestra/pull/8666))

### Bug fixes

- [Backups] Fix `HANDLE_INVALID(SR)` when replicated to multiples tagret (PR [#8668](https://github.com/vatesfr/xen-orchestra/pull/8668))

### Released packages

- @vates/generator-toolbox 1.0.3
- @xen-orchestra/backups 0.61.1
- @xen-orchestra/proxy 0.29.21
- xo-server 5.178.2
- xo-web 5.176.0

## **5.107.1** (2025-05-28)

### Bug fixes

- [Templates] Fix Windows templates not being shown (PR [#8652](https://github.com/vatesfr/xen-orchestra/pull/8652))

### Released packages

- @vates/types 1.4.1
- xo-server 5.178.1

## **5.107.0** (2025-05-27)

### Highlights

- [REST] Ability to add a new server `POST rest/v0/servers` (PR [#8564](https://github.com/vatesfr/xen-orchestra/pull/8564))
- [REST] Ability to connect/disconnect a server `POST rest/v0/servers/<server-id>/actions/(connect|disconnect)` (PR [#8565](https://github.com/vatesfr/xen-orchestra/pull/8565))
- **Migrated REST API endpoints**
  - `/rest/v0/vms/<vm-id>/actions/clean_shutdown` (PR [#8612](https://github.com/vatesfr/xen-orchestra/pull/8612))
  - `/rest/v0/vms/<vm-id>/actions/hard_shutdown` (PR [#8612](https://github.com/vatesfr/xen-orchestra/pull/8612))
  - `/rest/v0/vms/<vm-id>/actions/clean_reboot` (PR [#8611](https://github.com/vatesfr/xen-orchestra/pull/8611))
  - `/rest/v0/vms/<vm-id>/actions/hard_reboot` (PR [#8611](https://github.com/vatesfr/xen-orchestra/pull/8611))
  - `/rest/v0/pifs` (PR [#8569](https://github.com/vatesfr/xen-orchestra/pull/8569))
  - `/rest/v0/pifs/<pif-id>` (PR [#8569](https://github.com/vatesfr/xen-orchestra/pull/8569))
  - `/rest/v0/vms/<vm-id>/actions/snapshot` (PR [#8622](https://github.com/vatesfr/xen-orchestra/pull/8622))
- **XO 6:**
  - [VM/system] Display system information in vm/system tab (PR [#8522](https://github.com/vatesfr/xen-orchestra/pull/8522))
  - [Host/System] Display system information in host/system tab (PR [#8521](https://github.com/vatesfr/xen-orchestra/pull/8521))
  - [i18n] Update Czech, German, Spanish, Dutch, Russian and Swedish translations (PR [#8534](https://github.com/vatesfr/xen-orchestra/pull/8534))

### Security

- [VM] Detect XSA-468 vulnerable VMs. Read our announcement on the [XCP-ng blog](https://xcp-ng.org/blog/2025/05/27/xsa-468-windows-pv-driver-vulnerabilities/) for more details. (PR [#8638](https://github.com/vatesfr/xen-orchestra/pull/8638))
- [LDAP] Fix a bug where if the `ID attribute` was misconfigured in the plugin, a user would be able to login as another user (PR [#8639](https://github.com/vatesfr/xen-orchestra/pull/8639))

### Enhancements

- **XO 6:**
  - [Host/Header] Add master host icon on host header (PR [#8512](https://github.com/vatesfr/xen-orchestra/pull/8512))
  - [Host/Dashboard] Update Quick Info section to display a link to the primary host (PR [#8606](https://github.com/vatesfr/xen-orchestra/pull/8606))
- [Netbox] Support version 4.3.x (PR [#8588](https://github.com/vatesfr/xen-orchestra/pull/8588))

### Bug fixes

- [Backups] mirror full backup bigger han 50GB from encrypted source (PR [#8570](https://github.com/vatesfr/xen-orchestra/pull/8570))
- [ACLs] Fix ACLs not being assigned properly when resource set is assigned to a VM (PR [#8571](https://github.com/vatesfr/xen-orchestra/pull/8571))
- [Plugins/Perf-alert] Fixing plugin configuration error happening while editing config [Forum#9658](https://xcp-ng.org/forum/post/90573) (PR [#8561](https://github.com/vatesfr/xen-orchestra/pull/8561))
- [Plugins/Perf-alert] Prevent non-running VMs and hosts to be monitored in specific cases [Forum#10802](https://xcp-ng.org/forum/topic/10802/performance-alerts-fail-when-turning-on-all-running-hosts-all-running-vm-s-etc) (PR [#8561](https://github.com/vatesfr/xen-orchestra/pull/8561))
- [Signin] Fix size of the icon on login pages for Safari browser [#8301](https://github.com/vatesfr/xen-orchestra/issues/8301) (PR [#8572](https://github.com/vatesfr/xen-orchestra/pull/8572)).
- [VM/Edit RAM] Fix hard-reboot being triggered instead of soft-reboot when RAM is edited and VM restarted (PR [#8592](https://github.com/vatesfr/xen-orchestra/pull/8592))
- [Hosts] Prevent a HOST_OFFLINE error from being logged when displaying offline hosts (PR [#8597](https://github.com/vatesfr/xen-orchestra/pull/8597))
- [XOA] Fix "an error has occurred" when XOA is not registered (PR [#8646](https://github.com/vatesfr/xen-orchestra/pull/8646))
- **XO 6**:
  - [VM] Add auto redirection from /vm/[id] to /vm/[id]/console (PR [#8553](https://github.com/vatesfr/xen-orchestra/pull/8553))
- [Hosts] Avoid getting XO tasks logs flooded with errors on `host.isPubKeyTooShort` (PR [#8605](https://github.com/vatesfr/xen-orchestra/pull/8605))
- [VM] Fix "an error has occurred" in Advanced tab when VTPM is `null` (PR [#8601](https://github.com/vatesfr/xen-orchestra/pull/8601))

### Released packages

- @xen-orchestra/fs 4.5.1
- @vates/generator-toolbox 1.0.2
- @vates/nbd-client 3.1.3
- @xen-orchestra/xapi 8.2.0
- xo-server-auth-oidc 0.3.2
- xo-server-netbox 1.9.0
- xo-server-perf-alert 0.6.2
- @vates/types 1.4.0
- @xen-orchestra/disk-transform 1.0.1
- @xen-orchestra/backups 0.61.0
- @xen-orchestra/backups-cli 1.0.32
- @xen-orchestra/immutable-backups 1.0.21
- @xen-orchestra/web-core 0.20.1
- @xen-orchestra/proxy 0.29.20
- @xen-orchestra/rest-api 0.8.0
- xo-server 5.178.0
- xo-server-auth-ldap 0.10.11
- @xen-orchestra/web 0.18.2
- xo-web 5.175.1

## **5.106.4** (2025-05-23)

### Released packages

- xo-web 5.174.1

## **5.106.3** (2025-05-22)

### Released packages

- xo-web 5.174.0

## **5.106.2** (2025-05-07)

### Bug fixes

- [Licence]: better handling of trial and free users (PR [#8557](https://github.com/vatesfr/xen-orchestra/pull/8557))

### Released packages

- xo-web 5.173.2

## **5.106.1** (2025-04-30)

### Bug fixes

- prevent XOA from failing with `an error has occurred` due to license problems (PR [#8551](https://github.com/vatesfr/xen-orchestra/pull/8551))

### Released packages

- xo-web 5.173.1

## **5.106.0** (2025-04-30)

### Highlights

- [Dashboard/Health] Display snapshots older than 30 days for which no schedules are enabled (PR [#8487](https://github.com/vatesfr/xen-orchestra/pull/8487))
- [Plugins/audit] Add an option to import audit logs from an XOA to another (PR [#8474](https://github.com/vatesfr/xen-orchestra/pull/8474))
- [V2V] Resume an incomplete warm migration (PR [#8440](https://github.com/vatesfr/xen-orchestra/pull/8440))
- [Licences] Warn a user when the XOA's licence is near expiration, handle expired licences (PR [#8523](https://github.com/vatesfr/xen-orchestra/pull/8523))
- [Plugin/Web hook] Web hook plugin now support `Office 365 connector` format (PR [#8498](https://github.com/vatesfr/xen-orchestra/pull/8498))
- [REST API] Expose `/rest/v0/schedules` and `/rest/v0/schedules/<schedule-id>` endpoints (PR [#8477](https://github.com/vatesfr/xen-orchestra/pull/8477))
- [REST API] Expose the possibility to run a schedule `/rest/v0/schedules/<schedule-id>/actions/run` (PR [#8477](https://github.com/vatesfr/xen-orchestra/pull/8477))
- **Migrated REST API endpoints**:
  - `/rest/v0/vifs` (PR [#8483](https://github.com/vatesfr/xen-orchestra/pull/8483))
  - `/rest/v0/vifs/<vif-id>` (PR [#8483](https://github.com/vatesfr/xen-orchestra/pull/8483))
  - `/rest/v0/pools` (PR [#8490](https://github.com/vatesfr/xen-orchestra/pull/8490))
  - `/rest/v0/pools/<pool-id>` (PR [#8490](https://github.com/vatesfr/xen-orchestra/pull/8490))
  - `/rest/v0/alarms` (PR [#8485](https://github.com/vatesfr/xen-orchestra/pull/8485))
  - `/rest/v0/alarms/<alarm-id>` (PR [#8485](https://github.com/vatesfr/xen-orchestra/pull/8485))
  - `/rest/v0/messages` (PR [#8485](https://github.com/vatesfr/xen-orchestra/pull/8485))
  - `/rest/v0/messages/<message-id>` (PR [#8485](https://github.com/vatesfr/xen-orchestra/pull/8485))
  - `/rest/v0/users` (PR [#8494](https://github.com/vatesfr/xen-orchestra/pull/8494))
  - `/rest/v0/users/<user-id>` (PR [#8494](https://github.com/vatesfr/xen-orchestra/pull/8494))
  - `/rest/v0/groups` (PR [#8496](https://github.com/vatesfr/xen-orchestra/pull/8496))
  - `/rest/v0/groups/<group-id>` (PR [#8496](https://github.com/vatesfr/xen-orchestra/pull/8496))
  - `/rest/v0/networks` (PR [#8497](https://github.com/vatesfr/xen-orchestra/pull/8497))
  - `/rest/v0/networks/<network-id>` (PR [#8497](https://github.com/vatesfr/xen-orchestra/pull/8497))

### Enhancements

- [VM/Advanced] Rename `Block migration` to `Prevent migration` (PR [#8500](https://github.com/vatesfr/xen-orchestra/pull/8500))
- [Host/Networks] PIFs can now be filtered by network names
- [Hub recipe] Upgrade Pyrgos/Kubernetes recipe to use MicroK8s (PR [#8530](https://github.com/vatesfr/xen-orchestra/pull/8530))
- **XO 6:**
  - [i18n] Update Swedish, Czech, Spanish, Persian, Italian, Russian and add Dutch translations (PR [#8465](https://github.com/vatesfr/xen-orchestra/pull/8465))
  - [Host/Header] Add master host icon on host header (PR [#8512](https://github.com/vatesfr/xen-orchestra/pull/8512))

### Bug fixes

- [Backups] Don't flood logs when a remote doesn't have any VM (PR [#8489](https://github.com/vatesfr/xen-orchestra/pull/8489))
- [Backups] Properly show a permission error during config backup (PR [#8489](https://github.com/vatesfr/xen-orchestra/pull/8489))
- [New VM] Fix `DEVICE_ALREADY_EXISTS(#)` (PR [#8473](https://github.com/vatesfr/xen-orchestra/pull/8473))
- [OpenAPI spec] Fixed some required properties being marked as optional (PR [#8480](https://github.com/vatesfr/xen-orchestra/pull/8480))
- [VM/Advanced] Do not show VM creator to non-admins [#8463](https://github.com/vatesfr/xen-orchestra/issues/8463) (PR [#8503](https://github.com/vatesfr/xen-orchestra/pull/8503))
- **XO 6:**
  - [VM/Create] Fix TS type-check errors (PR [#8472](https://github.com/vatesfr/xen-orchestra/pull/8472))

### Released packages

- @xen-orchestra/fs 4.5.0
- @vates/types 1.2.0
- @xen-orchestra/audit-core 0.4.0
- @xen-orchestra/backups 0.59.0
- @xen-orchestra/backups-cli 1.0.30
- @xen-orchestra/web-core 0.19.0
- @xen-orchestra/proxy 0.29.17
- xo-server-audit 0.14.0
- @vates/node-vsphere-soap 2.1.2
- @xen-orchestra/immutable-backups 1.0.19
- xo-vmdk-to-vhd 2.5.8
- @xen-orchestra/rest-api 0.6.0
- @xen-orchestra/vmware-explorer 0.9.5
- @xen-orchestra/web 0.17.1
- xo-server-web-hooks 0.4.0
- xo-web 5.173.0
- vhd-lib 4.12.0
- xo-server 5.177.2

## **5.105.0** (2025-03-31)

### Highlights

- **XO6**:
  - [Host/Network]: Display pifs information in side panel (PR [#8287](https://github.com/vatesfr/xen-orchestra/pull/8287))
  - [VM/Network]: Display vifs table in VM network tab (PR [#8442](https://github.com/vatesfr/xen-orchestra/pull/8442))
  - [VM/Network]: Display vifs information in side panel (PR [#8443](https://github.com/vatesfr/xen-orchestra/pull/8443))
  - [Host] Add dashboard view (PR [#8398](https://github.com/vatesfr/xen-orchestra/pull/8398))
  - [VM/New]: Add VM creation page and form (PR [#8324](https://github.com/vatesfr/xen-orchestra/pull/8324))
  - [i18n] Update Swedish, Czech, Spanish, Persian, German and add Italian, Russian and Ukrainian translations (PR [#8294](https://github.com/vatesfr/xen-orchestra/pull/8294))
- **Migrated REST API endpoints**:
  - `/rest/v0/vms/<vm-id>/stats` (PR [#8359](https://github.com/vatesfr/xen-orchestra/pull/8359))
  - `/rest/v0/vms/<vm-id>/actions/start` (PR [#8379](https://github.com/vatesfr/xen-orchestra/pull/8379))
  - `/rest/v0/hosts` (PR [#8372](https://github.com/vatesfr/xen-orchestra/pull/8372))
  - `/rest/v0/hosts/<host-id>` (PR [#8372](https://github.com/vatesfr/xen-orchestra/pull/8372))
  - `/rest/v0/hosts/<host-id>/stats` (PR [#8372](https://github.com/vatesfr/xen-orchestra/pull/8372))
  - `/rest/v0/srs` (PR [#8419](https://github.com/vatesfr/xen-orchestra/pull/8419))
  - `/rest/v0/srs/<sr-id>` (PR [#8419](https://github.com/vatesfr/xen-orchestra/pull/8419))
  - `/rest/v0/vbds` (PR [#8404](https://github.com/vatesfr/xen-orchestra/pull/8404))
  - `/rest/v0/vbds/<vbd-id>` (PR [#8404](https://github.com/vatesfr/xen-orchestra/pull/8404))
  - `/rest/v0/vdis` (PR [#8427](https://github.com/vatesfr/xen-orchestra/pull/8427))
  - `/rest/v0/vdis/<vdi-id>` (PR [#8427](https://github.com/vatesfr/xen-orchestra/pull/8427))
  - `/rest/v0/vdi-snapshots` (PR [#8427](https://github.com/vatesfr/xen-orchestra/pull/8427))
  - `/rest/v0/vdi-snapshots/<vdi-snapshot-id>` (PR [#8427](https://github.com/vatesfr/xen-orchestra/pull/8427))
  - `/rest/v0/servers` (PR [#8385](https://github.com/vatesfr/xen-orchestra/pull/8385))
  - `/rest/v0/servers/<server-id>` (PR [#8385](https://github.com/vatesfr/xen-orchestra/pull/8385))
  - `/rest/v0/vm-templates` (PR [#8450](https://github.com/vatesfr/xen-orchestra/pull/8450))
  - `/rest/v0/vm-templates/<vm-template-id>` (PR [#8450](https://github.com/vatesfr/xen-orchestra/pull/8450))
  - `/rest/v0/vm-controllers` (PR [#8454] (https://github.com/vatesfr/xen-orchestra/pull/8454))
  - `/rest/v0/vm-controllers/<vm-controller-id>` (PR [#8454] (https://github.com/vatesfr/xen-orchestra/pull/8454))
  - `/rest/v0/vm-snapshots` (PR [#8453](https://github.com/vatesfr/xen-orchestra/pull/8453))
  - `/rest/v0/vm-snapshots/<vm-snapshot-id>` (PR [#8453] (https://github.com/vatesfr/xen-orchestra/pull/8453))
- [RPU] Allows to perform an RPU even if an XOSTOR is present on the pool (PR [#8455](https://github.com/vatesfr/xen-orchestra/pull/8455))
- [V2V] Fix assert error on import delta from esxi < 7.5 (PR [#8422](https://github.com/vatesfr/xen-orchestra/pull/8422))
- [New VM] Configure ACLs directly from VM creation form [#6996](https://github.com/vatesfr/xen-orchestra/issues/6996) (PR [#8412](https://github.com/vatesfr/xen-orchestra/pull/8412))
- [Plugins/Perf-alert] Fixing alert email notifications to be resent every minute for no reason [Forum#9658](https://xcp-ng.org/forum/topic/9658/lots-of-performance-alerts-after-upgrading-xo-to-commit-aa490) [Forum#10447](https://xcp-ng.org/forum/topic/10447/perf-alert-plugin-lots-of-alerts-but-no-option-to-exclude-sr) (PR [#8408](https://github.com/vatesfr/xen-orchestra/pull/8408))

### Enhancements

- [Netbox] Support version 4.2.x (PR [#8417](https://github.com/vatesfr/xen-orchestra/pull/8417))
- [VM] Updated Nested Virtualization handling to use `platform:nested-virt` for XCP-ng 8.3+ (PR [#8395](https://github.com/vatesfr/xen-orchestra/pull/8395))

### Bug fixes

- [VM/New] Fix _OTHER_OPERATION_IN_PROGRESS_ when creating a VM that requires a VDI migration (PR [#8399](https://github.com/vatesfr/xen-orchestra/pull/8399))
- [REST API] Fix _Internal Error_ when importing a VM without default SR on the pool (PR [#8409](https://github.com/vatesfr/xen-orchestra/pull/8409))
- [REST API] Fix the SR ID ignored when importing a VM (PR [#8409](https://github.com/vatesfr/xen-orchestra/pull/8409))
- [Netbox] Fix synchronization not working if `checkNetboxVersion` is disabled in the config (PR [#8416](https://github.com/vatesfr/xen-orchestra/pull/8416))
- [Continuous replication]: Fix `"Expected "actual" to be strictly unequal to: undefined"` when adding a new disk to an already replicated VM (PR [#8400](https://github.com/vatesfr/xen-orchestra/pull/8400))
- [Netbox] Fix `500 Internal Server Error` when 2 VMs have the same name but different case (PR [#8413](https://github.com/vatesfr/xen-orchestra/pull/8413))
- [Backups] Fix `Unsupported header 'x-amz-checksum-mode' received for this API call.` on backblaze (PR [#8393](https://github.com/vatesfr/xen-orchestra/pull/8393))
- [Backup] Fix remove automatic disabling of CBT on export failure (PR [#8446](https://github.com/vatesfr/xen-orchestra/pull/8446))
- [REST API] Correctly return a 404 not found error when trying to get a backup log that does not exist (PR [#8457](https://github.com/vatesfr/xen-orchestra/pull/8457))

### Released packages

- @xen-orchestra/fs 4.4.1
- @xen-orchestra/xapi 8.1.1
- @xen-orchestra/backups 0.58.4
- @xen-orchestra/proxy 0.29.16
- @xen-orchestra/vmware-explorer 0.9.3
- xo-server-audit 0.13.0
- xo-server-netbox 1.8.0
- xo-server-perf-alert 0.6.1
- @vates/types 1.1.1
- @xen-orchestra/web-core 0.18.0
- @xen-orchestra/rest-api 0.3.0
- @xen-orchestra/web 0.15.0
- xo-server 5.176.0
- xo-server-backup-reports 1.5.1
- xo-web 5.171.0

## **5.104.1** (2025-03-04)

### Enhancements

- [Changed Block Tracking] Disabling CBT now cleanup the full disk and snapshot chains (PR [#8313](https://github.com/vatesfr/xen-orchestra/pull/8313))
- **XO6**:
  - [Pool/Network]: Display networks and host internal networks information in side panel (PR [#8286](https://github.com/vatesfr/xen-orchestra/pull/8286))

### Released packages

- vhd-lib 4.11.3
- @xen-orchestra/xapi 8.1.0
- @xen-orchestra/backups 0.58.3
- @xen-orchestra/proxy 0.29.15
- @xen-orchestra/web 0.13.0
- xo-server 5.174.0

## **5.104.0** (2025-02-27)

### Highlights

- [REST API] Swagger interface available on `/rest/v0/docs` endpoint. Endpoint documentation will be added step by step (PR [#8316](https://github.com/vatesfr/xen-orchestra/pull/8316))
- **XO6**:
  - [Dashboard] Adding a mobile layout (PR [#8268](https://github.com/vatesfr/xen-orchestra/pull/8268))
- [Hosts] Smart reboot improvements : unexpected suspend failures will automatically fall back (PR [#8333](https://github.com/vatesfr/xen-orchestra/pull/8333))
- [REST API] VM/Host stats available at `/rest/v0/<vms|hosts>/<id>/stats` (PR [#8378](https://github.com/vatesfr/xen-orchestra/pull/8378))
- [REST API] Implement CRUD for `groups` (PRs [#8276](https://github.com/vatesfr/xen-orchestra/pull/8276), [#8277](https://github.com/vatesfr/xen-orchestra/pull/8277), [#8278](https://github.com/vatesfr/xen-orchestra/pull/8278), [#8334](https://github.com/vatesfr/xen-orchestra/pull/8334), [#8336](https://github.com/vatesfr/xen-orchestra/pull/8336))
- [REST API] Ability to create a user (PR [#8282](https://github.com/vatesfr/xen-orchestra/pull/8282))
- [REST API] Ability to delete/update a user (PRs [#8283](https://github.com/vatesfr/xen-orchestra/pull/8283), [#8343](https://github.com/vatesfr/xen-orchestra/pull/8343))
- [Self Service] Allow Self Service users to attach disks to their VMs (PR [#8384](https://github.com/vatesfr/xen-orchestra/pull/8384))

### Security

- Ensure password is not logged in error messages when adding hosts to a pool (PR [#8369](https://github.com/vatesfr/xen-orchestra/pull/8369))

### Enhancements

- [Plugin/backup-reports] Add VM Description to the backup report. (contribution made by [@truongtx8](https://github.com/truongtx8)) (PR [#8253](https://github.com/vatesfr/xen-orchestra/pull/8253))
- **XO6**:
  - [i18n] Add Swedish, update Czech and Spanish translations (contributions made by [@xiscoj](https://github.com/xiscoj), [@p-bo](https://github.com/p-bo) and [Jonas](https://translate.vates.tech/user/Jonas/)) (PR [#8294](https://github.com/vatesfr/xen-orchestra/pull/8294))
  - [i18n] Merge XO 6 translations files into one file in web-core ([PR #8380](https://github.com/vatesfr/xen-orchestra/pull/8380))

### Bug fixes

- [SDN-controller] Fix _No PIF found_ error when creating a private network [#8027](https://github.com/vatesfr/xen-orchestra/issues/8027) (PR [#8319](https://github.com/vatesfr/xen-orchestra/pull/8319))
- [V2V] Fix `fail to power off vm vm-XXXXXX, state:queued.` when powering down source VM (PR [#8328](https://github.com/vatesfr/xen-orchestra/pull/8328))
- [V2] Fix `Cannot read properties of undefined (reading 'map')` with empty datastore (PR [#8311](https://github.com/vatesfr/xen-orchestra/pull/8311))
- [Plugin/audit] Do not log call to `host.getBiosInfo` and `host.getMdadmHealth`
- [xo-cli] Fix timeouts when using the legacy JSON-RPC API (e.g. exporting a VM)
- [Plugin/audit] Do not log getBiosInfo and getSmartctlHealth API calls [Forum#89777](https://xcp-ng.org/forum/post/89777) (PR [#8353](https://github.com/vatesfr/xen-orchestra/pull/8353))

### Released packages

- @vates/task 0.6.1
- xo-server-auth-oidc 0.3.1
- xo-server-backup-reports 1.5.0
- xo-server-sdn-controller 1.1.0
- @xen-orchestra/backups 0.58.2
- @xen-orchestra/mixins 0.16.3
- @xen-orchestra/vmware-explorer 0.9.2
- @xen-orchestra/xapi 8.0.1
- @vates/generator-toolbox 1.0.1
- @xen-orchestra/rest-api 0.1.2
- xen-api 4.7.1
- @vates/types 1.0.1
- @xen-orchestra/proxy 0.29.14
- xo-cli 0.32.2
- xo-server-audit 0.12.4
- @xen-orchestra/web-core 0.16.0
- @xen-orchestra/web 0.12.0
- xo-server 5.173.0
- xo-web 5.169.0

## **5.103.1** (2025-02-04)

### Enhancements

- [Settings/Servers] Display last known pool name as server default label (PR [#8206](https://github.com/vatesfr/xen-orchestra/pull/8206))
- **XO6**:
  - [Dashboard] Display size used by XO replications (PR [#8300](https://github.com/vatesfr/xen-orchestra/pull/8300))

### Bug fixes

- [VM/New] Fix _Int64 expected, got 'N'_ when trying to create a VM without passing VDI sizes in `existingDisks` (PR [#8291](https://github.com/vatesfr/xen-orchestra/pull/8291))
- [XO6/Dashboard] Fixes the display of percentages in the _Storage repository_ and _Backup repository_ cards (PR [#8306](https://github.com/vatesfr/xen-orchestra/pull/8306))

### Released packages

- @xen-orchestra/web-core 0.13.0
- @xen-orchestra/web 0.9.0
- xo-server 5.170.0

## **5.103.0** (2025-01-30)

### Highlights

- [Backup] New [ChaCha20-Poly1305](https://en.wikipedia.org/wiki/ChaCha20-Poly1305) encryption for remotes, allow encrypted files larger than 64GB (PR [#8237](https://github.com/vatesfr/xen-orchestra/pull/8237))
- [Backup] Don't checksum encrypted full backup because encryption already handles it (PR [#8270](https://github.com/vatesfr/xen-orchestra/pull/8270))
- [Backups/Logs] Display mirror backup transfer size (PR [#8224](https://github.com/vatesfr/xen-orchestra/pull/8224))
- [Settings/Remotes] Only allow using encryption when using data block storage to prevent errors during backups (PR [#8244](https://github.com/vatesfr/xen-orchestra/pull/8244))
- Fix _Rolling Pool Update_ and _Install Patches_ for XenServer >= 8.4 [Forum#9550](https://xcp-ng.org/forum/topic/9550/xenserver-8-patching/27?_=1736774010376) (PR [#8241](https://github.com/vatesfr/xen-orchestra/pull/8241))
- [New/VM] Fix premature destruction of the cloudConfig VDI when using the option _destroyCloudConfigVdiAfterBoot_ [#8219](https://github.com/vatesfr/xen-orchestra/issues/8219) (PR [#8247](https://github.com/vatesfr/xen-orchestra/pull/8247))
- [V2V] Improve compatiblity with VSphere handling multiple vSAN storages (PR [#8243](https://github.com/vatesfr/xen-orchestra/pull/8243))
- **XO 6**:
  - [UI] Use user language set in XO 5 to set the language in XO 6 (PR [#8242](https://github.com/vatesfr/xen-orchestra/pull/8242))
  - [Console] Add fullscreen functionality for console (PR [#8238](https://github.com/vatesfr/xen-orchestra/pull/8238))
  - [Pool/Networks]: Display networks and host internal networks lists in pool view (PR [#8182](https://github.com/vatesfr/xen-orchestra/pull/8182))
  - [Host/Networks]: Display Pifs lists in host view (PR [#8198](https://github.com/vatesfr/xen-orchestra/pull/8198))

### Enhancements

- **XO 6**:
  - [Console] Displays a loader when the console is loading (PR [#8226](https://github.com/vatesfr/xen-orchestra/pull/8226))
  - [i18n] Add Spanish translation (contribution made by [@DSJ2](https://github.com/DSJ2)) (PR [#8220](https://github.com/vatesfr/xen-orchestra/pull/8220))
  - [Console] Add Ctrl+Alt+Del functionality to console (PR [#8239](https://github.com/vatesfr/xen-orchestra/pull/8239))
  - [Console] Adding a border when console is focused (PR [#8235](https://github.com/vatesfr/xen-orchestra/pull/8235))

### Bug fixes

- Fix SR tags not being listed in tag selectors (PR [#8251](https://github.com/vatesfr/xen-orchestra/pull/8251))
- [Plugins/usage-report] Prevent the report creation from failing over and over when previous stats file is empty or incorrect (PR [#8240](https://github.com/vatesfr/xen-orchestra/pull/8240))
- [Backup/LTR] Fix computation for the last week of the year (PR [#8269](https://github.com/vatesfr/xen-orchestra/pull/8269))
- [New/Storage] Correctly display error if storage detection failed for HBA or ZFS (PR [#8250](https://github.com/vatesfr/xen-orchestra/pull/8250))
- Fix error `sr.getAllUnhealthyVdiChainsLength(...) [36ms] =!> TypeError: Cannot read properties of undefined (reading 'managed')` (PR [#8273](https://github.com/vatesfr/xen-orchestra/pull/8273))
- [Backups] Fix error `Cannot read properties of undefined (reading 'endsWith')` (PR [#8275](https://github.com/vatesfr/xen-orchestra/pull/8275))
- **XO 6**:
  - [Pool/Network] Fix issue with network status (PR [#8284](https://github.com/vatesfr/xen-orchestra/pull/8284))

### Released packages

- @xen-orchestra/fs 4.4.0
- @xen-orchestra/xapi 7.11.0
- @xen-orchestra/backups-cli 1.0.29
- @xen-orchestra/immutable-backups 1.0.17
- @xen-orchestra/vmware-explorer 0.9.0
- xo-server-audit 0.12.2
- xo-server-usage-report 0.10.7
- @xen-orchestra/backups 0.58.1
- @xen-orchestra/web-core 0.12.0
- @xen-orchestra/proxy 0.29.11
- @xen-orchestra/web 0.8.0
- xo-server 5.169.1
- xo-web 5.168.1

## **5.102.1** (2025-01-09)

### Bug fixes

- [Plugin/backup-reports] Backup reports were not sent on failure with storage issue on remote (PR [#8229](https://github.com/vatesfr/xen-orchestra/pull/8229))

### Released packages

- xo-server-backup-reports 1.4.4

## **5.102.0** (2024-12-30)

### Highlights

- [Backup] Add _Merge backups synchronously_ advanced setting (PR [#8177](https://github.com/vatesfr/xen-orchestra/pull/8177))
- [Backup] VMs with the tags `xo:no-health-check` or `xo:no-health-check=REASON` will not be included in automatic by Health Check (PR [#8189](https://github.com/vatesfr/xen-orchestra/pull/8189))
- [REST API] Add the number of connected/unreachable/unknown pools in the `/dashboard` endpoint (PR [#8203](https://github.com/vatesfr/xen-orchestra/pull/8203))
- [REST API] When creating a VM, it is possible to create more VDIs or delete/update template's VDIs (PR [#8167](https://github.com/vatesfr/xen-orchestra/pull/8167))
- [Signin] Start transitioning towards XO 6 Design System (PR [#8209](https://github.com/vatesfr/xen-orchestra/pull/8209))
- [VM/Advanced] Ability to create/edit/delete XenStore entries (PR [#8174](https://github.com/vatesfr/xen-orchestra/pull/8174))
- [Jobs] _Rolling Pool Reboot_ and _Rolling Pool Update_ can now be planned as a Job (PR [#8185](https://github.com/vatesfr/xen-orchestra/pull/8185))
- [Dashboard/Health] Add `BOND_STATUS_CHANGED` and `MULTIPATH_PERIODIC_ALERT` in alarms list (PR [#8199](https://github.com/vatesfr/xen-orchestra/pull/8199))
- [Host/Advanced] Display MDADM health information (PR [#8190](https://github.com/vatesfr/xen-orchestra/pull/8190))
- [Pool, Host/Patches] List missing patches for `>= 8.4` XenServer hosts [Forum#9550](https://xcp-ng.org/forum/topic/9550/xenserver-8-patching/20) (PR [#8183](https://github.com/vatesfr/xen-orchestra/pull/8183))

### Security

> Security fixes and new features should go in this section

- [Host/Patches] Users with non-admin permissions on hosts can no longer update them (PR [#8176](https://github.com/vatesfr/xen-orchestra/pull/8176))

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **XO 6**:
  - [Dashboard] Pools status (PR [#7800](https://github.com/vatesfr/xen-orchestra/pull/7800))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM] Fix `VDI_NOT_IN_MAP` error during migration (PR [#8179](https://github.com/vatesfr/xen-orchestra/pull/8179))
- [Backups/CBT] Improve enabling/disabling CBT on slower storages (PR [#8184](https://github.com/vatesfr/xen-orchestra/pull/8184))
- [New/Network] Fix `Pool is undefined` when creating a private network (PR [#8188](https://github.com/vatesfr/xen-orchestra/pull/8188))

### Released packages

- xen-api 4.7.0
- @xen-orchestra/backups 0.57.0
- @xen-orchestra/backups-cli 1.0.28
- @xen-orchestra/immutable-backups 1.0.16
- @xen-orchestra/web-core 0.10.0
- @xen-orchestra/web 0.6.0
- xo-web 5.167.0
- @xen-orchestra/xapi 7.10.0
- @xen-orchestra/proxy 0.29.9
- xo-server 5.168.1

## **5.101.0** (2024-11-29)

### Highlights

- [Proxies] Display the current proxy version (PR [#8104](https://github.com/vatesfr/xen-orchestra/pull/8104))
- [VM/Advanced] Add ability to block/unblock migration (PR [#8129](https://github.com/vatesfr/xen-orchestra/pull/8129))
- [Backup] Long-term retention (GFS) (PRs [#7999](https://github.com/vatesfr/xen-orchestra/pull/7999) [#8141](https://github.com/vatesfr/xen-orchestra/pull/8141))
- [Host/Advanced] Allow bypassing blocked migration in maintenance mode (PR [#8149](https://github.com/vatesfr/xen-orchestra/pull/8149))
- [Host/General] Shows if a BIOS update is available for 2CRSi server (PR [#8146](https://github.com/vatesfr/xen-orchestra/pull/8146))
- [REST/VM] When creating a VM, the template's VIFs are created. It is also possible to create more VIFs or delete/update template's VIFs (PR [#8137](https://github.com/vatesfr/xen-orchestra/pull/8137))
- [backups] Handle VTPM content on incremental backup/replication/restore, including differential restore (PR [#8139](https://github.com/vatesfr/xen-orchestra/pull/8139))

- **XO 6**:
  - [VM,Host/Console] Display _Console Clipboard_ and _Console Actions_ (PR [#8125](https://github.com/vatesfr/xen-orchestra/pull/8125))
  - [i18n] Add Czech translation (contribution made by [@p-bo](https://github.com/p-bo)) (PR [#8099](https://github.com/vatesfr/xen-orchestra/pull/8099))
  - Add 404 page (PR [#8145](https://github.com/vatesfr/xen-orchestra/pull/8145))

### Enhancements

- **XO 6**:
  - [Header] Use new `UiAccountMenuButton` component for user menu button (PR [#8143](https://github.com/vatesfr/xen-orchestra/pull/8143))

### Bug fixes

- [Host/Network] When reconfiguring IP address on a PIF, no IPv6 reconfiguration if no IPv6 (PR [#8119](https://github.com/vatesfr/xen-orchestra/pull/8119))
- [Remotes] Fix NFS port (PR [#8085](https://github.com/vatesfr/xen-orchestra/pull/8085))
- [Plugins/Perf-alert] Fix unwritable SRs being monitored [Forum#9619](https://xcp-ng.org/forum/topic/9619/performance-alert-plugin-not-handling-removable-srs-correctly) (PR [#8113](https://github.com/vatesfr/xen-orchestra/pull/8113))
- [ISO SR/IPv6] Fix support of IPv6 ISO SR (PR [#8134](https://github.com/vatesfr/xen-orchestra/pull/8134))
- [VM/New] Cloudbase-Init is now correctly supported (PR [#8154](https://github.com/vatesfr/xen-orchestra/pull/8154))

### Packages to release

- @xen-orchestra/fs 4.3.0
- xo-server-perf-alert 0.6.0
- @vates/fatfs 0.11.0
- vhd-lib 4.11.2
- @xen-orchestra/xapi 7.8.0
- @xen-orchestra/backups 0.55.0
- @xen-orchestra/backups-cli 1.0.26
- @xen-orchestra/immutable-backups 1.0.14
- @xen-orchestra/web-core 0.7.0
- @xen-orchestra/proxy 0.29.6
- @xen-orchestra/web 0.5.0
- xo-server 5.164.0
- xo-web 5.163.0

## **5.100.2** (2024-11-14)

### Enhancements

- Ignore leading and trailing spaces when editing VM/Pools/Hosts/SRs names and descriptions (PR [#8115](https://github.com/vatesfr/xen-orchestra/pull/8115))
- [VM/Advanced] in Nested virtualization section, add warning tooltip and link to documentation (PR [#8107](https://github.com/vatesfr/xen-orchestra/pull/8107))

### Bug fixes

- [Backup/CBT] use asynchronous method to list changed block, reducing the number of fall back to full backup
- [Backups] handle incremental doing base (full) each time (PR [#8126](https://github.com/vatesfr/xen-orchestra/pull/8126))
- [Backup/Health Check] Better detection of guest tools even when they do not properly report their version number

### Released packages

- @xen-orchestra/log 0.7.1
- @xen-orchestra/xapi 7.7.1
- @xen-orchestra/backups 0.54.3
- @xen-orchestra/proxy 0.29.4
- xo-server 5.161.0
- xo-web 5.161.0

## **5.100.1** (2024-11-07)

### Enhancements

- [Dashboard/Health] Do not count PVS cache VDI as orphan VDIs [#7938](https://github.com/vatesfr/xen-orchestra/issues/7938) (PR [#8039](https://github.com/vatesfr/xen-orchestra/pull/8039))
- [OTP] Use numeric mode for easier input on mobile devices

### Bug fixes

- [Remote] Better encoding of special chars in username in remote (PR [#8106](https://github.com/vatesfr/xen-orchestra/pull/8106))
- [Backup] Connect sequentially to hosts when using multiple NBD to alleviate a race condition leading to `VDI_IN_USE` errors (PR [#8086](https://github.com/vatesfr/xen-orchestra/pull/8086))

### Released packages

- xo-remote-parser 0.9.3
- @vates/nbd-client 3.1.2
- xo-server 5.160.0
- xo-web 5.160.0

## **5.100.0** (2024-10-31)

### Highlights

- [REST API] Ability to generate an authentication token via `POST /rest/v0/users/authentication_tokens` (using Basic Authentication) (PR [#8065](https://github.com/vatesfr/xen-orchestra/pull/8065))
- [Home/VMs] Ability to filter by MAC address (don't forget quotes: `"70:1A:83:62:90:D0"`)
- [REST API] Ability to pass a cloud configuration when creating VM (For Cloud-Init template) (PR [#8070](https://github.com/vatesfr/xen-orchestra/pull/8070))
- [V2V] Fix failing transfer at the power off phase (PR [#7839](https://github.com/vatesfr/xen-orchestra/pull/7839))
- [Settings/ACLs] Ability to filter objects by tags (PR [#8068](https://github.com/vatesfr/xen-orchestra/pull/8068))
- [Netbox] Synchronize VM description and notes/comments (PR [#8083](https://github.com/vatesfr/xen-orchestra/pull/8083))

### Enhancements

- [New/VM] cloud-init template variable `%` is replaced by `{index}` to avoid interfering with [Jinja templating](https://jinja.palletsprojects.com/) [Forum#84696](https://xcp-ng.org/forum/post/84696)
  - To avoid breaking existing workflows, `%` still works when _Multiple VMs_ is enabled but is deprecated.

### Bug fixes

- [Backup/Mirror] Fix `checkbasevdi must be called before updateUuidAndChain` error (PR [#8037](https://github.com/vatesfr/xen-orchestra/pull/8037))
- [Backups] Fix MESSAGE_METHOD_UNKNOWN(VDI.get_cbt_enabled) on XenServer < 7.3 (PR [#8038](https://github.com/vatesfr/xen-orchestra/pull/8038))
- [SR/New] Fix reattach button not displayed for HBA (PR [#7986](https://github.com/vatesfr/xen-orchestra/pull/7986))
- [New VM] Fix cryptic error notification (PR [#8052](https://github.com/vatesfr/xen-orchestra/pull/8052))
- [Netbox] Ignore tags that have an empty label (PR [#8056](https://github.com/vatesfr/xen-orchestra/pull/8056))
- [Tags] Ability to remove blank tags from VMs/hosts/pools (PR [#8058](https://github.com/vatesfr/xen-orchestra/pull/8058))
- [Plugin/audit] Do not log call to `host.isPubKeyTooShort` [Forum#84464](https://xcp-ng.org/forum/post/84464)
- [Backup] fix VDI_INCOMPATIBLE_TYPE error (PR [#8043](https://github.com/vatesfr/xen-orchestra/pull/8043))
- [Backups] Fix handling of alias without vhd in cleanVm (PR [#8053](https://github.com/vatesfr/xen-orchestra/pull/8053))
- [Backup] keep only one snapshot for all the schedules when snapshot retention is zero (PR [#8051](https://github.com/vatesfr/xen-orchestra/pull/8051))
- [Backup/Restore] Fix differential restore with purge snapshot (PR [#8082](https://github.com/vatesfr/xen-orchestra/pull/8082))
- [Remotes] Fix NFS remote encryption "ENOENT metadata.json" error (PR [#8081](https://github.com/vatesfr/xen-orchestra/pull/8081))

### Released packages

- @xen-orchestra/log 0.7.0
- @vates/disposable 0.1.6
- vhd-lib 4.11.1
- @vates/fuse-vhd 2.1.2
- @vates/nbd-client 3.1.1
- @vates/node-vsphere-soap 2.1.1
- @xen-orchestra/audit-core 0.3.1
- @xen-orchestra/immutable-backups 1.0.13
- @xen-orchestra/mixin 0.2.0
- xo-server-audit 0.12.1
- xo-server-auth-ldap 0.10.10
- xo-server-backup-reports 1.4.3
- xo-server-load-balancer 0.10.1
- xo-server-perf-alert 0.5.1
- xo-server-sdn-controller 1.0.11
- xo-server-test 0.0.1
- xo-server-transport-nagios 1.0.2
- xo-server-usage-report 0.10.6
- xo-server-web-hooks 0.3.4
- @xen-orchestra/fs 4.2.1
- xen-api 4.5.0
- @vates/task 0.6.0
- @xen-orchestra/xapi 7.7.0
- @xen-orchestra/backups 0.54.2
- @xen-orchestra/web-core 0.4.0
- @xen-orchestra/mixins 0.16.2
- @xen-orchestra/proxy 0.29.3
- @xen-orchestra/vmware-explorer 0.8.5
- @xen-orchestra/web 0.3.1
- xo-cli 0.32.1
- xo-server-netbox 1.7.0
- xo-web 5.159.0
- xo-server 5.159.1

## **5.99.1** (2024-10-04)

### Bug fixes

- [Tooltip] Fix randomly disappearing tooltips (PR [#8031](https://github.com/vatesfr/xen-orchestra/pull/8031))
- Fix a memory leak mainly visible since XO 5.95.1 (PR [#8030](https://github.com/vatesfr/xen-orchestra/pull/8030))
- [Backup] Force an additional VDI disconnection before retrying on VDI_IN_USE error (PR [#8032](https://github.com/vatesfr/xen-orchestra/pull/8032))

### Released packages

- @vates/task 0.4.1
- @xen-orchestra/xapi 7.6.0
- @xen-orchestra/proxy 0.29.1
- xo-server 5.157.1
- xo-web 5.157.2

## **5.99.0** (2024-09-30)

### Highlights

- [Tasks] Ability to delete XO task logs
- [Pool/Network] Display the bond mode of a network [#7802](https://github.com/vatesfr/xen-orchestra/issues/7802) (PR [#8010](https://github.com/vatesfr/xen-orchestra/pull/8010))
- [Hosts] Display a warning for hosts whose TLS key is too short to update to XCP-ng 8.3 (PR [#7995](https://github.com/vatesfr/xen-orchestra/pull/7995))
- [Netbox] Support version 4.1 [#7966](https://github.com/vatesfr/xen-orchestra/issues/7966) (PR [#8002](https://github.com/vatesfr/xen-orchestra/pull/8002))
- **XO 6**:
  - [Dashboard] Display resources overview data (PR [#8009](https://github.com/vatesfr/xen-orchestra/pull/8009))
  - [Dashboard] Display S3 backup repository data (PR [#8006](https://github.com/vatesfr/xen-orchestra/pull/8006))
  - [Dashboard] Display VMs protection data (PR [#8007](https://github.com/vatesfr/xen-orchestra/pull/8007))
- [Backups] Display more informations in the _Notes_ column of the backup page (PR [#7977](https://github.com/vatesfr/xen-orchestra/pull/7977))

### Enhancements

- [SR/Disks] Display information if the VDI is an empty metadata snapshot (PR [#7970](https://github.com/vatesfr/xen-orchestra/pull/7970))
- [Netbox] Do not synchronize if detected minor version is not supported (PR [#7992](https://github.com/vatesfr/xen-orchestra/pull/7992))
- **XO 6**:
  - [Dashboard] Display backup issues data (PR [#7974](https://github.com/vatesfr/xen-orchestra/pull/7974))
- [REST API] Add S3 backup repository, VMs protection and resources overview information in the `/rest/v0/dashboard` endpoint (PRs [#7978](https://github.com/vatesfr/xen-orchestra/pull/7978), [#7964](https://github.com/vatesfr/xen-orchestra/pull/7964), [#8005](https://github.com/vatesfr/xen-orchestra/pull/8005))
- [REST API] Add `/alarms` endpoint and remove alarms from the `/dashboard` and `/messages` endpoints (PR [#7959](https://github.com/vatesfr/xen-orchestra/pull/7959))
- **xo-cli**
  - `rest get --output $file` now displays progress information during download
  - `rest post` and `rest put` now accept `--input $file` to upload a file and display progress information
- [Backup] Detect invalid VDI exports that are incorrectly reported as successful by XAPI
- [Backup] Backup job sequences: configure lists of backup jobs to run in order one after the other (PRs [#7985](https://github.com/vatesfr/xen-orchestra/pull/7985), [#8014](https://github.com/vatesfr/xen-orchestra/pull/8014))

### Bug fixes

- [Hub/Recipes/Kubernetes] Properly sort versions in selector
- [Host/Network] Fix `an error has occurred` briefly displaying in 'Mode' column of the host's Network tab (PR [#7954](https://github.com/vatesfr/xen-orchestra/pull/7954))
- [REST API] Fix VDI export broken in XO 5.96.0 and not completely fixed in XO 5.98.0
- [REST API] Fix VDI import in VHD format when `Content-Length` is not provided
- [REST API] Fix Issues with connecting iSCSI LUN to XOA (PR [#8004](https://github.com/vatesfr/xen-orchestra/pull/8004))
- [REST API] Fix broken _Rolling Pool Update_ pool action [Forum#82867](https://xcp-ng.org/forum/post/82867)
- [Logs] Fix private data in API call: password now obfuscated (PR [#8019](https://github.com/vatesfr/xen-orchestra/pull/8019))
- [Migration/CBT] Fix an infinite loop when migrating a VM with CBT enabled (PR [#8017](https://github.com/vatesfr/xen-orchestra/pull/8017))

### Released packages

- @xen-orchestra/defined 0.0.2
- @xen-orchestra/lite 0.4.0
- xapi-explore-sr 0.4.5
- xo-server-backup-reports 1.4.2
- xo-server-netbox 1.6.0
- @xen-orchestra/backups 0.54.0
- @xen-orchestra/backups-cli 1.0.24
- @xen-orchestra/immutable-backups 1.0.11
- @xen-orchestra/web-core 0.3.0
- @xen-orchestra/web 0.3.0
- xo-cli 0.30.0
- xen-api 4.3.1
- @xen-orchestra/xapi 7.5.1
- @xen-orchestra/proxy 0.29.0
- xo-server 5.157.0
- xo-web 5.157.1

## **5.98.1** (2024-09-10)

### Enhancements

- [Pool/Networks] Networks can be sorted by VLANs
- [Pool/Networks] Networks can be filtered by VLANs, e.g. `VLAN:10`
- [REST API] Add `pifs` and `vm-controllers` collections
- [REST API/Dashboard] Add name and type of the backup in the backup job issues (PR [#7958](https://github.com/vatesfr/xen-orchestra/pull/7958))
- [Perf-alert] Display warning if no guest tools are detected while monitoring VM memory (PR [#7886](https://github.com/vatesfr/xen-orchestra/pull/7886))
- [V2V] Fix computation of `memory_static_max`
- [i18n] Update Japanese translations (Thanks [@kohju](https://github.com/kohju)!) (PR [#7972](https://github.com/vatesfr/xen-orchestra/pull/7972))

### Bug fixes

- [Incremental Backup & Replication] Remove most of `Couldn't delete snapshot data` errors when using _Purge snapshot data when using CBT_ [#7826](https://github.com/vatesfr/xen-orchestra/pull/7826) (PR [#7960](https://github.com/vatesfr/xen-orchestra/pull/7960))
- [Dashboard/Health] Fix alarm table not showing any alarms (PR [#7965](https://github.com/vatesfr/xen-orchestra/pull/7965))

### Released packages

- @xen-orchestra/xapi 7.4.0
- @xen-orchestra/backups 0.53.1
- @xen-orchestra/proxy 0.28.14
- xo-server 5.154.0
- xo-server-perf-alert 0.5.0
- xo-server-sdn-controller 1.0.10
- xo-web 5.155.0

## **5.98.0** (2024-08-30)

### Highlights

- **XO 6**:
  - [Tree view] Display running VMs count on pool and host items (PR [#7873](https://github.com/vatesfr/xen-orchestra/pull/7873))
  - [Dashboard] Add backup jobs statuses, backup repository information, storage repository information and patches statuses (PR [#7926](https://github.com/vatesfr/xen-orchestra/pull/7926), [#7927](https://github.com/vatesfr/xen-orchestra/pull/7927), [#7929](https://github.com/vatesfr/xen-orchestra/pull/7929), [#7930](https://github.com/vatesfr/xen-orchestra/pull/7930))
- [Backup/Mirror] Filter the VM that must be mirrored [#7748](https://github.com/vatesfr/xen-orchestra/issues/7748) (PR [#7941](https://github.com/vatesfr/xen-orchestra/pull/7941))
- [Backups] Add an option to send shorter backup reports (PR [#7932](https://github.com/vatesfr/xen-orchestra/pull/7932))
- [Import/VMware] Use the template settings for `memory_static_min` allowing VM memory to be reduced in the future (PR [#7923](https://github.com/vatesfr/xen-orchestra/pull/7923))
- [OTP] Key can be copied to clipboard because some clients cannot use the QR code
- [Plugin/perf-alert] Add a toggle to exclude selected items (PR [#7911](https://github.com/vatesfr/xen-orchestra/pull/7911))

### Enhancements

- [REST API] Add backup repository, storage repository, alarms, backups jobs and backups issues information in the `/rest/v0/dashboard` endpoint (PR [#7882](https://github.com/vatesfr/xen-orchestra/pull/7882), [#7904](https://github.com/vatesfr/xen-orchestra/pull/7904), [#7914](https://github.com/vatesfr/xen-orchestra/pull/7914), [#7908](https://github.com/vatesfr/xen-orchestra/pull/7908), [#7919](https://github.com/vatesfr/xen-orchestra/pull/7919))
- [SR/Disks] Show and edit the use of CBT (Change Block Tracking) [#7786](https://github.com/vatesfr/xen-orchestra/issues/7786) (PR [#7888](https://github.com/vatesfr/xen-orchestra/pull/7888))
- [Home] Add possibility to sort VMs by install time [#7902](https://github.com/vatesfr/xen-orchestra/issues/7902) (PR [#7910](https://github.com/vatesfr/xen-orchestra/pull/7910))
- [Plugin/backup-reports] Send more concise backup reports to Slack and XMPP webhooks (PR [#7932](https://github.com/vatesfr/xen-orchestra/pull/7932))

### Bug fixes

- [Self] Remove unit in CPU usage total count (PR [#7894](https://github.com/vatesfr/xen-orchestra/pull/7894))
- [Home/SR] Fix _Shared/Not shared_ sort
- [Home/VM] When sorted by _Start time_, move VMs with no value at the end
- [Import/VM Ware] Shows only SRs and networks of the selected pool (PR [#7905](https://github.com/vatesfr/xen-orchestra/pull/7905))
- [Backups] Work around XAPI not automatically updating VM's `allowed_operations` after backups [Forum#81327](https://xcp-ng.org/forum/post/81327) (PR [#7924](https://github.com/vatesfr/xen-orchestra/pull/7924))
- [REST API] Fix VDI export in raw format broken in XO 5.96.0
- [New/SR] Fix 'an error as occurred' when creating a new SR (PR [#7931](https://github.com/vatesfr/xen-orchestra/pull/7931))
- [VM/General] Fix 'an error as occurred' in general tab view for non-admin users (PR [#7928](https://github.com/vatesfr/xen-orchestra/pull/7928))
- [Plugin/perf-alert] Fix 'NaN' values in CPU usage (PR [#7925](https://github.com/vatesfr/xen-orchestra/pull/7925))
- [Backups] Fix the replication failing with "disk attached to Dom0" error (PR [#7920](https://github.com/vatesfr/xen-orchestra/pull/7920))
- [VM/SR/Disks tab] Fix error not displaying when toggling CBT (PR [#7947](https://github.com/vatesfr/xen-orchestra/pull/7947))

### Released packages

- @xen-orchestra/backups 0.53.0
- @xen-orchestra/backups-cli 1.0.23
- @xen-orchestra/immutable-backups 1.0.10
- @xen-orchestra/web-core 0.1.1
- @xen-orchestra/lite 0.3.1
- @xen-orchestra/proxy 0.28.13
- @xen-orchestra/web 0.1.1
- xo-server-perf-alert 0.4.0
- xo-web 5.154.0
- xo-server 5.153.1
- xo-server-backup-reports 1.4.1

## **5.97.0** (2024-07-31)

### Highlights

- [VM/Advanced] Possibility to manually [_Coalesce Leaf_](https://docs.xenserver.com/en-us/xenserver/8/storage/manage.html#reclaim-space-by-using-the-offline-coalesce-tool) [#7757](https://github.com/vatesfr/xen-orchestra/issues/7757) (PR [#7810](https://github.com/vatesfr/xen-orchestra/pull/7810))
- [Plugin/backup-reports] Show more information of backups, including NBD and CBT usage (PR [#7815](https://github.com/vatesfr/xen-orchestra/pull/7815))
- [Backups] Adding an option to avoid sending reports for skipped backups (e.g. no matching VMs, unhealthy VDI chains, etc.) (PR [#7832](https://github.com/vatesfr/xen-orchestra/pull/7832))
- [Backups] Add 'report recipients' when creating a metadata backup [#7569](https://github.com/vatesfr/xen-orchestra/issues/7569) (PR [#7776](https://github.com/vatesfr/xen-orchestra/pull/7776))
- [VM/Advanced] Display an accurate secure boot status and allow user to propagate certificates from pool to VM [#7495](https://github.com/vatesfr/xen-orchestra/issues/7495) (PR [#7751](https://github.com/vatesfr/xen-orchestra/pull/7751))
- [Host/General] Display additional hardware data for 2CRSi server [#7816](https://github.com/vatesfr/xen-orchestra/issues/7816) (PR [#7838](https://github.com/vatesfr/xen-orchestra/pull/7838))
- [i18n] Add Persian translation (based on the contribution made by [@Jokar-xen](https://github.com/Jokar-xen)) (PR [#7775](https://github.com/vatesfr/xen-orchestra/pull/7775))
- [i18n] Improve Russian translation (Thanks [@TristisOris](https://github.com/TristisOris)!) (PR [#7807](https://github.com/vatesfr/xen-orchestra/pull/7807))
- [i18n] Add Swedish translation (Thanks [@cloudrootab](https://github.com/cloudrootab)!) [#7844](https://github.com/vatesfr/xen-orchestra/pull/7844)

### Enhancements

- [REST API] Expose XO6 dashboard informations at the `/rest/v0/dashboard` endpoint (PR [#7823](https://github.com/vatesfr/xen-orchestra/pull/7823))
- [VM/Stats] Display a warning when guest tools are not detected (PR [#7831](https://github.com/vatesfr/xen-orchestra/pull/7831))

### Bug fixes

- [VM/Advanced] Fix `not enough permission` when attaching PCIs [#9260](https://xcp-ng.org/forum/topic/9260/attach-pcis-not-enough-permissions) (PR [#7793](https://github.com/vatesfr/xen-orchestra/pull/7793))
- [V2V] Fix `Cannot read properties of undefined (reading 'committed')` when listing importable VM (PR [#7840](https://github.com/vatesfr/xen-orchestra/pull/7840))
- [VM] Fix Self-Service users being able to see more action buttons than they should in some cases (PR [#7854](https://github.com/vatesfr/xen-orchestra/pull/7854))
- [Self Service] Always allow administrators to bypass quotas (PR [#7855](https://github.com/vatesfr/xen-orchestra/pull/7855))
- [V2V] Fix `Can't import delta of a running VM without its parent VHD` error during warm migration (PR [#7856](https://github.com/vatesfr/xen-orchestra/pull/7856))
- [Backups] Fix a race condition leading to `VDI_INCOMPATIBLE_TYPE` error when using _Purge snapshot data_ (PR [#7828](https://github.com/vatesfr/xen-orchestra/pull/7828))
- [Backups] NBD backups now respected _default backup network_ settings (PR [#7836](https://github.com/vatesfr/xen-orchestra/pull/7836))
- [Backups] NBD backups now ignore unreachable host and retry on reachable ones (PR [#7836](https://github.com/vatesfr/xen-orchestra/pull/7836))
- [New SR] Add confirmation modal before creating an SR if SRs are already present in the same path (for ISCSI) [#4273](https://github.com/vatesfr/xen-orchestra/issues/4273) (PR [#7845](https://github.com/vatesfr/xen-orchestra/pull/7845))
- [XO Tasks] Reduce the number of API calls that incorrectly stay in pending status (often `sr.getAllUnhealthyVdiChainsLength`) [Forum#79281](https://xcp-ng.org/forum/post/79281) [Forum#80010](https://xcp-ng.org/forum/post/80010)
- [Plugin/backup-reports] Fix _Metadata Backup_ report not sent in some cases (PR [#7776](https://github.com/vatesfr/xen-orchestra/pull/7776))
- [Host/Advanced] Fix _Advanced Live Telemetry_ link on recent XOAs

### Released packages

- @xen-orchestra/vmware-explorer 0.8.3
- @vates/nbd-client 3.1.0
- @xen-orchestra/backups 0.52.2
- @xen-orchestra/mixins 0.16.0
- xen-api 4.2.0
- xo-server-audit 0.12.0
- @xen-orchestra/xapi 7.3.0
- @xen-orchestra/web-core 0.0.5
- @xen-orchestra/lite 0.2.6
- @xen-orchestra/proxy 0.28.11
- @xen-orchestra/web 0.0.6
- xo-server 5.151.0
- xo-server-backup-reports 1.3.1
- xo-web 5.152.1

## **5.96.0** (2024-07-05)

### Highlights

- [Plugin/backup-reports] Backup reports sent by email have a new, less rudimentary look (PR [#7747](https://github.com/vatesfr/xen-orchestra/pull/7747))
- [Backups] Implements Change Block Tracking (CBT) (PR [#7750](https://github.com/vatesfr/xen-orchestra/pull/7750))
- [Backups] Add a toggle to enable purging snapshot data with CBT backups (PR [#7796](https://github.com/vatesfr/xen-orchestra/pull/7796))
- [Rolling Pool Update/Reboot] Adds a progress bar to RPU and RPR tasks (PR [#7768](https://github.com/vatesfr/xen-orchestra/pull/7768))
- [Netbox] Support Netbox 4 (Thanks [@ChrisMcNichol](https://github.com/ChrisMcNichol)!) (PR [#7735](https://github.com/vatesfr/xen-orchestra/pull/7735))
- [Create/SR] Display SCSI ID and LUN during HBA storage creation (PR [#7742](https://github.com/vatesfr/xen-orchestra/pull/7742))

### Enhancements

- [Netbox] Check Netbox version before attempting to synchronize (PR [#7735](https://github.com/vatesfr/xen-orchestra/pull/7735))
- [Migration] Disable CBT when needed during a disk/VM migration (PR [#7756](https://github.com/vatesfr/xen-orchestra/pull/7756))
- [Disks] Show and edit the use of CBT (Change Block Tracking) in disks (PR [#7732](https://github.com/vatesfr/xen-orchestra/pull/7732))
- [REST API] _Rolling Pool Reboot_ action available `pools/<uuid>/actions/rolling_reboot` (PR [#7761](https://github.com/vatesfr/xen-orchestra/pull/7761))
- [XOSTOR] Possibility to directly access an XOSTOR SR from the view that lists all XOSTOR SRs (PR [#7764](https://github.com/vatesfr/xen-orchestra/pull/7764))
- [VM] Disks whose name contains the tag `[NOSNAP]` will be ignored when doing a manual snapshot similarly to disks ignored during backups with `[NOBAK]` (possibility to use both tags on the same disk) [Forum#79179](https://xcp-ng.org/forum/post/79179)
- [SR/XOSTOR] Add _State_ column to the _Resource List_ table (PR [#7784](https://github.com/vatesfr/xen-orchestra/pull/7784))
- [REST API] VDIs of a VM, or a VM snapshot, or a VM template, can now be fetched easily by appending `/vdis` at the VM's endpoint
- [REST API] Expose servers at the `/rest/v0/servers` endpoint

### Bug fixes

- [V2V] Fix VSAN import not used when importing from VSAN ([PR #7717](https://github.com/vatesfr/xen-orchestra/pull/7717))
- [Backups] Fix EEXIST error after an interrupted mirror backup job ([PR #7694](https://github.com/vatesfr/xen-orchestra/pull/7694))
- [Netbox] Fix "Netbox error could not be retrieved" when an error occurs on Netbox's side (PR [#7758](https://github.com/vatesfr/xen-orchestra/pull/7758))
- [XOSTOR] Fix the _Approximate SR Capacity_ sometimes showing as 0 if not all hosts had disks (PR [#7765](https://github.com/vatesfr/xen-orchestra/pull/7765))
- [VM/Advanced] Ignore `Firmware not supported` warning for UEFI boot firmware [Forum#8878](https://xcp-ng.org/forum/topic/8878/uefi-firmware-not-supported) (PR [#7767](https://github.com/vatesfr/xen-orchestra/pull/7767))
- [LDAP] Fix users being removed from groups when synchronizing groups (PR [#7759](https://github.com/vatesfr/xen-orchestra/pull/7759))
- [Host/Advanced] Change _Advanced Live Telemetry_ link to point to Netdata's page of the specific host [#7702](https://github.com/vatesfr/xen-orchestra/issues/7702)
- [Incremental Replication] Fix _Delete first_ option causing `could not find base VM` error ([PR #7739](https://github.com/vatesfr/xen-orchestra/pull/7739))
- [Full Backup] Don't keep an unnecessary snapshot (PR [#7805](https://github.com/vatesfr/xen-orchestra/pull/7805))
- [Incremental Replication] Fix error `Cannot destructure property 'other_config' of 'undefined'` (PR [#7805](https://github.com/vatesfr/xen-orchestra/pull/7805))
- Ensure backup worker exits and frees all resources when the run is finished

### Released packages

- @vates/fuse-vhd 2.1.1
- @vates/task 0.4.0
- @xen-orchestra/web-core 0.0.3
- @xen-orchestra/lite 0.2.4
- @xen-orchestra/mixins 0.15.1
- @xen-orchestra/proxy-cli 0.3.2
- @xen-orchestra/vmware-explorer 0.8.2
- @xen-orchestra/web 0.0.4
- xo-server-auth-ldap 0.10.9
- xo-server-netbox 1.5.0
- xo-server-transport-email 1.1.0
- xo-server-backup-reports 1.1.0
- vhd-lib 4.11.0
- @xen-orchestra/backups-cli 1.0.22
- @xen-orchestra/immutable-backups 1.0.9
- xo-web 5.149.0
- @xen-orchestra/backups 0.52.1
- @xen-orchestra/xapi 7.1.1
- @xen-orchestra/proxy 0.28.8
- xo-server 5.148.2

## **5.95.2** (2024-08-28)

### Bug fixes

- [SDN-Controller] Fix `tlsv1 alert unknown ca` when creating private network (PR [#7755](https://github.com/vatesfr/xen-orchestra/pull/7755))

### Released packages

- xo-server-sdn-controller 1.0.9

## **5.95.1** (2024-06-20)

### Enhancements

- [Tasks] Log pending and failed API calls as XO tasks, eventually they will replace logs in Settings/Logs

### Bug fixes

- [Pool] Fix `Text data outside of root node` when installing XCP-ng patches

### Released packages

- xo-server 5.145.0

## **5.95.0** (2024-05-31)

### Highlights

- [REST API] Support exporting VM in OVA format
- [xo-cli] Ability to connect to an XO instance without registering it first

  This is helpful when using multiple instances especially when coupled with shell aliases:

  ```sh
  alias xo-dev='xo-cli --url https://token@dev.company.net'
  alias xo-prod='xo-cli --url https://token@prod.company.net'

  xo-prod vm.start id=e6572e82-983b-4780-a2a7-b19831fb7f45
  ```

- [VM] Yellow icon when VM is busy [#7593](https://github.com/vatesfr/xen-orchestra/issues/7593) (PR [#7680](https://github.com/vatesfr/xen-orchestra/pull/7680))
- [Tasks] Wait a few seconds before estimating remaining time [#7689](https://github.com/vatesfr/xen-orchestra/issues/7689) (PR [#7691](https://github.com/vatesfr/xen-orchestra/pull/7691))
- [Pool/Advanced] Add _Migration Compression_ toggle in the Pool advanced tab. (Only for XCP 8.3) (PR [#7642](https://github.com/vatesfr/xen-orchestra/pull/7642))
- [Plugin/load-balancer] Added an option in the plugin configuration to balance CPU usage on hosts before it reaches too high values (performance plan only) (PR [#7698](https://github.com/vatesfr/xen-orchestra/pull/7698))
- [XO 6] First preview

### Enhancements

- [XOA/Licenses] Ability to manually bind XOSTOR licenses following new licenses (PR [#7573](https://github.com/vatesfr/xen-orchestra/pull/7573))
- [V2V] Select template before import (PR [#7566](https://github.com/vatesfr/xen-orchestra/pull/7566))

### Bug fixes

- [Settings/Remotes] Fixed remote encryption not displayed ([PR #7638](https://github.com/vatesfr/xen-orchestra/pull/7638))
- [Backups] Unblock VM migration operations when not properly handled by a previous backup run [Forum#77857](https://xcp-ng.org/forum/post/77857)
- [Backup & Replication] Fix job stalling when failing to find a base VM
- [REST API] Host logs are in tar+gzip format, the path is now `/host/:uuid/logs.tgz` [#7703](https://github.com/vatesfr/xen-orchestra/issues/7703)
- [Plugin/perf-alert] Reduce the number of queries to the hosts [#7692](https://github.com/vatesfr/xen-orchestra/issues/7692)
- [Host/Advanced] Ability to force reboot a host if its VMs could not be evacuated after enabling/disabling PCI passthrough (PR [#7687](https://github.com/vatesfr/xen-orchestra/pull/7687))

### Released packages

- @xen-orchestra/fs 4.1.7
- @vates/obfuscate 0.1.0
- xen-api 4.0.0
- @vates/nbd-client 3.0.2
- @xen-orchestra/xapi 6.0.0
- @xen-orchestra/backups-cli 1.0.19
- @xen-orchestra/cr-seed-cli 1.0.2
- @xen-orchestra/immutable-backups 1.0.6
- xapi-explore-sr 0.4.4
- xo-cli 0.28.0
- xo-server-backup-reports 0.19.0
- @vates/node-vsphere-soap 2.1.0
- @xen-orchestra/backups 0.49.1
- @xen-orchestra/web-core 0.0.2
- @xen-orchestra/proxy 0.28.3
- xo-server-load-balancer 0.10.0
- xo-server-perf-alert 0.3.8
- xo-web 5.147.0
- @xen-orchestra/web 0.0.3
- @xen-orchestra/vmware-explorer 0.8.1
- xo-server 5.144.2

## **5.94.2** (2024-05-15)

### Bug fixes

- [Console] Fix support of consoles behind an HTTP/HTTPS proxy [Forum#76935](https://xcp-ng.org/forum/post/76935')
- [Rolling Pool Update] Fixed RPU failing to install patches on hosts (and still appearing as successful) (PR [#7640](https://github.com/vatesfr/xen-orchestra/pull/7640))
- [XOSTOR] Throw clearer error if attempt to create multiple trials (PR [#7649](https://github.com/vatesfr/xen-orchestra/pull/7649))
- [V2V] Fix import stuck (PR [#7653](https://github.com/vatesfr/xen-orchestra/pull/7653))
- [REST API] Don't wait for a new state of a task when the `wait` query string is not used
- [Backup] Prevent VM (and not only its latest snapshot) from being migrated while they are backed up

### Released packages

- @xen-orchestra/backups 0.48.1
- @xen-orchestra/vmware-explorer 0.7.2
- xo-server 5.143.1

## **5.94.1** (2024-05-06)

### Enhancements

- [New XOSTOR] Display a warning when replication count is greater than number of hosts with disks (PR [#7625](https://github.com/vatesfr/xen-orchestra/pull/7625))
- [XOSTOR] Ability to copy VDI UUID in the resources table (PR [#7629](https://github.com/vatesfr/xen-orchestra/pull/7629))

### Bug fixes

- [Pool] Fix `Headers Timeout Error` when installing patches on XCP-ng
- [Pool/Advanced] Only show current pool's SRs in default SR selector (PR [#7626](https://github.com/vatesfr/xen-orchestra/pull/7626))
- [SR/XOSTOR] Fix `an error has occurred` in the Resource List (PR [#7630](https://github.com/vatesfr/xen-orchestra/pull/7630))
- [XOSTOR] Don't require host licenses to run XOSTOR (PR [#7628](https://github.com/vatesfr/xen-orchestra/pull/7628))

### Released packages

- xo-server 5.142.2
- xo-web 5.145.0

## **5.94.0** (2024-04-30)

### Highlights

- [Backups] Make health check timeout configurable: property `healthCheckTimeout` of config file (PR [#7561](https://github.com/vatesfr/xen-orchestra/pull/7561))
- [Plugin/audit] Expose records in the REST API at `/rest/v0/plugins/audit/records`
- [XOSTOR] List linstor resources in the XOSTOR tab of an SR's view (PR [#7542](https://github.com/vatesfr/xen-orchestra/pull/7542))
- [i18n] Japanese translation (PR [#7582](https://github.com/vatesfr/xen-orchestra/pull/7582))
- [Host/Advanced] Ability to `enable/disable` passthrough for PCIs [#7432](https://github.com/vatesfr/xen-orchestra/issues/7432) (PR [#7455](https://github.com/vatesfr/xen-orchestra/pull/7455))
- [VM/Advanced] Ability to `attach/detach` PCIs to a VM [#7432](https://github.com/vatesfr/xen-orchestra/issues/7432) (PR [#7464](https://github.com/vatesfr/xen-orchestra/pull/7464))
- [VM] At VM creation, warn if secure boot is on but pool is not setup for UEFI Secure Boot [#7500](https://github.com/vatesfr/xen-orchestra/issues/7500) (PR [#7562](https://github.com/vatesfr/xen-orchestra/pull/7562))
- [Rolling Pool Update/Reboot] Use XO tasks for better reportability (PR [#7578](https://github.com/vatesfr/xen-orchestra/pull/7578))
- [VMWare/Migration] Import from VSAN

### Enhancements

- [XOSTOR] Ability to manage XOSTOR interfaces (PR [#7547](https://github.com/vatesfr/xen-orchestra/pull/7547))
- [XOSTOR] Require confirmation before creating SR because hosts toolstack will restart if packages need to be installed (PR [#7570](https://github.com/vatesfr/xen-orchestra/pull/7570))
- [REST API] [Watch mode for the tasks collection](./packages/xo-server/docs/rest-api.md#all-tasks) (PR [#7565](https://github.com/vatesfr/xen-orchestra/pull/7565))
- [Home/SR] Display _Pro Support_ status for XOSTOR SR (PR [#7601](https://github.com/vatesfr/xen-orchestra/pull/7601))
- [XOSTOR] XOSTOR is no longer in BETA

### Bug fixes

- [Import/VMWare] Fix `Cannot read properties of undefined (reading 'match')`
- [Plugin/load-balancer] Density plan will no longer try to migrate VMs to a host which is reaching critical memory or CPU usage (PR [#7544](https://github.com/vatesfr/xen-orchestra/pull/7544))
- [VMWare/Migration] Don't use default proxy to query the source
- [Import/VMWare] Remove additional whitespaces in host address
- [Backup/HealthCheck] Health check failing with timeout while waiting for guest metrics on XO Proxy
- [VM/Advanced] Fix error displayed when a non-admin user activates "auto power on" (PR [#7580](https://github.com/vatesfr/xen-orchestra/pull/7580))
- [VM/Backups] Don't incorrectly list backup jobs using _Smart Mode_ if this VM has a `xo:no-bak` tag [#7527](https://github.com/vatesfr/xen-orchestra/issues/7527)
- Fix support of XenServer 6.5 (broken in XO 5.93.0)
- [VMWare/Import] Fix `Cannot create property 'xxx' on string 'yyy' when trying to import from ESXi
- [Import/VMWare] Fix ERR_PREMATURE_CLOSE error with Xenserver hosts (PR [#7563](https://github.com/vatesfr/xen-orchestra/pull/7563))
- [VMWare/Migration] Handle multiple datacenters (PR [#7553](https://github.com/vatesfr/xen-orchestra/pull/7553))
- [XOSTOR/create] In the summary section, the warning message "Hosts do not have the same number of disks" now takes into consideration host without disks (PR [#7572](https://github.com/vatesfr/xen-orchestra/pull/7572))
- [XOSTOR] Install or update packages on all hosts in the pool rather than just hosts with disks (PR [#7597](https://github.com/vatesfr/xen-orchestra/pull/7597))
- [XOSTOR] Fix `LVM_ERROR(5)` during XOSTOR creation (PR [#7598](https://github.com/vatesfr/xen-orchestra/pull/7598))
- [Pool/Advanced] Fix `an error has occurred` when no default SR is set on the pool (PR [#7616](https://github.com/vatesfr/xen-orchestra/pull/7616))
- [XOSTOR/Create] Fix `UND_ERR_HEADERS_TIMEOUT` error when installing dependencies (PR [#7562](https://github.com/vatesfr/xen-orchestra/pull/7562))

### Released packages

- @vates/node-vsphere-soap 2.0.1
- @vates/task 0.3.0
- @xen-orchestra/audit-core 0.3.0
- @xen-orchestra/xapi 5.0.1
- @xen-orchestra/backups 0.48.0
- @xen-orchestra/backups-cli 1.0.18
- @xen-orchestra/immutable-backups 1.0.5
- xo-server-audit 0.11.0
- xo-server-load-balancer 0.9.1
- @vates/xml 2.0.0
- @vates/xml-rpc 1.0.0
- xen-api 3.0.1
- @xen-orchestra/mixins 0.15.0
- @xen-orchestra/proxy 0.28.1
- @xen-orchestra/vmware-explorer 0.7.1
- xo-cli 0.27.1
- xo-server 5.142.1
- xo-web 5.144.0

## **5.93.1** (2024.04-10)

### Enhancements

- [RPU] If a XOSTOR is present in the pool, _Rolling Pool Update_ is no longer available (PR [#7540](https://github.com/vatesfr/xen-orchestra/pull/7540))

### Bug fixes

- [REST API] Fix download of host's audit and logs broken in XO 5.93.0
- [VM] Fix `unknown error` on export (broken in XO 5.93.0)
- [Host/Advanced] Fix _Hyper Threading_ not correctly recognized if _Smartctl_ plugin returned an error [Forum#8675](https://xcp-ng.org/forum/topic/8675/ht-smt-detection-in-8-3-not-fully-working) (PR [#7525](https://github.com/vatesfr/xen-orchestra/pull/7525))
- [VMWare/Migration] Use NFS datastore for import from XO5 (PR [#7530](https://github.com/vatesfr/xen-orchestra/pull/7530))
- [VMWare/Migration] Fix `Can't import delta of a running VM without its parent vdi` when importing snapshotless VM (PR [#7530](https://github.com/vatesfr/xen-orchestra/pull/7530))
- [VMWare/Migration] Don't fail all VMs if one does not have any disks (PR [#7530](https://github.com/vatesfr/xen-orchestra/pull/7530))
- [Plugin/perf-alert] Fix important CPU & memory usage (broken in XO 5.93.0)
- [New/VM] Correctly detects if the template requires a VTPM device

### Released packages

- @xen-orchestra/backups 0.47.0
- @xen-orchestra/backups-cli 1.0.17
- @xen-orchestra/immutable-backups 1.0.4
- @xen-orchestra/proxy 0.27.2
- @xen-orchestra/vmware-explorer 0.6.1
- xo-server 5.140.1
- xo-server-perf-alert 0.3.7
- xo-web 5.142.1

## **5.93.0** (2024-03-29)

### Highlights

- [User] Show authentication tokens last use datetime and IP address (PR [#7479](https://github.com/vatesfr/xen-orchestra/pull/7479))
- [Console] In VM and Host Console tab, display console's zoom percentage (PR [#7452](https://github.com/vatesfr/xen-orchestra/pull/7452))
- [Pool/Network] Automatically update network interfaces when network MTU is changed [Forum#8133](https://xcp-ng.org/forum/topic/8133/set-host-network-mtu-in-xen-orchestra) (PR [#7443](https://github.com/vatesfr/xen-orchestra/pull/7443)).
- [Plugin/load-balancer] A parameter was added in performance mode to balance VMs on hosts depending on their number of vCPUs, when it does not cause performance issues [#5389](https://github.com/vatesfr/xen-orchestra/issues/5389) (PR [#7333](https://github.com/vatesfr/xen-orchestra/pull/7333))
- [Pool/Advanced] Default SR can now also be configured from the pool's _Advanced_ tab [#7414](https://github.com/vatesfr/xen-orchestra/issues/7414) (PR [#7451](https://github.com/vatesfr/xen-orchestra/pull/7451))
- [VMWare/Migration] Use NFS datastore from XO Remote to bypass VMFS6 lock (PR [#7487](https://github.com/vatesfr/xen-orchestra/pull/7487))
- [Pool/Advanced] High availability can now be activated or deactivated, and the heartbeat SR can be configured during activation [#4731](https://github.com/vatesfr/xen-orchestra/issues/4731) (PR [#7503](https://github.com/vatesfr/xen-orchestra/pull/7503))
- [OTP] Activate it now requires entering a one-time password to validate the setup and prevent user from being locked out (PR [#7480](https://github.com/vatesfr/xen-orchestra/pull/7480))
- Use [ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601) for numeric datetimes (PR [#7484](https://github.com/vatesfr/xen-orchestra/pull/7484))
- [VM/Advanced] Display a warning if the VM does not support the selected firmware (PR [#7442](https://github.com/vatesfr/xen-orchestra/pull/7442))
- [Remotes] Fix size reporting for huge remotes

### Enhancements

- [VM Creation] Automatically create a VTPM if the template requests it (Windows templates starting from XCP-ng 8.3) (PR [#7436](https://github.com/vatesfr/xen-orchestra/pull/7436))
- [OTP] Accepts (ignores) whitespaces in the one-time password (some OTP applications add them for nicer display)
- [VM/General] Show current VM tags without the need to search them in advanced creation tag selector [#7351](https://github.com/vatesfr/xen-orchestra/issues/7351) (PR [#7434](https://github.com/vatesfr/xen-orchestra/pull/7434))
- [xo-cli] Supports signing in with one-time password (PR [#7459](https://github.com/vatesfr/xen-orchestra/pull/7459))
- [App] Implement the initial PWA manifest for Xen Orchestra 5 (PR [#7462](https://github.com/vatesfr/xen-orchestra/pull/7462)).
- [XOA/License] Ability to change the license assigned to an object already licensed (e.g. expired licenses) (PR [#7390](https://github.com/vatesfr/xen-orchestra/pull/7390))
- [VMWare/Migration] Make one pass for the cold base disk and snapshots (PR [#7487](https://github.com/vatesfr/xen-orchestra/pull/7487))
- [Remotes] S3 (Object storage) and remote encryption are production ready (PR [#7515](https://github.com/vatesfr/xen-orchestra/pull/7515))
- [Template] Attempting to delete a template protected against accidental deletion displays a confirmation modal (PR [#7493](https://github.com/vatesfr/xen-orchestra/pull/7493))

### Bug fixes

- [ISO SR] During ISO migration, the destination SRs were not ISO SRs [#7392](https://github.com/vatesfr/xen-orchestra/issues/7392) (PR [#7431](https://github.com/vatesfr/xen-orchestra/pull/7431))
- [VM/Migration] Fix VDIs that were not migrated to the destination SR (PR [#7360](https://github.com/vatesfr/xen-orchestra/pull/7360))
- [Home/VM] VMs migration from the home view will no longer execute a [Migration with Storage Motion](https://github.com/vatesfr/xen-orchestra/blob/master/docs/manage_infrastructure.md#vm-migration-with-storage-motion-vmmigrate_send) unless it is necessary [Forum#8279](https://xcp-ng.org/forum/topic/8279/getting-errors-when-migrating-4-out-5-vmguest/)(PR [#7360](https://github.com/vatesfr/xen-orchestra/pull/7360))
- [VM/Migration] SR is no longer required if you select a migration network (PR [#7360](https://github.com/vatesfr/xen-orchestra/pull/7360))
- [Backup] Fix `an error has occurred` when clicking on warning text in logs (PR [#7458](https://github.com/vatesfr/xen-orchestra/pull/7458))
- [JSON-RPC API] Correctly require one-time password if configured for user (PR [#7459](https://github.com/vatesfr/xen-orchestra/pull/7459))
- [VM/WarmMigration] Feature is for PREMIUM and SOURCE users (PR [#7514](https://github.com/vatesfr/xen-orchestra/pull/7514))
- [VMWare/Migration] Handle raw CDROM
- [XOSTOR Creation] The host toolstack is now restarted after installing the XOSTOR dependencies (PR [#7437](https://github.com/vatesfr/xen-orchestra/pull/7437))
- [VMWare/Migration] Alignment of the end of delta on older ESXi (PR [#7487](https://github.com/vatesfr/xen-orchestra/pull/7487))
- [Backup] Fix `no object with uuid or opaqueref` when running a health check (PR [#7467](https://github.com/vatesfr/xen-orchestra/pull/7467))
- [Backup] Fix `task has already ended` when running a health check in a mirror backup (PR [#7467](https://github.com/vatesfr/xen-orchestra/pull/7467))
- [Backup] Fix health check being stuck when using a different, non shared health check SR (PR [#7467](https://github.com/vatesfr/xen-orchestra/pull/7467))

### Released packages

- @xen-orchestra/fs 4.1.6
- xen-api 3.0.0
- @vates/nbd-client 3.0.1
- @vates/otp 1.1.0
- @xen-orchestra/xapi 5.0.0
- @xen-orchestra/backups-cli 1.0.16
- @xen-orchestra/cr-seed-cli 1.0.1
- @xen-orchestra/immutable-backups 1.0.3
- @xen-orchestra/self-signed 0.2.1
- xapi-explore-sr 0.4.3
- xo-cli 0.27.0
- xo-server-load-balancer 0.9.0
- vhd-lib 4.9.2
- @xen-orchestra/backups 0.46.1
- @xen-orchestra/proxy 0.27.1
- @xen-orchestra/vmware-explorer 0.6.0
- xo-acl-resolver 0.5.0
- xo-server 5.140.0
- xo-web 5.142.0

## **5.92.1** (2024-03-06)

### Enhancements

- [About] Clicking on commit version number opens a new tab [#7427](https://github.com/vatesfr/xen-orchestra/issues/7427) (PR [#7430](https://github.com/vatesfr/xen-orchestra/pull/7430))

### Bug fixes

- [Jobs] Fix `t.value is undefined` when saving a new job (broken in XO 5.91)
- [XOSTOR] Move `ignore file systems` outside of advanced settings (PR [#7429](https://github.com/vatesfr/xen-orchestra/pull/7429))
- Allow unauthenticated access to `robots.txt`
- [SR/XOSTOR] VG `linstor_group` removed if SR creation failed. (Deletion occurs only if `xo-server` was responsible for this VG creation) (PR [#7426](https://github.com/vatesfr/xen-orchestra/pull/7426))

### Released packages

- xo-server 5.138.1
- xo-web 5.140.0

## **5.92.0** (2024-02-29)

### Highlights

- Disable search engine indexing via a `robots.txt`
- [Stats] Support format used by XAPI 23.31
- [REST API] Export host [SMT](https://en.wikipedia.org/wiki/Simultaneous_multithreading) status at `/hosts/:id/smt` [Forum#71374](https://xcp-ng.org/forum/post/71374)
- [Home & REST API] `$container` field of a halted VM now points to a host if a VDI is on a local storage [Forum#71769](https://xcp-ng.org/forum/post/71769)
- [Pool/Advanced] _Auto power on_ can be disabled at pool level (PR [#7401](https://github.com/vatesfr/xen-orchestra/pull/7401))
- [Pool/Network] Ability to edit MTU [#7039](https://github.com/vatesfr/xen-orchestra/issues/7039) (PR [#7393](https://github.com/vatesfr/xen-orchestra/pull/7393))
- [Backup] Ability to set a number of retries for VM backup failures [#2139](https://github.com/vatesfr/xen-orchestra/issues/2139) (PR [#7308](https://github.com/vatesfr/xen-orchestra/pull/7308))
- [VM/Advanced] Ability to create VUSB (PR [#7412](https://github.com/vatesfr/xen-orchestra/pull/7412))

### Enhancements

- [Size Input] Ability to select two new units in the dropdown (`TiB`, `PiB`) (PR [#7382](https://github.com/vatesfr/xen-orchestra/pull/7382))
- [Self service] From user POV, show used resources even when they are unlimited (PR [#7353](https://github.com/vatesfr/xen-orchestra/pull/7353))
- [Storage/Disks] Handle link to VM for suspended VDIs (PR [#7391](https://github.com/vatesfr/xen-orchestra/pull/7391))

### Bug fixes

- [Settings/XO Config] Sort backups from newest to oldest
- [Plugins/audit] Don't log `tag.getAllConfigured` calls
- [Remotes] Correctly clear error when the remote is tested with success
- [Import/VMWare] Fix importing last snapshot (PR [#7370](https://github.com/vatesfr/xen-orchestra/pull/7370))
- [Host/Reboot] Fix false positive warning when restarting a host after updates (PR [#7366](https://github.com/vatesfr/xen-orchestra/pull/7366))
- [New/VM] Respect _Fast clone_ setting broken since 5.91.0 (PR [#7388](https://github.com/vatesfr/xen-orchestra/issues/7388))
- [Backup] Remove incorrect _unused VHD_ warning because the situation is normal (PR [#7406](https://github.com/vatesfr/xen-orchestra/issues/7406))
- [Backup] Remove display of empty directories for mirror backups (PR [#7340](https://github.com/vatesfr/xen-orchestra/pull/7340))
- [API/backupNg.getLogs] Fix `after` parameter handling when `limit` parameter is not provided
- [New/SR] Fix create button never appearing for `smb iso` SR [#7355](https://github.com/vatesfr/xen-orchestra/issues/7355), [Forum#8417](https://xcp-ng.org/forum/topic/8417) (PR [#7405](https://github.com/vatesfr/xen-orchestra/pull/7405))
- [Pool/Network] Don't allow MTU values that are too small to work (<68) (PR [#7393](https://github.com/vatesfr/xen-orchestra/pull/7393)
- [Import/VMWare] Correctly handle IDE disks
- [Backups/Full] Fix `Cannot read properties of undefined (reading 'healthCheckVmsWithTags')` (PR [#7396](https://github.com/vatesfr/xen-orchestra/pull/7396))
- [Backups/Healthcheck] Don't run health checks after empty mirror backups (PR [#7396](https://github.com/vatesfr/xen-orchestra/pull/7396))
- [SR/SMB] Fix `SR_BACKEND_FAILURE_111` during SMB storage creation [#7356](https://github.com/vatesfr/xen-orchestra/issues/7356) (PR [#7407](https://github.com/vatesfr/xen-orchestra/pull/7407))
- [Editable text] Make sure the text is still clickable/editable if the content is a single white space [Forum#8466](https://xcp-ng.org/forum/topic/8466) (PR [#7411](https://github.com/vatesfr/xen-orchestra/pull/7411))

### Released packages

- @xen-orchestra/fs 4.1.5
- vhd-lib 4.9.1
- xo-server-audit 0.10.6
- @xen-orchestra/xapi 4.3.0
- @xen-orchestra/backups 0.45.0
- @xen-orchestra/backups-cli 1.0.15
- @xen-orchestra/immutable-backups 1.0.2
- @xen-orchestra/proxy 0.26.47
- @xen-orchestra/vmware-explorer 0.4.1
- xo-server 5.138.0
- xo-web 5.139.0

## **5.91.2** (2024-02-09)

### Enhancements

- [REST API] Add `/groups` collection [Forum#70500](https://xcp-ng.org/forum/post/70500)
- [REST API] Add `/groups/:id/users` and `/users/:id/groups` collection [Forum#70500](https://xcp-ng.org/forum/post/70500)
- [REST API] Expose messages associated to XAPI objects at `/:collection/:object/messages`

### Bug fixes

- [Import/VMWare] Fix `(Failure \"Expected string, got 'I(0)'\")` (PR [#7361](https://github.com/vatesfr/xen-orchestra/issues/7361))
- [Plugin/load-balancer] Fixing `TypeError: Cannot read properties of undefined (reading 'high')` happening when trying to optimize a host with performance plan [#7359](https://github.com/vatesfr/xen-orchestra/issues/7359) (PR [#7362](https://github.com/vatesfr/xen-orchestra/pull/7362))
- Changing the number of displayed items per page should send back to the first page [#7350](https://github.com/vatesfr/xen-orchestra/issues/7350)
- [Plugin/load-balancer] Correctly create a _simple_ instead of a _density_ plan when it is selected (PR [#7358](https://github.com/vatesfr/xen-orchestra/pull/7358))

### Released packages

- xo-server 5.136.0
- xo-server-load-balancer 0.8.1
- xo-web 5.136.1

## **5.91.1** (2024-02-06)

### Bug fixes

- [Import/VMWare] Fix `Error: task has been destroyed before completion` with XVA import [Forum#70513](https://xcp-ng.org/forum/post/70513)
- [Import/VM] Fix `UUID_INVALID(VM, OpaqueRef:...)` error when importing from URL
- [Proxies] Fix `xapi.getOrWaitObject is not a function` is not a function during deployment
- [REST API] Fix empty object's tasks list
- [REST API] Fix incorrect `href` in `/:collection/:object/tasks`

### Released packages

- @xen-orchestra/immutable-backups 1.0.1
- @xen-orchestra/xva 1.0.2
- xo-server 5.135.1

## **5.91.0** (2024-01-31)

### Highlights

- [Import/VMWare] Speed up import and make all imports thin [#7323](https://github.com/vatesfr/xen-orchestra/issues/7323)
- [Backup] Implement Backup Repository immutability (PR [#6928](https://github.com/vatesfr/xen-orchestra/pull/6928))
- [REST API] New pool action: `emergency_shutdown`, it suspends all the VMs and then shuts down all the host [#7277](https://github.com/vatesfr/xen-orchestra/issues/7277) (PR [#7279](https://github.com/vatesfr/xen-orchestra/pull/7279))
- [REST API] New pool action: `create_vm` [#6749](https://github.com/vatesfr/xen-orchestra/issues/6749)
- [Pool/Advanced] Ability to do a `Rolling Pool Reboot` (Enterprise plans) [#6885](https://github.com/vatesfr/xen-orchestra/issues/6885)
- [Tags] Admins can create colored tags (PR [#7262](https://github.com/vatesfr/xen-orchestra/pull/7262))
- [VM] Custom notes [#5792](https://github.com/vatesfr/xen-orchestra/issues/5792) (PR [#7322](https://github.com/vatesfr/xen-orchestra/pull/7322))(PRs [#7243](https://github.com/vatesfr/xen-orchestra/pull/7243), [#7242](https://github.com/vatesfr/xen-orchestra/pull/7242))
- [Plugin/load-balancer] Limit concurrent VM migrations to 2 (configurable) to avoid long paused VMs [#7084](https://github.com/vatesfr/xen-orchestra/issues/7084) (PR [#7297](https://github.com/vatesfr/xen-orchestra/pull/7297))
- [SR] Possibility to create SMB shared SR [#991](https://github.com/vatesfr/xen-orchestra/issues/991) (PR [#7330](https://github.com/vatesfr/xen-orchestra/pull/7330))
- [Tags] Add tooltips on `xo:no-bak` and `xo:notify-on-snapshot` tags (PR [#7335](https://github.com/vatesfr/xen-orchestra/pull/7335))
- [Host/Reboot] Confirmation modal to reboot an updated slave host if the master is not [#7059](https://github.com/vatesfr/xen-orchestra/issues/7059) (PR [#7293](https://github.com/vatesfr/xen-orchestra/pull/7293))
- [Pool/Host] Add a warning if hosts do not have the same version within a pool [#7059](https://github.com/vatesfr/xen-orchestra/issues/7059) (PR [#7280](https://github.com/vatesfr/xen-orchestra/pull/7280))
- [VM/Advanced] Admins can change VM creator [Forum#7313](https://xcp-ng.org/forum/topic/7313/change-created-by-and-date-information) (PR [#7276](https://github.com/vatesfr/xen-orchestra/pull/7276))
- [XOSTOR] Allow user to ignore file systems at storage creation (PR[#7338](https://github.com/vatesfr/xen-orchestra/pull/7338))
- [Settings/Logs] Transform objects UUIDs and OpaqueRefs into clickable links, leading to the corresponding object page (PR [#7300](https://github.com/vatesfr/xen-orchestra/pull/7300))
- [Pool/patches] Disable Rolling Pool Update button if host is alone in its pool [#6415](https://github.com/vatesfr/xen-orchestra/issues/6415) (PR [#7286](https://github.com/vatesfr/xen-orchestra/pull/7286))

### Enhancements

- [xo-cli] Supports NDJSON response for the `rest get` command (it also respects the `--json` flag) [Forum#69326](https://xcp-ng.org/forum/post/69326)
- [Settings/Logs] Use GitHub issue form with pre-filled fields when reporting a bug [#7142](https://github.com/vatesfr/xen-orchestra/issues/7142) (PR [#7274](https://github.com/vatesfr/xen-orchestra/pull/7274))
- [Tasks] Hide `/rrd_updates` tasks by default
- [Sign in] Support _Remember me_ feature with external providers (PR [#7298](https://github.com/vatesfr/xen-orchestra/pull/7298))
- [Plugins] Loading, or unloading, will respectively enable, or disable, _Auto-load at server start_, this should lead to least surprising behaviors (PR [#7317](https://github.com/vatesfr/xen-orchestra/pull/7317))
- [Backup/Restore] Show whether the memory was backed up (PR [#7315](https://github.com/vatesfr/xen-orchestra/pull/7315))

### Bug fixes

- [Proxies] Fix `this.getObject` is not a function during deployment
- [Settings/Logs] Fix `sr.getAllUnhealthyVdiChainsLength: not enough permissions` error with non-admin users (PR [#7265](https://github.com/vatesfr/xen-orchestra/pull/7265))
- [Settings/Logs] Fix `proxy.getAll: not enough permissions` error with non-admin users (PR [#7249](https://github.com/vatesfr/xen-orchestra/pull/7249))
- [Replication/Health Check] Fix `healthCheckVm.add_tag is not a function` error [Forum#69156](https://xcp-ng.org/forum/post/69156)
- [Plugin/load-balancer] Prevent unwanted migrations to hosts with low free memory (PR [#7288](https://github.com/vatesfr/xen-orchestra/pull/7288))
- Avoid unnecessary `pool.add_to_other_config: Duplicate key` error in XAPI log [Forum#68761](https://xcp-ng.org/forum/post/68761)
- [Jobs] Reset parameters when editing method to avoid invalid parameters on execution [Forum#69299](https://xcp-ng.org/forum/post/69299)
- [Metadata Backup] Fix `ENOENT` error when restoring an _XO Config_ backup [Forum#68999](https://xcp-ng.org/forum/post/68999)
- [REST API] Fix `/backup/log/<id>` which was broken by the `/backups` to `/backup` renaming [Forum#69426](https://xcp-ng.org/forum/post/69426)
- [Backup/Restore] Fix unnecessary pool selector in XO config backup restore modal [Forum#8130](https://xcp-ng.org/forum/topic/8130/xo-configbackup-restore) (PR [#7287](https://github.com/vatesfr/xen-orchestra/pull/7287))
- [File restore] Fix potential race condition in partition mount/unmount (PR [#7312](https://github.com/vatesfr/xen-orchestra/pull/7312))
- [Modal] Fix opened modal not closing when navigating to another route/URL (PR [#7301](https://github.com/vatesfr/xen-orchestra/pull/7301))
- [Backup/Restore] Don't count memory as a key (i.e. complete) disk [Forum#8212](https://xcp-ng.org/forum/post/69591) (PR [#7315](https://github.com/vatesfr/xen-orchestra/pull/7315))
- [PIF] Fix IPv4 reconfiguration only worked when the IPv4 mode was updated (PR [#7324](https://github.com/vatesfr/xen-orchestra/pull/7324))
- [Backup/Smart mode] Make preview correctly ignoring `xo:no-bak` tags [Forum#69797](https://xcp-ng.org/forum/post/69797) (PR [#7331](https://github.com/vatesfr/xen-orchestra/pull/7331))
- [Pool/Advanced] Show pool backup/migration network even if they no longer exist (PR [#7303](https://github.com/vatesfr/xen-orchestra/pull/7303))
- [Import/disk] Couldn't update 'name' field when importing from a URL [#7326](https://github.com/vatesfr/xen-orchestra/issues/7326) (PR [#7332](https://github.com/vatesfr/xen-orchestra/pull/7332))
- [Pool/patches] Disable Rolling Pool Update button if some powered up VMs are using a non-shared storage [#6415](https://github.com/vatesfr/xen-orchestra/issues/6415) (PR [#7294](https://github.com/vatesfr/xen-orchestra/pull/7294))

## Released packages

- @vates/decorate-with 2.1.0
- @vates/fuse-vhd 2.1.0
- xen-api 2.0.1
- @xen-orchestra/xapi 4.2.0
- @xen-orchestra/self-signed 0.2.0
- xo-server-load-balancer 0.8.0
- @xen-orchestra/vmware-explorer 0.4.0
- @xen-orchestra/xva 1.0.0
- @xen-orchestra/fs 4.1.4
- @xen-orchestra/backups 0.44.6
- @xen-orchestra/immutable-backups 1.0.0
- @xen-orchestra/proxy 0.26.45
- xo-cli 0.26.0
- xo-server 5.135.0
- xo-web 5.136.0

## **5.90.0** (2023-12-29)

### Highlights

- [VDI] Create XAPI task during NBD export (PR [#7228](https://github.com/vatesfr/xen-orchestra/pull/7228))
- [Backup] Use multiple link to speedup NBD backup (PR [#7216](https://github.com/vatesfr/xen-orchestra/pull/7216))
- [VDI/Export] Expose NBD settings in the XO and REST APIs api (PR [#7251](https://github.com/vatesfr/xen-orchestra/pull/7251))
- [Tags] Implement scoped tags (PR [#7270](https://github.com/vatesfr/xen-orchestra/pull/7270))
- [HTTP] `http.useForwardedHeaders` setting can be enabled when XO is behind a reverse proxy to fetch clients IP addresses from `X-Forwarded-*` headers [Forum#67625](https://xcp-ng.org/forum/post/67625) (PR [#7233](https://github.com/vatesfr/xen-orchestra/pull/7233))
- [Plugin/auth-saml] Add _Force re-authentication_ setting [Forum#67764](https://xcp-ng.org/forum/post/67764) (PR [#7232](https://github.com/vatesfr/xen-orchestra/pull/7232))
- [VM] Trying to increase the memory of a running VM will now propose the option to automatically restart it and increasing its memory [#7069](https://github.com/vatesfr/xen-orchestra/issues/7069) (PR [#7244](https://github.com/vatesfr/xen-orchestra/pull/7244))
- [xo-cli] Explicit error when attempting to use REST API before being registered
- [REST API] _XO config & Pool metadata Backup_ jobs are available at `/backup/jobs/metadata`
- [REST API] _Mirror Backup_ jobs are available at `/backup/jobs/mirror`
- [Host/Network/PIF] Display and ability to edit IPv6 field [#5400](https://github.com/vatesfr/xen-orchestra/issues/5400) (PR [#7218](https://github.com/vatesfr/xen-orchestra/pull/7218))
- [SR] show an icon on SR during VDI coalescing (with XCP-ng 8.3+) (PR [#7241](https://github.com/vatesfr/xen-orchestra/pull/7241))

### Enhancements

- [Forget SR] Changed the modal message and added a confirmation text to be sure the action is understood by the user [#7148](https://github.com/vatesfr/xen-orchestra/issues/7148) (PR [#7155](https://github.com/vatesfr/xen-orchestra/pull/7155))
- [REST API] `/backups` has been renamed to `/backup` (redirections are in place for compatibility)
- [REST API] _VM backup & Replication_ jobs have been moved from `/backup/jobs/:id` to `/backup/jobs/vm/:id` (redirections are in place for compatibility)
- [Backup] Show if disk is differential or full in incremental backups (PR [#7222](https://github.com/vatesfr/xen-orchestra/pull/7222))
- [Menu/Proxies] Added a warning icon if unable to check proxies upgrade (PR [#7237](https://github.com/vatesfr/xen-orchestra/pull/7237))

### Bug fixes

- [REST API] Returns a proper 404 _Not Found_ error when a job does not exist instead of _Internal Server Error_
- [Host/Smart reboot] Automatically retries up to a minute when `HOST_STILL_BOOTING` [#7194](https://github.com/vatesfr/xen-orchestra/issues/7194) (PR [#7231](https://github.com/vatesfr/xen-orchestra/pull/7231))
- [Plugin/transport-slack] Compatibility with other services like Mattermost or Discord [#7130](https://github.com/vatesfr/xen-orchestra/issues/7130) (PR [#7220](https://github.com/vatesfr/xen-orchestra/pull/7220))
- [Host/Network] Fix error "PIF_IS_PHYSICAL" when trying to remove a PIF that had already been physically disconnected [#7193](https://github.com/vatesfr/xen-orchestra/issues/7193) (PR [#7221](https://github.com/vatesfr/xen-orchestra/pull/7221))
- [Backup] Reduce memory consumption when using NBD (PR [#7216](https://github.com/vatesfr/xen-orchestra/pull/7216))
- [Mirror backup] Fix _Report when_ setting being reset to _Failure_ when editing backup job (PR [#7235](https://github.com/vatesfr/xen-orchestra/pull/7235))
- [RPU] VMs are correctly migrated to their original host (PR [#7238](https://github.com/vatesfr/xen-orchestra/pull/7238))
- [Backup/Report] Missing report for Mirror Backup (PR [#7254](https://github.com/vatesfr/xen-orchestra/pull/7254))

### Released packages

- @vates/nbd-client 3.0.0
- @xen-orchestra/xapi 4.1.0
- @xen-orchestra/backups 0.44.3
- @xen-orchestra/proxy 0.26.42
- xo-server-auth-saml 0.11.0
- xo-server-transport-email 1.0.0
- xo-server-transport-slack 0.0.1
- xo-cli 0.23.0
- vhd-lib 4.9.0
- xo-server 5.132.0
- xo-web 5.133.0

## **5.89.0** (2023-11-30)

### Highlights

- [Restore] Show source remote and restoration time on a restored VM (PR [#7186](https://github.com/vatesfr/xen-orchestra/pull/7186))
- [Backup/Import] Show disk import status during Incremental Replication or restoration of Incremental Backup (PR [#7171](https://github.com/vatesfr/xen-orchestra/pull/7171))
- [VM/Console] Add a message to indicate that the console view has been [disabled](https://support.citrix.com/article/CTX217766/how-to-disable-the-console-for-the-vm-in-xencenter) for this VM [#6319](https://github.com/vatesfr/xen-orchestra/issues/6319) (PR [#7161](https://github.com/vatesfr/xen-orchestra/pull/7161))
- [REST API] `tags` property can be updated (PR [#7196](https://github.com/vatesfr/xen-orchestra/pull/7196))
- [REST API] A VDI export can now be imported in an existing VDI (PR [#7199](https://github.com/vatesfr/xen-orchestra/pull/7199))
- [REST API] Support VM import using the XVA format
- [File Restore] API method `backupNg.mountPartition` to manually mount a backup disk on the XOA
- [Backup] Implement differential restore (PR [#7202](https://github.com/vatesfr/xen-orchestra/pull/7202))
- [VM/Disks] Display task information when importing VDIs (PR [#7197](https://github.com/vatesfr/xen-orchestra/pull/7197))
- [VM Creation] Added ISO option in new VM form when creating from template with a disk [#3464](https://github.com/vatesfr/xen-orchestra/issues/3464) (PR [#7166](https://github.com/vatesfr/xen-orchestra/pull/7166))
- [Task] Show the related SR on the Garbage Collector Task ( vdi coalescing) (PR [#7189](https://github.com/vatesfr/xen-orchestra/pull/7189))

### Enhancements

- [Netbox] Ability to synchronize XO users as Netbox tenants (PR [#7158](https://github.com/vatesfr/xen-orchestra/pull/7158))
- [Backup] Don't backup VM with tag xo:no-bak (PR [#7173](https://github.com/vatesfr/xen-orchestra/pull/7173))

### Bug fixes

- [Backup/Restore] In case of snapshot with memory, create the suspend VDI on the correct SR instead of the default one
- [Import/ESXi] Handle `Cannot read properties of undefined (reading 'perDatastoreUsage')` error when importing VM without storage (PR [#7168](https://github.com/vatesfr/xen-orchestra/pull/7168))
- [Export/OVA] Handle export with resulting disk larger than 8.2GB (PR [#7183](https://github.com/vatesfr/xen-orchestra/pull/7183))
- [Self Service] Fix error displayed after adding a VM to a resource set (PR [#7144](https://github.com/vatesfr/xen-orchestra/pull/7144))
- [Backup/HealthCheck] Don't backup VM created by health check when using smart mode (PR [#7173](https://github.com/vatesfr/xen-orchestra/pull/7173))

### Released packages

- vhd-lib 4.7.0
- @vates/multi-key-map 0.2.0
- @vates/disposable 0.1.5
- @xen-orchestra/fs 4.1.3
- xen-api 2.0.0
- @vates/nbd-client 2.0.1
- @xen-orchestra/xapi 4.0.0
- @xen-orchestra/backups 0.44.2
- @xen-orchestra/backups-cli 1.0.14
- @xen-orchestra/cr-seed-cli 1.0.0
- @xen-orchestra/proxy 0.26.41
- xo-vmdk-to-vhd 2.5.7
- @xen-orchestra/vmware-explorer 0.3.1
- xapi-explore-sr 0.4.2
- xo-cli 0.22.0
- xo-server 5.129.0
- xo-server-netbox 1.4.0
- xo-web 5.130.0

## **5.88.2** (2023-11-13)

### Enhancement

- [REST API] Add `users` collection
- [Authentication] Re-use existing token instead of creating a new one when connecting with the same user on the same browser

### Released packages

- xo-server 5.125.3

## **5.88.1** (2023-11-07)

### Bug fixes

- [Netbox] Fix VMs' `site` property being unnecessarily updated on some versions of Netbox (PR [#7145](https://github.com/vatesfr/xen-orchestra/pull/7145))
- [Netbox] Fix "400 Bad Request" error (PR [#7153](https://github.com/vatesfr/xen-orchestra/pull/7153))
- [Backup/Restore] Fix timeout after 5 minutes [#7052](https://github.com/vatesfr/xen-orchestra/issues/7052)
- [Dashboard/Health] Empty VDIs are no longer considered orphans (PR [#7102](https://github.com/vatesfr/xen-orchestra/pull/7102))
- [S3] Handle S3 without _Object Lock_ implementation (PR [#7157](https://github.com/vatesfr/xen-orchestra/pull/7157))

### Released packages

- @xen-orchestra/fs 4.1.2
- @xen-orchestra/proxy 0.26.38
- xo-server 5.125.2
- xo-server-netbox 1.3.3
- xo-web 5.127.2

## **5.88.0** (2023-10-31)

### Highlights

- [About] For source users, display if their XO is up to date [#5934](https://github.com/vatesfr/xen-orchestra/issues/5934) (PR [#7091](https://github.com/vatesfr/xen-orchestra/pull/7091))
- [Self] Show number of VMs that belong to each Resource Set (PR [#7114](https://github.com/vatesfr/xen-orchestra/pull/7114))
- [VM/New] Possibility to create and attach a _VTPM_ to a VM [#7066](https://github.com/vatesfr/xen-orchestra/issues/7066) [Forum#6578](https://xcp-ng.org/forum/topic/6578/xcp-ng-8-3-public-alpha/109) (PR [#7077](https://github.com/vatesfr/xen-orchestra/pull/7077))
- [XOSTOR] Ability to create a XOSTOR storage (PR [#6983](https://github.com/vatesfr/xen-orchestra/pull/6983))

### Enhancements

- [Host/Advanced] Allow to force _Smart reboot_ if some resident VMs have the suspend operation blocked [Forum#7136](https://xcp-ng.org/forum/topic/7136/suspending-vms-during-host-reboot/23) (PR [#7025](https://github.com/vatesfr/xen-orchestra/pull/7025))
- [Plugin/backup-report] Errors are now listed in XO tasks
- [PIF] Show network name in PIF selectors (PR [#7081](https://github.com/vatesfr/xen-orchestra/pull/7081))
- [VM/Advanced] Possibility to create/delete VTPM [#7066](https://github.com/vatesfr/xen-orchestra/issues/7066) [Forum#6578](https://xcp-ng.org/forum/topic/6578/xcp-ng-8-3-public-alpha/109) (PR [#7085](https://github.com/vatesfr/xen-orchestra/pull/7085))
- [Dashboard/Health] Displays number of VDIs to coalesce (PR [#7111](https://github.com/vatesfr/xen-orchestra/pull/7111))
- [Proxy] Ability to open support tunnel on XO Proxy (PRs [#7126](https://github.com/vatesfr/xen-orchestra/pull/7126) [#7127](https://github.com/vatesfr/xen-orchestra/pull/7127))
- [New network] Remove bonded PIFs from selector when creating network (PR [#7136](https://github.com/vatesfr/xen-orchestra/pull/7136))
- Try to preserve current page across reauthentication (PR [#7013](https://github.com/vatesfr/xen-orchestra/pull/7013))

### Bug fixes

- [Rolling Pool Update] After the update, when migrating VMs back to their host, do not migrate VMs that are already on the right host [Forum#7802](https://xcp-ng.org/forum/topic/7802) (PR [#7071](https://github.com/vatesfr/xen-orchestra/pull/7071))
- [RPU] Fix "XenServer credentials not found" when running a Rolling Pool Update on a XenServer pool (PR [#7089](https://github.com/vatesfr/xen-orchestra/pull/7089))
- [Usage report] Fix "Converting circular structure to JSON" error
- [Home] Fix OS icons alignment (PR [#7090](https://github.com/vatesfr/xen-orchestra/pull/7090))
- [SR/Advanced] Fix the total number of VDIs to coalesce by taking into account common chains [#7016](https://github.com/vatesfr/xen-orchestra/issues/7016) (PR [#7098](https://github.com/vatesfr/xen-orchestra/pull/7098))
- Don't require to sign in again in XO after losing connection to XO Server (e.g. when restarting or upgrading XO) (PR [#7103](https://github.com/vatesfr/xen-orchestra/pull/7103))
- [Usage report] Fix "Converting circular structure to JSON" error (PR [#7096](https://github.com/vatesfr/xen-orchestra/pull/7096))
- [Usage report] Fix "Cannot convert undefined or null to object" error (PR [#7092](https://github.com/vatesfr/xen-orchestra/pull/7092))
- [Plugin/transport-xmpp] Fix plugin load
- [Self Service] Fix Self users not being able to snapshot VMs when they're members of a user group (PR [#7129](https://github.com/vatesfr/xen-orchestra/pull/7129))
- [Netbox] Fix "The selected cluster is not assigned to this site" error [Forum#7887](https://xcp-ng.org/forum/topic/7887) (PR [#7124](https://github.com/vatesfr/xen-orchestra/pull/7124))
- [Backups] Fix `MESSAGE_METHOD_UNKNOWN` during full backup [Forum#7894](https://xcp-ng.org/forum/topic/7894)(PR [#7139](https://github.com/vatesfr/xen-orchestra/pull/7139))

### Released packages

- @xen-orchestra/fs 4.1.1
- @xen-orchestra/xapi 3.3.0
- @xen-orchestra/mixins 0.14.0
- xo-server-backup-reports 0.18.0
- xo-server-transport-xmpp 0.1.3
- xo-server-usage-report 0.10.5
- @xen-orchestra/backups 0.43.2
- @xen-orchestra/proxy 0.26.37
- xo-cli 0.21.0
- xo-server 5.125.1
- xo-server-netbox 1.3.2
- xo-web 5.127.1

## **5.87.0** (2023-09-29)

### Highlights

- [Patches] Support new XenServer Updates system. See [our documentation](https://docs.xen-orchestra.com/updater#xenserver-updates). (PR [#7044](https://github.com/vatesfr/xen-orchestra/pull/7044))
- [Host/Advanced] New button to download system logs [#3968](https://github.com/vatesfr/xen-orchestra/issues/3968) (PR [#7048](https://github.com/vatesfr/xen-orchestra/pull/7048))
- [Home/Hosts, Pools] Display host brand and version (PR [#7027](https://github.com/vatesfr/xen-orchestra/pull/7027))
- [SR] Ability to reclaim space [#1204](https://github.com/vatesfr/xen-orchestra/issues/1204) (PR [#7054](https://github.com/vatesfr/xen-orchestra/pull/7054))
- [XOA] New button to restart XO Server directly from the UI (PR [#7056](https://github.com/vatesfr/xen-orchestra/pull/7056))
- [Host/Advanced] Display system disks health based on the _smartctl_ plugin. [#4458](https://github.com/vatesfr/xen-orchestra/issues/4458) (PR [#7060](https://github.com/vatesfr/xen-orchestra/pull/7060))
- [Authentication] Failed attempts are now logged as XO tasks (PR [#7061](https://github.com/vatesfr/xen-orchestra/pull/7061))
- [Backup] Prevent VMs from being migrated while they are backed up (PR [#7024](https://github.com/vatesfr/xen-orchestra/pull/7024))
- [Backup] Prevent VMs from being backed up while they are migrated (PR [#7024](https://github.com/vatesfr/xen-orchestra/pull/7024))

### Enhancements

- [Netbox] Don't delete VMs that have been created manually in XO-synced cluster [Forum#7639](https://xcp-ng.org/forum/topic/7639) (PR [#7008](https://github.com/vatesfr/xen-orchestra/pull/7008))
- [Kubernetes] _Search domains_ field is now optional [#7028](https://github.com/vatesfr/xen-orchestra/pull/7028)
- [REST API] Hosts' audit and system logs can be downloaded [#3968](https://github.com/vatesfr/xen-orchestra/issues/3968) (PR [#7048](https://github.com/vatesfr/xen-orchestra/pull/7048))

### Bug fixes

- [Backup/Restore] Fix `Cannot read properties of undefined (reading 'id')` error when restoring via an XO Proxy (PR [#7026](https://github.com/vatesfr/xen-orchestra/pull/7026))
- [Google/GitHub Auth] Fix `Internal Server Error` (xo-server: `Cannot read properties of undefined (reading 'id')`) when logging in with Google or GitHub [Forum#7729](https://xcp-ng.org/forum/topic/7729) (PRs [#7031](https://github.com/vatesfr/xen-orchestra/pull/7031) [#7032](https://github.com/vatesfr/xen-orchestra/pull/7032))
- [Jobs] Fix schedules not being displayed on first load [#6968](https://github.com/vatesfr/xen-orchestra/issues/6968) (PR [#7034](https://github.com/vatesfr/xen-orchestra/pull/7034))
- [OVA Export] Fix support of disks with more than 8.2GiB of content (PR [#7047](https://github.com/vatesfr/xen-orchestra/pull/7047))
- [Backup] Fix `VHDFile implementation is not compatible with encrypted remote` when using VHD directory with encryption (PR [#7045](https://github.com/vatesfr/xen-orchestra/pull/7045))
- [Backup/Mirror] Fix `xo:fs:local WARN lock compromised` when mirroring a Backup Repository to a local/NFS/SMB repository ([#7043](https://github.com/vatesfr/xen-orchestra/pull/7043))
- [Ova import] Fix importing VM with collision in disk position (PR [#7051](https://github.com/vatesfr/xen-orchestra/pull/7051)) (issue [7046](https://github.com/vatesfr/xen-orchestra/issues/7046))
- [Backup/Mirror] Fix backup report not being sent (PR [#7049](https://github.com/vatesfr/xen-orchestra/pull/7049))
- [New VM] Only add MBR to cloud-init drive on Windows VMs to avoid booting issues (e.g. with Talos) (PR [#7050](https://github.com/vatesfr/xen-orchestra/pull/7050))
- [VDI Import] Add the SR name to the corresponding XAPI task (PR [#6979](https://github.com/vatesfr/xen-orchestra/pull/6979))

### Released packages

- xo-vmdk-to-vhd 2.5.6
- xo-server-auth-github 0.3.1
- xo-server-auth-google 0.3.1
- xo-server-netbox 1.3.0
- vhd-lib 4.6.1
- @xen-orchestra/xapi 3.2.0
- @xen-orchestra/backups 0.43.0
- @xen-orchestra/backups-cli 1.0.13
- @xen-orchestra/mixins 0.13.0
- @xen-orchestra/proxy 0.26.35
- xo-server 5.124.0
- xo-server-backup-reports 0.17.4
- xo-web 5.126.0

## **5.86.1** (2023-09-07)

### Bug fixes

- [User] _Forget all connection tokens_ button should not delete other users' tokens, even when current user is an administrator (PR [#7014](https://github.com/vatesfr/xen-orchestra/pull/7014))
- [Settings/Servers] Fix connection to old XenServer hosts using XML-RPC protocol (broken in XO 5.85.0)

### Released packages

- xen-api 1.3.6
- @xen-orchestra/proxy 0.26.33
- xo-server 5.122.0
- xo-web 5.124.1

## **5.86.0** (2023-08-31)

### Highlights

- [Netbox] Synchronize VM tags [#5899](https://github.com/vatesfr/xen-orchestra/issues/5899) [Forum#6902](https://xcp-ng.org/forum/topic/6902) (PR [#6957](https://github.com/vatesfr/xen-orchestra/pull/6957))
- [Pool/Advanced] Ability to set a crash dump SR [#5060](https://github.com/vatesfr/xen-orchestra/issues/5060) (PR [#6973](https://github.com/vatesfr/xen-orchestra/pull/6973))
- [Backups] Ability to set the NBD mode per backup job in the UI instead of globally in the config file (PR [#6995](https://github.com/vatesfr/xen-orchestra/pull/6995))
- [Backups] Add setting `concurrency` in a new configuration file `xo-merge-worker` (PR [#6995](https://github.com/vatesfr/xen-orchestra/pull/6995))
- [fs/s3] retry all methods on S3 failure to better support alternative providers (PR [#6966](https://github.com/vatesfr/xen-orchestra/pull/6966))

### Enhancements

- [REST API] Add support for `filter` and `limit` parameters to `backups/logs` and `restore/logs` collections [Forum#64789](https://xcp-ng.org/forum/post/64789)
- [Plugin/transport-email] Local hostname can now be configured [Forum#7579](https://xcp-ng.org/forum/topic/7579)
- [Netbox] Better handle cases where the IP addresses reported by XAPI are malformed (PR [#6989](https://github.com/vatesfr/xen-orchestra/pull/6989))
- [Netbox] Fallback to other VIF's IPs when first VIF doesn't have an IP [#6978](https://github.com/vatesfr/xen-orchestra/issues/6978) (PR [#6989](https://github.com/vatesfr/xen-orchestra/pull/6989))
- [Jobs] Jobs are ordered by their name in the _Scheduling_ form [Forum#64825](https://xcp-ng.org/forum/post/64825)

### Bug fixes

- [LDAP] Mark the _Id attribute_ setting as required
- [Incremental Replication] Fix `TypeError: Cannot read properties of undefined (reading 'uuid') at #isAlreadyOnHealthCheckSr` [Forum#7492](https://xcp-ng.org/forum/topic/7492) (PR [#6969](https://github.com/vatesfr/xen-orchestra/pull/6969))
- [File Restore] Increase timeout from one to ten minutes when restoring through XO Proxy
- [Home/VMs] Filtering with a UUID will no longer show other VMs on the same host/pool
- [Jobs] Fixes `invalid parameters` when editing [Forum#64668](https://xcp-ng.org/forum/post/64668)
- [Smart reboot] Fix cases where VMs remained in a suspended state (PR [#6980](https://github.com/vatesfr/xen-orchestra/pull/6980))
- [Backup/Health dashboard] Don't show mirrored VMs as detached backups (PR [#7000](https://github.com/vatesfr/xen-orchestra/pull/7000))
- [Netbox] Fix `the address has neither IPv6 nor IPv4 format` error [Forum#7625](https://xcp-ng.org/forum/topic/7625) (PR [#6990](https://github.com/vatesfr/xen-orchestra/pull/6990))
- [REST API] `limit` parameter now applies at the end of the `backups/logs` and `restore/logs` collections, i.e. it selects the last entries [Forum#64880](https://xcp-ng.org/forum/post/64880)
- [Audit] Ignore more side-effects free API methods

### Released packages

- xen-api 1.3.5
- @xen-orchestra/mixins 0.12.0
- xo-server-auth-ldap 0.10.8
- xo-server-transport-email 0.7.0
- @xen-orchestra/fs 4.1.0
- @xen-orchestra/xapi 3.1.0
- @xen-orchestra/backups 0.42.0
- @xen-orchestra/backups-cli 1.0.12
- @xen-orchestra/proxy 0.26.32
- xo-server 5.121.1
- xo-server-audit 0.10.5
- xo-server-netbox 1.2.0
- xo-web 5.124.0

## **5.85.0** (2023-07-31)

### Highlights

- [Import/From VMWare] Support ESXi 6.5+ with snapshot (PR [#6909](https://github.com/vatesfr/xen-orchestra/pull/6909))
- [Netbox] New major version. BREAKING: in order for this new version to work, you need to assign the type `virtualization > vminterface` to the custom field `UUID` in your Netbox instance. [See documentation](https://docs.xen-orchestra.com/advanced#netbox). [#6038](https://github.com/vatesfr/xen-orchestra/issues/6038) [#6135](https://github.com/vatesfr/xen-orchestra/issues/6135) [#6024](https://github.com/vatesfr/xen-orchestra/issues/6024) [#6036](https://github.com/vatesfr/xen-orchestra/issues/6036) [Forum#6070](https://xcp-ng.org/forum/topic/6070) [Forum#6149](https://xcp-ng.org/forum/topic/6149) [Forum#6332](https://xcp-ng.org/forum/topic/6332) [Forum#6902](https://xcp-ng.org/forum/topic/6902) (PR [#6950](https://github.com/vatesfr/xen-orchestra/pull/6950))
  - Synchronize VM description
  - Synchronize VM platform
  - Fix duplicated VMs in Netbox after disconnecting one pool
  - Migrating a VM from one pool to another keeps VM data added manually
  - Fix largest IP prefix being picked instead of smallest
  - Fix synchronization not working if some pools are unavailable
  - Better error messages
- [Backup/File restore] Faster and more robust ZIP export
- [Backup/File restore] Add faster tar+gzip (`.tgz`) export

### Enhancements

- [Backup/Restore] Button to open the raw log in the REST API (PR [#6936](https://github.com/vatesfr/xen-orchestra/pull/6936))
- [RPU] Avoid migration of VMs on hosts without missing patches (PR [#6943](https://github.com/vatesfr/xen-orchestra/pull/6943))
- [Settings/Users] Show users authentication methods (PR [#6962](https://github.com/vatesfr/xen-orchestra/pull/6962))
- [Settings/Users] User external authentication methods can be manually removed (PR [#6962](https://github.com/vatesfr/xen-orchestra/pull/6962))

### Bug fixes

- [Incremental Backup & Replication] Attempt to work around HVM multiplier issues when creating VMs on older XAPIs (PR [#6866](https://github.com/vatesfr/xen-orchestra/pull/6866))
- [REST API] Fix VDI export when NBD is enabled
- [XO Config Cloud Backup] Improve wording about passphrase (PR [#6938](https://github.com/vatesfr/xen-orchestra/pull/6938))
- [Pool] Fix IPv6 handling when adding hosts
- [New SR] Send provided NFS version to XAPI when probing a share
- [Backup/exports] Show more information on error ` stream has ended with not enough data (actual: xxx, expected: 512)` (PR [#6940](https://github.com/vatesfr/xen-orchestra/pull/6940))
- [Backup] Fix incremental replication with multiple SRs (PR [#6811](https://github.com/vatesfr/xen-orchestra/pull/6811))
- [New VM] Order interfaces by device as done on a VM Network tab (PR [#6944](https://github.com/vatesfr/xen-orchestra/pull/6944))
- Users can no longer sign in using their XO password if they are using other authentication providers (PR [#6962](https://github.com/vatesfr/xen-orchestra/pull/6962))

### Released packages

- @vates/read-chunk 1.2.0
- @vates/fuse-vhd 2.0.0
- xen-api 1.3.4
- @vates/nbd-client 2.0.0
- @vates/node-vsphere-soap 2.0.0
- @xen-orchestra/xapi 3.0.0
- @xen-orchestra/backups 0.40.0
- @xen-orchestra/backups-cli 1.0.10
- complex-matcher 0.7.1
- @xen-orchestra/mixins 0.11.0
- @xen-orchestra/proxy 0.26.30
- @xen-orchestra/vmware-explorer 0.3.0
- xo-server-audit 0.10.4
- xo-server-netbox 1.0.0
- xo-server-transport-xmpp 0.1.2
- xo-server-auth-github 0.3.0
- xo-server-auth-google 0.3.0
- xo-web 5.122.2
- xo-server 5.120.2

## **5.84.0** (2023-06-30)

### Highlights

- [Settings/Config] Add the possibility to backup/import/download XO config from/to the XO cloud (PR [#6917](https://github.com/vatesfr/xen-orchestra/pull/6917))
- [Import/Disk] Ability to import ISO from a URL (PR [#6924](https://github.com/vatesfr/xen-orchestra/pull/6924))
- [Import/export VDI] Ability to export/import disks in RAW format (PR [#6925](https://github.com/vatesfr/xen-orchestra/pull/6925))
- [RRD stats] Improve RRD stats performance (PR [#6903](https://github.com/vatesfr/xen-orchestra/pull/6903))

### Enhancements

- [XO Tasks] Abortion can now be requested, note that not all tasks will respond to it
- [Home/Pool] `No XCP-ng Pro support enabled on this pool` alert is considered a warning instead of an error (PR [#6849](https://github.com/vatesfr/xen-orchestra/pull/6849))
- [Plugin/auth-iodc] OpenID Connect scopes are now configurable and `profile` is included by default
- [Dashboard/Health] Button to copy UUID of an orphan VDI to the clipboard (PR [#6893](https://github.com/vatesfr/xen-orchestra/pull/6893))
- [Kubernetes recipe] Add the possibility to choose the version for the cluster [#6842](https://github.com/vatesfr/xen-orchestra/issues/6842) (PR [#6880](https://github.com/vatesfr/xen-orchestra/pull/6880))
- [New VM] cloud-init drives are now bootable in a Windows VM (PR [#6889](https://github.com/vatesfr/xen-orchestra/pull/6889))
- [Backups] Add setting `backups.metadata.defaultSettings.diskPerVmConcurrency` in xo-server's configuration file to limit the number of disks transferred in parallel per VM, this is useful to avoid transfer overloading remote and Sr (PR [#6787](https://github.com/vatesfr/xen-orchestra/pull/6787))
- [Import/Disk] Enhance clarity for importing ISO files [Forum#61480](https://xcp-ng.org/forum/post/61480) (PR [#6874](https://github.com/vatesfr/xen-orchestra/pull/6874))

### Bug fixes

- [Home/Host] Fix "isHostTimeConsistentWithXoaTime.then is not a function" (PR [#6896](https://github.com/vatesfr/xen-orchestra/pull/6896))
- [ESXi Import] was depending on an older unmaintained library that was downgrading the global security level of XO (PR [#6859](https://github.com/vatesfr/xen-orchestra/pull/6859))
- [Backup] Fix memory consumption when deleting _VHD directory_ incremental backups
- [Remote] Fix `remote is disabled` error when editing a disabled remote
- [Settings/Servers] Fix connection using an explicit IPv6 address
- [Backups/Health check] Use the right SR for health check during replication job (PR [#6902](https://github.com/vatesfr/xen-orchestra/pull/6902))

### Released packages

- @xen-orchestra/fs 4.0.1
- xen-api 1.3.3
- @vates/nbd-client 1.2.1
- @vates/node-vsphere-soap 1.0.0
- @vates/task 0.2.0
- @xen-orchestra/backups 0.39.0
- @xen-orchestra/backups-cli 1.0.9
- @xen-orchestra/mixins 0.10.2
- @xen-orchestra/proxy 0.26.29
- @xen-orchestra/vmware-explorer 0.2.3
- xo-cli 0.20.0
- xo-server-auth-oidc 0.3.0
- xo-server-perf-alert 0.3.6
- xo-server 5.118.0
- xo-web 5.121.0

## **5.83.3** (2023-06-23)

### Bug fixes

- [Settings/Servers] Fix connecting using an explicit IPv6 address
- [Full Replication] Fix garbage collecting previous replications

### Released packages

- xen-api 1.3.2
- @xen-orchestra/backups 0.38.3
- @xen-orchestra/proxy 0.26.28
- xo-server 5.116.4

## **5.83.2** (2023-06-01)

## Bug fixes

- [Backup] Fix `Cannot read properties of undefined (reading 'vm')` (PR [#6873](https://github.com/vatesfr/xen-orchestra/pull/6873))

### Released packages

- @xen-orchestra/backups 0.38.2
- @xen-orchestra/proxy 0.26.27
- xo-server 5.116.3

## **5.83.1** (2023-06-01)

### Bug fixes

- [Delta Replication] Fix not deleting older replications [Forum#62783](https://xcp-ng.org/forum/post/62783) (PR [#6871](https://github.com/vatesfr/xen-orchestra/pull/6871))

### Released packages

- @xen-orchestra/backups 0.38.1
- @xen-orchestra/proxy 0.26.26
- xo-server 5.116.2

## **5.83.0** (2023-05-31)

### Highlights

- [Backup] Implementation of mirror backup (Enterprise plan) (PRs [#6858](https://github.com/vatesfr/xen-orchestra/pull/6858), [#6854](https://github.com/vatesfr/xen-orchestra/pull/6854))
- [Self service] Add default tags to all VMs that will be created by a Self Service (PRs [#6810](https://github.com/vatesfr/xen-orchestra/pull/6810), [#6812](https://github.com/vatesfr/xen-orchestra/pull/6812))
- [Self Service] Ability to set a default value for the "Share VM" feature for Self Service users during creation/edition (PR [#6838](https://github.com/vatesfr/xen-orchestra/pull/6838))
- [REST API] Add endpoints to display missing patches for pools and hosts (PR [#6855](https://github.com/vatesfr/xen-orchestra/pull/6855))
- [REST API] _Rolling Pool Update_ action available `pools/<uuid>/actions/rolling_update`

### Enhancements

- [Proxy] Make proxy address editable (PR [#6816](https://github.com/vatesfr/xen-orchestra/pull/6816))
- [Home/Host] Displays a warning for hosts with HVM disabled [#6823](https://github.com/vatesfr/xen-orchestra/issues/6823) (PR [#6834](https://github.com/vatesfr/xen-orchestra/pull/6834))
- [OVA import] Workaround for OVA generated by Oracle VM with faulty size in metadata [#6824](https://github.com/vatesfr/xen-orchestra/issues/6824)
- [Kubernetes] Add the possibility to choose the number of fault tolerance for the control planes (PR [#6809](https://github.com/vatesfr/xen-orchestra/pull/6809))
- [Tasks] New type of tasks created by XO ("XO Tasks" section) (PRs [#6861](https://github.com/vatesfr/xen-orchestra/pull/6861) [#6869](https://github.com/vatesfr/xen-orchestra/pull/6869))
- [Backup/Health check] Add basic XO task for manual health check

### Bug fixes

- [Sorted table] In collapsed actions, a spinner is displayed during the action time (PR [#6831](https://github.com/vatesfr/xen-orchestra/pull/6831))
- [VM] Show SUSE icon when distro name is `opensuse` (PR [#6852](https://github.com/vatesfr/xen-orchestra/pull/6852))
- [ACL] Fix various `an error has occurred` due to ACLs (PR [#6848](https://github.com/vatesfr/xen-orchestra/pull/6848))
- [Home/host] When a host has an inconsistent time with XOA, an alert is displayed (PR [#6833](https://github.com/vatesfr/xen-orchestra/pull/6833))
- [Incremental Replication] Fix task showing as _interrupted_ when running without health check [Forum#62669](https://xcp-ng.org/forum/post/62669) (PR [#6866](https://github.com/vatesfr/xen-orchestra/pull/6866))
- [Host evacuation] Better error message when migration network no longer exists

### Released packages

- @xen-orchestra/fs 4.0.0
- @xen-orchestra/xapi 2.2.1
- @xen-orchestra/mixins 0.10.1
- xo-vmdk-to-vhd 2.5.5
- vhd-cli 0.9.3
- xo-cli 0.19.0
- vhd-lib 4.5.0
- @xen-orchestra/backups 0.38.0
- @xen-orchestra/backups-cli 1.0.8
- @xen-orchestra/proxy 0.26.25
- xo-server 5.116.0
- xo-web 5.119.1

## **5.82.2** (2023-05-17)

### Bug fixes

- [New/VM] Fix stuck Cloud Config import ([GitHub comment](https://github.com/vatesfr/xen-orchestra/issues/5896#issuecomment-1465253774))

### Released packages

- xen-api 1.3.1
- @xen-orchestra/proxy 0.26.23
- xo-server 5.114.2

## **5.82.1** (2023-05-12)

### Enhancements

- [Plugins] Clicking on a plugin name now filters out other plugins

### Bug fixes

- [Host/Network] Fix IP configuration not working with empty fields
- [Import/VM/From VMware] Fix `Property description must be an object: undefined` [Forum#61834](https://xcp-ng.org/forum/post/61834) [Forum#61900](https://xcp-ng.org/forum/post/61900)
- [Import/VM/From VMware] Fix `Cannot read properties of undefined (reading 'stream')` [Forum#59879](https://xcp-ng.org/forum/post/59879) (PR [#6825](https://github.com/vatesfr/xen-orchestra/pull/6825))
- [OVA export] Fix major memory leak which may lead to xo-server crash [Forum#56051](https://xcp-ng.org/forum/post/56051) (PR [#6800](https://github.com/vatesfr/xen-orchestra/pull/6800))
- [VM] Fix `VBD_IS_EMPTY` error when converting to template [Forum#61653](https://xcp-ng.org/forum/post/61653) (PR [#6808](https://github.com/vatesfr/xen-orchestra/pull/6808))
- [New/Network] Fix `invalid parameter error` when not providing a VLAN [Forum#62090](https://xcp-ng.org/forum/post/62090) (PR [#6829](https://github.com/vatesfr/xen-orchestra/pull/6829))
- [Backup/Health check] Fix `task has already ended` error during a healthcheck in continuous replication [Forum#62073](https://xcp-ng.org/forum/post/62073) (PR [#6830](https://github.com/vatesfr/xen-orchestra/pull/6830))

### Released packages

- @vates/task 0.1.2
- xo-vmdk-to-vhd 2.5.4
- @xen-orchestra/backups 0.36.1
- @xen-orchestra/proxy 0.26.22
- xo-server 5.114.1
- xo-web 5.117.1

## **5.82.0** (2023-04-28)

### Highlights

- [Host] Smart reboot: suspend resident VMs, restart host and resume VMs [#6750](https://github.com/vatesfr/xen-orchestra/issues/6750) (PR [#6795](https://github.com/vatesfr/xen-orchestra/pull/6795))
- [Backup/exports] Retry when failing to read a data block during Delta Backup, Continuous Replication, disk and OVA export when NBD is enabled [PR #6763](https://github.com/vatesfr/xen-orchestra/pull/6763)
- [Backup/Health check] [Opt-in XenStore API](https://docs.xen-orchestra.com/backups#backup-health-check) to execute custom checks inside the VM (PR [#6784](https://github.com/vatesfr/xen-orchestra/pull/6784))

### Enhancements

- [VM/Advanced] Automatically eject removable medias when converting a VM to a template [#6752](https://github.com/vatesfr/xen-orchestra/issues/6752) (PR [#6769](https://github.com/vatesfr/xen-orchestra/pull/6769))
- [Dashboard/Health] Add free space column for storage state table (PR [#6778](https://github.com/vatesfr/xen-orchestra/pull/6778))
- [VM/General] Displays the template name used to create the VM, as well as the email address of the VM creator for admin users (PR [#6771](https://github.com/vatesfr/xen-orchestra/pull/6771))
- [Kubernetes] Give the possibility to create a high availability cluster (PR [#6794](https://github.com/vatesfr/xen-orchestra/pull/6794))

### Bug fixes

- [Plugins/usage-report] Compute stats on configured period instead of the whole year (PR [#6723](https://github.com/vatesfr/xen-orchestra/pull/6723))
- [Backup] Fix `Invalid parameters` when deleting `speed limit` value (PR [#6768](https://github.com/vatesfr/xen-orchestra/pull/6768))
- [Delta Backup] Restoring a backup with memory must create a suspended VM [#5061](https://github.com/vatesfr/xen-orchestra/issues/5061) (PR [#6774](https://github.com/vatesfr/xen-orchestra/pull/6774))
- [Backup] Show original error instead of `stream has ended without data`
- [Ova import] Fix Ova import error `No user expected grain marker, received [object Object]` [Forum#60648](https://xcp-ng.org/forum/post/60648) (PR [#6779](https://github.com/vatesfr/xen-orchestra/pull/6779))
- [Continuous Replication] Remove irrelevant _Suspend VDI not available for this suspended VM_ error [Forum#61169](https://xcp-ng.org/forum/post/61169)
- [Kubernetes recipe] Add DNS configuration (PR [#6678](https://github.com/vatesfr/xen-orchestra/pull/6678))
- [Backup] Fix `INTERNAL_ERROR, (Failure \"Expected bool, got 'I(0)'\")"` restoring a VM extracted from an XenServer < 7.1(PR [#6772](https://github.com/vatesfr/xen-orchestra/pull/6772))

### Released packages

- @vates/diff 0.1.0
- @vates/read-chunk 1.1.1
- @vates/stream-reader 0.1.0
- vhd-lib 4.4.0
- xen-api 1.3.0
- @vates/nbd-client 1.2.0
- @xen-orchestra/xapi 2.2.0
- @xen-orchestra/mixins 0.10.0
- @xen-orchestra/vmware-explorer 0.2.2
- xo-cli 0.18.0
- xo-server-usage-report 0.10.4
- @vates/task 0.1.1
- @xen-orchestra/backups 0.36.0
- @xen-orchestra/backups-cli 1.0.6
- @xen-orchestra/proxy 0.26.21
- xo-server 5.113.0
- xo-web 5.116.1

## **5.81** (2023-03-31)

### Highlights

- [VM] Show distro icon for opensuse-microos [Forum#6965](https://xcp-ng.org/forum/topic/6965) (PR [#6746](https://github.com/vatesfr/xen-orchestra/pull/6746))
- [Backup] Display the VM name label in the log even if the VM is not currently connected
- [Backup] Display the SR name label in the log even if the SR is not currently connected
- [Import VM] Ability to import multiple VMs from ESXi (PR [#6718](https://github.com/vatesfr/xen-orchestra/pull/6718))
- [Backup/Advanced setting] Ability to add transfer limit per job (PRs [#6737](https://github.com/vatesfr/xen-orchestra/pull/6737), [#6728](https://github.com/vatesfr/xen-orchestra/pull/6728))
- [License] Show Pro Support status icon at host level (PR [#6633](https://github.com/vatesfr/xen-orchestra/pull/6633))
- [REST API] Backup logs are now available at `/rest/v0/backups/logs` and `/rest/v0/restore/logs`
- [REST API] Backup jobs are now available at `/rest/v0/backups/jobs`

### Bug fixes

- [Backup/Restore] Fix restore via a proxy showing as interrupted (PR [#6702](https://github.com/vatesfr/xen-orchestra/pull/6702))
- [ESXI import] Fix failing imports when using non default datacenter name [Forum#59543](https://xcp-ng.org/forum/post/59543) PR [#6729](https://github.com/vatesfr/xen-orchestra/pull/6729)
- [Backup] Fix backup worker consuming too much memory and being killed by system during full VM backup to S3 compatible remote PR [#6732](https://github.com/vatesfr/xen-orchestra/pull/6732)
- [Plugin/perf-alert] Ignore special SRs (e.g. _XCP-ng Tools_, _DVD drives_, etc) as their usage is always 100% (PR [#6755](https://github.com/vatesfr/xen-orchestra/pull/6755))
- [S3 remote] Relax bucket checks in browser to improve experience on S3 compatible remote [Forum#60426](https://xcp-ng.org/forum/post/60426) (PR [#6757](https://github.com/vatesfr/xen-orchestra/pull/6757))

### Released packages

- @vates/nbd-client 1.1.0
- @vates/read-chunk 1.1.0
- @xen-orchestra/fs 3.3.4
- @xen-orchestra/backups 0.34.0
- @xen-orchestra/backups-cli 1.0.4
- @xen-orchestra/proxy 0.26.19
- @xen-orchestra/vmware-explorer 0.2.1
- @xen-orchestra/xapi 2.1.0
- vhd-lib 4.3.0
- xo-cli 0.17.1
- xo-server 5.111.1
- xo-server-perf-alert 0.3.5
- xo-web 5.114.0

## **5.80.2** (2023-03-16)

### Enhancements

- [Plugin/auth-oidc] Support `email` for _username field_ setting [Forum#59587](https://xcp-ng.org/forum/post/59587)
- [Plugin/auth-oidc] Well-known suffix is now optional in _auto-discovery URL_
- [PIF selector] Display the VLAN number when displaying a VLAN PIF [#4697](https://github.com/vatesfr/xen-orchestra/issues/4697) (PR [#6714](https://github.com/vatesfr/xen-orchestra/pull/6714))
- [Home/pool, host] Grouping of alert icons (PR [#6655](https://github.com/vatesfr/xen-orchestra/pull/6655))

### Bug fixes

- [Plugin/auth-oidc] Fix empty user names when using default config [Forum#59587](https://xcp-ng.org/forum/post/59587)
- [Pool/Pro License] Fix handling of licenses with no expiration date (PR [#6730](https://github.com/vatesfr/xen-orchestra/pull/6730))

### Released packages

- xo-server-auth-oidc 0.2.0
- xo-web 5.113.0

## **5.80.1** (2023-03-07)

### Bug fixes

- [Import VM] fix invalid parameters when importing a VM from VMware [Forum#6714](https://xcp-ng.org/forum/topic/6714/vmware-migration-tool-we-need-your-feedback/143) (PR [#6696](https://github.com/vatesfr/xen-orchestra/pull/6696))
- [Backup] Fix _A "socket" was not created for HTTP request before 300000ms_ error [Forum#59163](https://xcp-ng.org/forum/post/59163) [#6656](https://github.com/vatesfr/xen-orchestra/issues/6656)
- Fix display of dates (e.g. _13 Apr 55055_ instead of _01 Feb 2023_) [Forum#58965](https://xcp-ng.org/forum/post/58965) [Forum#59605](https://xcp-ng.org/forum/post/59605)
- [ESXI import] Fix failing imports when using non default datacenter name [Forum#7035](https://xcp-ng.org/forum/topic/7035/vmware-import-404-error) [Forum#59390](https://xcp-ng.org/forum/post/59390) PR [#6694](https://github.com/vatesfr/xen-orchestra/pull/6694)

### Released packages

- xen-api 1.2.7
- @xen-orchestra/xapi 2.0.0
- @xen-orchestra/backups 0.32.0
- @xen-orchestra/backups-cli 1.0.2
- @xen-orchestra/proxy 0.26.17
- @xen-orchestra/vmware-explorer 0.2.0
- xo-server 5.110.1
- xo-web 5.112.1

## **5.80.0** (2023-02-28)

### Highlights

- [VM/Advanced] Warning message when enabling Windows update tools [#6627](https://github.com/vatesfr/xen-orchestra/issues/6627) (PR [#6681](https://github.com/vatesfr/xen-orchestra/issues/6681))
- [Continuous Replication] : add HealthCheck support to Continuous Replication (PR [#6668](https://github.com/vatesfr/xen-orchestra/pull/6668))
- [Plugin/auth-oidc] [OpenID Connect](<https://en.wikipedia.org/wiki/OpenID#OpenID_Connect_(OIDC)>) authentication plugin [#6641](https://github.com/vatesfr/xen-orchestra/issues/6641) (PR [#6684](https://github.com/vatesfr/xen-orchestra/issues/6684))
- [REST API] Possibility to start, shutdown, reboot and snapshot VMs
- [Import VM] Ability to import a VM from ESXi (PR [#6663](https://github.com/vatesfr/xen-orchestra/pull/6663))
- [Backup Metadata] Add pool selection to metadata restoration (PR [#6670](https://github.com/vatesfr/xen-orchestra/pull/6670))
- [Backup] Show if NBD is used in the backup logs (PR [#6685](https://github.com/vatesfr/xen-orchestra/issues/6685))

### Bug fixes

- [xo-cli] Fix `write EPIPE` error when used with piped output is closed (e.g. like `| head`) [#6680](https://github.com/vatesfr/xen-orchestra/issues/6680)
- [VM] Show distro icon for openSUSE [Forum#6965](https://xcp-ng.org/forum/topic/6965) (PR [#6676](https://github.com/vatesfr/xen-orchestra/pull/6676))
- [ESXI import] Handle listing more than 100 VMs

### Released packages

- @xen-orchestra/fs 3.3.2
- @xen-orchestra/backups 0.30.0
- @xen-orchestra/backups-cli 1.0.1
- @xen-orchestra/proxy 0.26.15
- @xen-orchestra/vmware-explorer 0.1.0
- xo-cli 0.15.0
- xo-server 5.110.0
- xo-server-auth-oidc 0.1.0
- xo-server-netbox 0.3.7
- xo-server-perf-alert 0.3.4
- xo-server-transport-icinga2 0.1.2
- xo-web 5.112.0

## **5.79.3** (2023-02-25)

### Bug fixes

- [Backup] Fix `Error: 302 Found` when exporting a VDI from a local SR on another host than the pool master [Forum#59047](https://xcp-ng.org/forum/post/59047)

### Released packages

- xen-api 1.2.6
- @xen-orchestra/proxy 0.26.14
- xo-server 5.109.4

## **5.79.2** (2023-02-20)

### Bug fixes

- [Disk import] Fixes ` Cannot read properties of null (reading "length")` error
- [Continuous Replication] Work-around _premature close_ error

### Released packages

- xen-api 1.2.5
- @xen-orchestra/proxy 0.26.13
- xo-server 5.109.3

## **5.79.1** (2023-02-17)

### Bug fixes

- [Continuous Replication] Fix `VDI_IO_ERROR` when after a VDI has been resized
- [REST API] Fix VDI import
- Fix failing imports (REST API and web UI) [Forum#58146](https://xcp-ng.org/forum/post/58146)
- [Pool/License] Fix license expiration on license binding modal (PR [#6666](https://github.com/vatesfr/xen-orchestra/pull/6666))
- [NBD Backup] Fix VDI not disconnecting from control domain (PR [#6660](https://github.com/vatesfr/xen-orchestra/pull/6660))
- [NBD Backup] Improve performance by avoid unnecessary VDI transfers
- [Home/Pool] Do not check for support on non `XCP-ng` pool (PR [#6661](https://github.com/vatesfr/xen-orchestra/pull/6661))
- [VMDK/OVA import] Fix error importing a VMDK or an OVA generated from XO (PR [#6669](https://github.com/vatesfr/xen-orchestra/pull/6669))

### Released packages

- xen-api 1.2.4
- @vates/nbd-client 1.0.1
- @xen-orchestra/backups 0.29.6
- @xen-orchestra/proxy 0.26.12
- xo-vmdk-to-vhd 2.5.3
- xo-cli 0.14.4
- xo-server 5.109.2
- xo-server-transport-email 0.6.1
- xo-web 5.111.1

## **5.79.0** (2023-01-31)

### Highlights

- [REST API] Expose `residentVms` property on hosts objects
- [REST API] The raw content of a VDI can be downloaded directly
- [REST API] Ability to update the name and description of objects
- [REST API] Add support to destroy VMs and VDIs
- [Kubernetes recipe] Add the possibility to create the cluster with a static network configuration (PR [#6598](https://github.com/vatesfr/xen-orchestra/pull/6598))
- [VM/Advanced] Add configuration flag for _Viridian_ platform [#6572](https://github.com/vatesfr/xen-orchestra/issues/6572) (PR [#6631](https://github.com/vatesfr/xen-orchestra/pull/6631))
- [Network/NBD] Add the possibility to add and change the NBD connection associated to a Network (PR [#6646](https://github.com/vatesfr/xen-orchestra/pull/6646))
- [VM/Advanced] Clarify _Windows Update_ label [#6628](https://github.com/vatesfr/xen-orchestra/issues/6628) (PR [#6632](https://github.com/vatesfr/xen-orchestra/pull/6632))

### Enhancements

- [Licenses] Makes `id` and `boundObjectId` copyable (PR [#6634](https://github.com/vatesfr/xen-orchestra/pull/6634))

### Bug fixes

- [REST API] Fix 5 minutes timeouts on VDI/VM uploads [#6568](https://github.com/vatesfr/xen-orchestra/issues/6568)
- [Backup] Fix NBD configuration (PR [#6597](https://github.com/vatesfr/xen-orchestra/pull/6597))
- [NBD Backups] Fix transfer size [#6599](https://github.com/vatesfr/xen-orchestra/issues/6599)
- [Disk] Show bootable status for vm running in `pv_in_pvh` virtualisation mode [#6432](https://github.com/vatesfr/xen-orchestra/issues/6432) (PR [#6629](https://github.com/vatesfr/xen-orchestra/pull/6629))
- [Ova export] Reduce memory consumption (PR [#6637](https://github.com/vatesfr/xen-orchestra/pull/6637))
- [Host/Network] Remove extra "mode" column in PIF table (PR [#6640](https://github.com/vatesfr/xen-orchestra/pull/6640))
- [Ova export] Better computation of overprovisioning for very sparse disks (PR [#6639](https://github.com/vatesfr/xen-orchestra/pull/6639))

### Released packages

- @xen-orchestra/log 0.6.0
- @vates/disposable 0.1.4
- @xen-orchestra/fs 3.3.1
- vhd-lib 4.2.1
- @vates/task 0.0.1
- @xen-orchestra/audit-core 0.2.3
- @xen-orchestra/backups 0.29.5
- @xen-orchestra/mixins 0.9.0
- @xen-orchestra/xapi 1.6.1
- @xen-orchestra/proxy 0.26.10
- xo-vmdk-to-vhd 2.5.2
- @xen-orchestra/upload-ova 0.1.6
- @xen-orchestra/vmware-explorer 0.0.3
- xo-cli 0.14.3
- xo-server 5.109.0
- xo-server-audit 0.10.3
- xo-server-auth-ldap 0.10.7
- xo-server-backup-reports 0.17.3
- xo-server-load-balancer 0.7.3
- xo-server-netbox 0.3.6
- xo-server-perf-alert 0.3.3
- xo-server-sdn-controller 1.0.8
- xo-server-transport-nagios 1.0.1
- xo-server-usage-report 0.10.3
- xo-server-web-hooks 0.3.3
- xo-web 5.111.0

## **5.78.0** (2022-12-20)

### Highlights

- [Snapshot] Use the new [`ignore_vdis` feature](https://github.com/xapi-project/xen-api/pull/4563) of XCP-ng/XenServer 8.3

### Enhancements

- [Hub/Recipes/Kubernetes] Now use the [Flannel](https://github.com/flannel-io/flannel) Container Network Interface plugin to handle network

### Bug fixes

- [Nagios] Fix reporting, broken in 5.77.2

### Released packages

- @xen-orchestra/xapi 1.6.0
- @xen-orchestra/backups 0.29.4
- @xen-orchestra/proxy 0.26.9
- xo-server 5.107.5
- xo-web 5.109.0

## **5.77.2** (2022-12-12)

### Bug fixes

- [Backups] Fixes most of the _unexpected number of entries in backup cache_ errors

### Released packages

- @xen-orchestra/backups 0.29.3
- @xen-orchestra/proxy 0.26.7
- xo-server 5.107.3

## **5.77.1** (2022-12-07)

### Enhancements

- [Backups] Automatically detect, report and fix cache inconsistencies

### Bug fixes

- [Warm migration] Fix start and delete VMs after a warm migration [#6568](https://github.com/vatesfr/xen-orchestra/issues/6568)

### Released packages

- @xen-orchestra/backups 0.29.2
- @xen-orchestra/proxy 0.26.6
- xo-server 0.107.2

## **5.77.0** (2022-11-30)

### Highlights

- [Proxies] Ability to register an existing proxy (PR [#6556](https://github.com/vatesfr/xen-orchestra/pull/6556))
- [VM] [Warm migration](https://xen-orchestra.com/blog/warm-migration-with-xen-orchestra/) support (PRs [6549](https://github.com/vatesfr/xen-orchestra/pull/6549) & [6549](https://github.com/vatesfr/xen-orchestra/pull/6549))

### Enhancements

- [Remotes] Prevent remote path from ending with `xo-vm-backups` as it's usually a mistake
- [OVA export] Speed up OVA generation by 2. Generated file will be bigger (as big as uncompressed XVA) (PR [#6487](https://github.com/vatesfr/xen-orchestra/pull/6487))
- [Settings/Users] Add `Remove` button to delete OTP of users from the admin panel [Forum#6521](https://xcp-ng.org/forum/topic/6521/remove-totp-on-a-user-account) (PR [#6541](https://github.com/vatesfr/xen-orchestra/pull/6541))
- [Plugin/transport-nagios] XO now reports backed up VMs individually with the VM name label used as _host_ and backup job name used as _service_
- [VM/Advanced] Add warm migration button (PR [#6533](https://github.com/vatesfr/xen-orchestra/pull/6533))

### Bug fixes

- [Dashboard/Health] Fix `Unknown SR` and `Unknown VDI` in Unhealthy VDIs (PR [#6519](https://github.com/vatesfr/xen-orchestra/pull/6519))
- [Delta Backup] Can now recover VHD merge when failed at the beginning
- [Delta Backup] Fix `ENOENT` errors when merging a VHD directory on non-S3 remote
- [Remote] Prevent the browser from auto-completing the encryption key field

### Released packages

- @xen-orchestra/log 0.5.0
- @vates/disposable 0.1.3
- @xen-orchestra/fs 3.3.0
- vhd-lib 4.2.0
- @xen-orchestra/audit-core 0.2.2
- @xen-orchestra/backups 0.29.1
- @xen-orchestra/backups-cli 1.0.0
- @xen-orchestra/mixins 0.8.2
- @xen-orchestra/xapi 1.5.3
- @xen-orchestra/proxy 0.26.5
- xo-vmdk-to-vhd 2.5.0
- xo-cli 0.14.2
- xo-server 5.107.1
- xo-server-audit 0.10.2
- xo-server-auth-ldap 0.10.6
- xo-server-backup-reports 0.17.2
- xo-server-load-balancer 0.7.2
- xo-server-netbox 0.3.5
- xo-server-sdn-controller 1.0.7
- xo-server-transport-nagios 1.0.0
- xo-server-usage-report 0.10.2
- xo-server-web-hooks 0.3.2
- xo-web 5.108.0

## **5.76.2** (2022-11-14)

### Bug fixes

- [Proxies] Fix `this.getObject is not a function` on upgrade

### Released packages

- xo-server 5.106.1

## **5.76.1** (2022-11-08)

### Enhancements

- [API] `proxy.register` accepts `vmUuid` parameter which can be used when not connected to the XAPI containing the XO Proxy VM
- [Proxy] Can now upgrade proxies in VMs not connected to XO
- [REST API] Expose VM snapshots and templates
- [REST API] Expose VDI snapshots
- [Select license] Display product type in the options (PR [#6512](https://github.com/vatesfr/xen-orchestra/pull/6512))

### Bug fixes

- [Pool] Add tooltip on "no XCP-ng Pro support" warning icon (PR [#6505](https://github.com/vatesfr/xen-orchestra/pull/6505))
- [Backup] Respect HTTP proxy setting when connecting to XCP-ng/XenServer pools
- [Dashboard/Health] Fix `an error has occurred` in case of unknown default SR (PR [#6508](https://github.com/vatesfr/xen-orchestra/pull/6508))
- [Backup] Really disable Healthcheck when unchecking settings [#6501](https://github.com/vatesfr/xen-orchestra/issues/6501) (PR [#6515](https://github.com/vatesfr/xen-orchestra/pull/6515))
- [Pool] Improve XCP-ng Pro Support tooltips wording [Forum#6535](https://xcp-ng.org/forum/topic/6535) (PR [#6517](https://github.com/vatesfr/xen-orchestra/pull/6517))

### Released packages

- xo-server 5.106.0
- xo-web 5.107.0

## **5.76.0** (2022-10-31)

### Enhancements

- [Backup/Encryption] Use `aes-256-gcm` instead of `aes-256-ccm` to mitigate [padding oracle attacks](https://en.wikipedia.org/wiki/Padding_oracle_attack) (PR [#6447](https://github.com/vatesfr/xen-orchestra/pull/6447))
- [Settings/Remote] Display `lock` icon for encrypted remote and a warning if the remote uses a legacy encryption algorithm (PR [#6465](https://github.com/vatesfr/xen-orchestra/pull/6465))
- `xo-server`'s logs can now be sent to an external Syslog server
- [Delta Backup] Use [NBD](https://en.wikipedia.org/wiki/Network_block_device) to download disks (PR [#6461](https://github.com/vatesfr/xen-orchestra/pull/6461))
- [License] Possibility to bind XCP-ng license to hosts at pool level (PR [#6453](https://github.com/vatesfr/xen-orchestra/pull/6453))
- [New VM] Ability to destroy the cloud configuration disk after the first boot [#6438](https://github.com/vatesfr/xen-orchestra/issues/6438) (PR [#6486](https://github.com/vatesfr/xen-orchestra/pull/6486))

### Bug fixes

- Really enable by default the embedded HTTP/HTTPS proxy
- [Licenses] Remove "Bind license" button for proxies whose corresponding VM cannot be found (PR [#6472](https://github.com/vatesfr/xen-orchestra/pull/6472))

### Released packages

- @xen-orchestra/log 0.4.0
- @vates/disposable 0.1.2
- @vates/nbd-client 1.0.0
- @vates/otp 1.0.0
- @vates/predicates 1.1.0
- @vates/read-chunk 1.0.1
- @xen-orchestra/audit-core 0.2.1
- @xen-orchestra/backups 0.29.0
- @xen-orchestra/fs 3.2.0
- @xen-orchestra/mixins 0.8.1
- @xen-orchestra/xapi 1.5.2
- @xen-orchestra/proxy 0.26.4
- vhd-cli 0.9.2
- vhd-lib 4.1.1
- xo-remote-parser 0.9.2
- xo-server 5.105.0
- xo-server-audit 0.10.1
- xo-server-auth-ldap 0.10.5
- xo-server-backup-reports 0.17.1
- xo-server-load-balancer 0.7.1
- xo-server-netbox 0.3.4
- xo-server-sdn-controller 1.0.6
- xo-server-transport-nagios 0.1.2
- xo-server-usage-report 0.10.1
- xo-server-web-hooks 0.3.1
- xo-web 5.106.0

## **5.75.0** (2022-09-30)

### Enhancements

- [Backup/Restore file] Implement File level restore for s3 and encrypted backups (PR [#6409](https://github.com/vatesfr/xen-orchestra/pull/6409))
- [Backup] Improve listing speed by updating caches instead of regenerating them on backup creation/deletion (PR [#6411](https://github.com/vatesfr/xen-orchestra/pull/6411))
- [Backup] Add `mergeBlockConcurrency` and `writeBlockConcurrency` to allow tuning of backup resources consumptions (PR [#6416](https://github.com/vatesfr/xen-orchestra/pull/6416))
- [Sync hook] VM can now be notified before being snapshot, please [see the documentation](https://github.com/vatesfr/xen-orchestra/blob/master/@xen-orchestra/xapi/docs/vm-sync-hook.md) (PR [#6423](https://github.com/vatesfr/xen-orchestra/pull/6423))
- [Storage/NFS] Ability to use subdirectory when creating new NFS storage [#3919](https://github.com/vatesfr/xen-orchestra/issues/3919) (PR [#6425](https://github.com/vatesfr/xen-orchestra/pull/6425))

### Bug fixes

- [Plugin/auth-saml] Certificate input support multiline (PR [#6403](https://github.com/vatesfr/xen-orchestra/pull/6403))
- [Backup] Launch Health Check after a full backup (PR [#6401](https://github.com/vatesfr/xen-orchestra/pull/6401))
- [Backup] Fix `Lock file is already being held` error when deleting a VM backup while the VM is currently being backed up
- [Tasks] Fix the pool filter that did not display tasks even if they existed (PR [#6424](https://github.com/vatesfr/xen-orchestra/pull/6424))
- [Tasks] Fix tasks being displayed for all users (PR [#6422](https://github.com/vatesfr/xen-orchestra/pull/6422))
- [Storage/advanced] Fix the display of VDI to coalesce [#6334](https://xcp-ng.org/forum/topic/6334/coalesce-not-showing-anymore) (PR [#6429](https://github.com/vatesfr/xen-orchestra/pull/6429))
- [Backup] Ignore disabled remotes instead of failing the execution [#6347](https://github.com/vatesfr/xen-orchestra/issues/6374) (PR [#6430](https://github.com/vatesfr/xen-orchestra/pull/6430))
- [Home/VMs] Fix VMs being deleted despite clicking on Cancel in the bulk deletion modal (PR [#6435](https://github.com/vatesfr/xen-orchestra/pull/6435))

### Released packages

- vhd-lib 4.1.0
- @vates/fuse-vhd 1.0.0
- @xen-orchestra/xapi 1.5.0
- @xen-orchestra/backups 0.28.0
- @xen-orchestra/backups-cli 0.7.8
- @xen-orchestra/proxy 0.26.2
- xo-server 5.103.1
- xo-server-auth-saml 0.10.1
- xo-web 5.104.0

## **5.74.3** (2022-09-09)

### Bug fixes

- [Start VM] Clearer error message when `NO_HOSTS_AVAILABLE` error is triggered [#6316](https://github.com/vatesfr/xen-orchestra/issues/6316) (PR [#6408](https://github.com/vatesfr/xen-orchestra/pull/6408))
- [OVA Import] Fix `invalid parameters` error

### Released packages

- xo-server 5.102.3

## **5.74.2** (2022-09-06)

### Bug fixes

- [Host] Fix some missing pools and errors in SRs list when HA is used (PR [#6404](https://github.com/vatesfr/xen-orchestra/pull/6404))

### Released packages

- xo-server 5.102.1

## **5.74.1** (2022-09-03)

### Enhancements

- [Dashboard/Health] Detect broken VHD chains and display missing parent VDIs (PR [#6356](https://github.com/vatesfr/xen-orchestra/pull/6356))
- [Proxy] Ability to bind a licence to an existing proxy (PR [#6348](https://github.com/vatesfr/xen-orchestra/pull/6348))
- [Backup] Implement encryption for backup files on storage (PR [#6321](https://github.com/vatesfr/xen-orchestra/pull/6321))
- [VM/Console] Don't connect if the [console is disabled](https://support.citrix.com/article/CTX217766/how-to-disable-the-console-for-the-vm-in-xencenter) [#6319](https://github.com/vatesfr/xen-orchestra/issues/6319)

### Released packages

- @xen-orchestra/fs 3.1.0
- vhd-lib 4.0.1
- @xen-orchestra/mixins 0.8.0
- @xen-orchestra/proxy 0.26.1
- xo-server 5.102.0
- xo-web 5.103.0

## **5.74.0** (2022-08-31)

### Enhancements

- [Home/Storage] Show which SRs are used for HA state files [#6339](https://github.com/vatesfr/xen-orchestra/issues/6339) (PR [#6384](https://github.com/vatesfr/xen-orchestra/pull/6384))

### Bug fixes

- [Backup/Restore] Fix backup list not loading on page load (PR [#6364](https://github.com/vatesfr/xen-orchestra/pull/6364))
- [Host] Fix `should not contains property ["ignoreBackup"]` on some host operations (PR [#6362](https://github.com/vatesfr/xen-orchestra/pull/6362))

### Released packages

- @xen-orchestra/fs 3.0.0
- vhd-lib 4.0.0
- @xen-orchestra/backups 0.27.4
- @xen-orchestra/backups-cli 0.7.7
- @xen-orchestra/xapi 1.4.2
- xen-api 1.2.2
- @xen-orchestra/proxy 0.26.0
- vhd-cli 0.9.1
- xo-vmdk-to-vhd 2.4.3
- xo-server 5.101.0
- xo-web 5.102.0

## **5.73.1** (2022-08-04)

### Bug fixes

- [Backup] Fix `incorrect backup size in metadata` on each merged VHD (PR [#6331](https://github.com/vatesfr/xen-orchestra/pull/6331))
- [Backup] Fix `assertionError [ERR_ASSERTION]: Expected values to be strictly equal` when resuming a merge (PR [#6349](https://github.com/vatesfr/xen-orchestra/pull/6349))

### Released packages

- @xen-orchestra/backups 0.27.3
- @xen-orchestra/fs 2.1.0
- @xen-orchestra/mixins 0.7.1
- @xen-orchestra/proxy 0.25.1
- vhd-cli 0.9.0
- vhd-lib 3.3.5
- xo-server 5.100.1
- xo-server-auth-saml 0.10.0
- xo-web 5.101.1

## **5.73.0** (2022-07-29)

### Highlights

- [REST API] VDI import now also supports the raw format
- HTTPS server can acquire SSL certificate from Let's Encrypt (PR [#6320](https://github.com/vatesfr/xen-orchestra/pull/6320))

### Enhancements

- Embedded HTTP/HTTPS proxy is now enabled by default
- [VM] Display a confirmation modal when stopping/restarting a protected VM (PR [#6295](https://github.com/vatesfr/xen-orchestra/pull/6295))

### Bug fixes

- [Home/VM] Show error when deleting VMs failed (PR [#6323](https://github.com/vatesfr/xen-orchestra/pull/6323))
- [REST API] Fix broken VDI after VHD import [#6327](https://github.com/vatesfr/xen-orchestra/issues/6327) (PR [#6326](https://github.com/vatesfr/xen-orchestra/pull/6326))
- [Netbox] Fix `ipaddr: the address has neither IPv6 nor IPv4 format` error (PR [#6328](https://github.com/vatesfr/xen-orchestra/pull/6328))

### Released packages

- @vates/async-each 1.0.0
- @xen-orchestra/fs 2.0.0
- @xen-orchestra/backups 0.27.2
- @xen-orchestra/backups-cli 0.7.6
- @xen-orchestra/mixins 0.7.0
- @xen-orchestra/xapi 1.4.1
- @xen-orchestra/proxy 0.25.0
- vhd-cli 0.8.1
- vhd-lib 3.3.4
- xo-cli 0.14.1
- xo-server 5.100.0
- xo-web 5.101.0

## **5.72.1** (2022-07-11)

### Enhancements

- [SR] When SR is in maintenance, add "Maintenance mode" badge next to its name (PR [#6313](https://github.com/vatesfr/xen-orchestra/pull/6313))

### Bug fixes

- [Tasks] Fix tasks not displayed when running CR backup job [Forum#6038](https://xcp-ng.org/forum/topic/6038/not-seeing-tasks-any-more-as-admin) (PR [#6315](https://github.com/vatesfr/xen-orchestra/pull/6315))
- [Backup] Fix failing merge multiple VHDs at once (PR [#6317](https://github.com/vatesfr/xen-orchestra/pull/6317))
- [VM/Console] Fix _Connect with SSH/RDP_ when address is IPv6
- [Audit] Ignore side-effects free API methods `xoa.check`, `xoa.clearCheckCache` and `xoa.getHVSupportedVersions`

### Released packages

- @xen-orchestra/backups 0.27.0
- @xen-orchestra/backups-cli 0.7.5
- @xen-orchestra/proxy 0.23.5
- vhd-lib 3.3.2
- xo-server 5.98.1
- xo-server-audit 0.10.0
- xo-web 5.100.0

## **5.72.0** (2022-06-30)

### Highlights

- [Backup] Merge delta backups without copying data when using VHD directories on NFS/SMB/local remote(https://github.com/vatesfr/xen-orchestra/pull/6271))
- [Proxies] Ability to copy the proxy access URL (PR [#6287](https://github.com/vatesfr/xen-orchestra/pull/6287))
- [SR/Advanced] Ability to enable/disable _Maintenance Mode_ [#6215](https://github.com/vatesfr/xen-orchestra/issues/6215) (PRs [#6308](https://github.com/vatesfr/xen-orchestra/pull/6308), [#6297](https://github.com/vatesfr/xen-orchestra/pull/6297))
- [User] User tokens management through XO interface (PR [#6276](https://github.com/vatesfr/xen-orchestra/pull/6276))
- [Tasks, VM/General] Self Service users: show tasks related to their pools, hosts, SRs, networks and VMs (PR [#6217](https://github.com/vatesfr/xen-orchestra/pull/6217))

### Enhancements

- [Backup/Restore] Clearer error message when importing a VM backup requires XCP-n/CH >= 8.1 (PR [#6304](https://github.com/vatesfr/xen-orchestra/pull/6304))
- [Backup] Users can use VHD directory on any remote type (PR [#6273](https://github.com/vatesfr/xen-orchestra/pull/6273))

### Bug fixes

- [VDI Import] Fix `this._getOrWaitObject is not a function`
- [VM] Attempting to delete a protected VM should display a modal with the error and the ability to bypass it (PR [#6290](https://github.com/vatesfr/xen-orchestra/pull/6290))
- [OVA Import] Fix import stuck after first disk
- [File restore] Ignore symbolic links

### Released packages

- @vates/event-listeners-manager 1.0.1
- @vates/read-chunk 1.0.0
- @xen-orchestra/backups 0.26.0
- @xen-orchestra/backups-cli 0.7.4
- xo-remote-parser 0.9.1
- @xen-orchestra/fs 1.1.0
- @xen-orchestra/openflow 0.1.2
- @xen-orchestra/xapi 1.4.0
- @xen-orchestra/proxy 0.23.4
- @xen-orchestra/proxy-cli 0.3.1
- vhd-lib 3.3.1
- vhd-cli 0.8.0
- xo-vmdk-to-vhd 2.4.2
- xo-server 5.98.0
- xo-web 5.99.0

## **5.71.1 (2022-06-13)**

### Enhancements

- Show raw errors to administrators instead of _unknown error from the peer_ (PR [#6260](https://github.com/vatesfr/xen-orchestra/pull/6260))

### Bug fixes

- [New SR] Fix `method.startsWith is not a function` when creating an _ext_ SR
- Import VDI content now works when there is a HTTP proxy between XO and the host (PR [#6261](https://github.com/vatesfr/xen-orchestra/pull/6261))
- [Backup] Fix `undefined is not iterable (cannot read property Symbol(Symbol.iterator))` on XS 7.0.0
- [Backup] Ensure a warning is shown if a target preparation step fails (PR [#6266](https://github.com/vatesfr/xen-orchestra/pull/6266))
- [OVA Export] Avoid creating a zombie task (PR [#6267](https://github.com/vatesfr/xen-orchestra/pull/6267))
- [OVA Export] Increase speed by lowering compression to acceptable level (PR [#6267](https://github.com/vatesfr/xen-orchestra/pull/6267))
- [OVA Export] Fix broken OVAs due to special characters in VM name (PR [#6267](https://github.com/vatesfr/xen-orchestra/pull/6267))

### Released packages

- @xen-orchestra/backups 0.25.0
- @xen-orchestra/backups-cli 0.7.3
- xen-api 1.2.1
- @xen-orchestra/xapi 1.2.0
- @xen-orchestra/proxy 0.23.2
- @xen-orchestra/proxy-cli 0.3.0
- xo-cli 0.14.0
- xo-vmdk-to-vhd 2.4.1
- xo-server 5.96.0
- xo-web 5.97.2

## **5.71.0 (2022-05-31)**

### Highlights

- [Backup] _Restore Health Check_ can now be configured to be run automatically during a backup schedule (PRs [#6227](https://github.com/vatesfr/xen-orchestra/pull/6227), [#6228](https://github.com/vatesfr/xen-orchestra/pull/6228), [#6238](https://github.com/vatesfr/xen-orchestra/pull/6238) & [#6242](https://github.com/vatesfr/xen-orchestra/pull/6242))
- [Backup] VMs with USB Pass-through devices are now supported! The advanced _Offline Snapshot Mode_ setting must be enabled. For Full Backup or Disaster Recovery jobs, Rolling Snapshot needs to be enabled as well. (PR [#6239](https://github.com/vatesfr/xen-orchestra/pull/6239))
- [Backup] Implement file cache for listing the backups of a VM (PR [#6220](https://github.com/vatesfr/xen-orchestra/pull/6220))
- [RPU/Host] If some backup jobs are running on the pool, ask for confirmation before starting an RPU, shutdown/rebooting a host or restarting a host's toolstack (PR [6232](https://github.com/vatesfr/xen-orchestra/pull/6232))
- [XO Web] Add ability to configure a default filter for Storage [#6236](https://github.com/vatesfr/xen-orchestra/issues/6236) (PR [#6237](https://github.com/vatesfr/xen-orchestra/pull/6237))
- [REST API] Support VDI creation via VHD import

### Enhancements

- [Backup] Merge multiple VHDs at once which will speed up the merging phase after reducing the retention of a backup job(PR [#6184](https://github.com/vatesfr/xen-orchestra/pull/6184))
- [Backup] Add setting `backups.metadata.defaultSettings.unconditionalSnapshot` in `xo-server`'s configuration file to force a snapshot even when not required by the backup, this is useful to avoid locking the VM halted during the backup (PR [#6221](https://github.com/vatesfr/xen-orchestra/pull/6221))
- [VM migration] Ensure the VM can be migrated before performing the migration to avoid issues [#5301](https://github.com/vatesfr/xen-orchestra/issues/5301) (PR [#6245](https://github.com/vatesfr/xen-orchestra/pull/6245))
- [Backup] Show any detected errors on existing backups instead of fixing them silently (PR [#6207](https://github.com/vatesfr/xen-orchestra/pull/6225))
- Created SRs will now have auto-scan enabled similarly to what XenCenter does (PR [#6246](https://github.com/vatesfr/xen-orchestra/pull/6246))
- [RPU] Disable scheduled backup jobs during RPU (PR [#6244](https://github.com/vatesfr/xen-orchestra/pull/6244))

### Bug fixes

- [S3] Fix S3 remote with empty directory not showing anything to restore (PR [#6218](https://github.com/vatesfr/xen-orchestra/pull/6218))
- [S3] remote fom did not save the `https` and `allow unauthorized`during remote creation (PR [#6219](https://github.com/vatesfr/xen-orchestra/pull/6219))
- [VM/advanced] Fix various errors when adding ACLs [#6213](https://github.com/vatesfr/xen-orchestra/issues/6213) (PR [#6230](https://github.com/vatesfr/xen-orchestra/pull/6230))
- [Home/Self] Don't make VM's resource set name clickable for non admin users as they aren't allowed to view the Self Service page (PR [#6252](https://github.com/vatesfr/xen-orchestra/pull/6252))
- [load-balancer] Fix density mode failing to shutdown hosts (PR [#6253](https://github.com/vatesfr/xen-orchestra/pull/6253))
- [Health] Make "Too many snapshots" table sortable by number of snapshots (PR [#6255](https://github.com/vatesfr/xen-orchestra/pull/6255))
- [Remote] Show complete errors instead of only a potentially missing message (PR [#6216](https://github.com/vatesfr/xen-orchestra/pull/6216))

### Released packages

- @xen-orchestra/self-signed 0.1.3
- vhd-lib 3.2.0
- @xen-orchestra/fs 1.0.3
- vhd-cli 0.7.2
- xo-vmdk-to-vhd 2.4.0
- @xen-orchestra/upload-ova 0.1.5
- @xen-orchestra/xapi 1.1.0
- @xen-orchestra/backups 0.24.0
- @xen-orchestra/backups-cli 0.7.2
- @xen-orchestra/emit-async 1.0.0
- @xen-orchestra/mixins 0.5.0
- @xen-orchestra/proxy 0.23.1
- xo-server 5.95.0
- xo-web 5.97.1
- xo-server-backup-reports 0.17.0

## 5.70.2 (2022-05-16)

### Bug fixes

- [Pool/Patches] Fix failure to install patches on Citrix Hypervisor (PR [#6231](https://github.com/vatesfr/xen-orchestra/pull/6231))

### Released packages

- @xen-orchestra/xapi 1.0.0
- @xen-orchestra/backups 0.23.0
- @xen-orchestra/mixins 0.4.0
- @xen-orchestra/proxy 0.22.1
- xo-server 5.93.1

## 5.70.1 (2022-05-04)

### Enhancement

- [Backup] Support `[NOBAK]` VDI prefix for all backup modes [#2560](https://github.com/vatesfr/xen-orchestra/issues/2560) (PR [#6207](https://github.com/vatesfr/xen-orchestra/pull/6207))
- [VM/Host Console] Fix fallback for older versions of XCP-ng/XS (PR [#6203](https://github.com/vatesfr/xen-orchestra/pull/6203))

### Bug fixes

- [Backup Health Check] Fix guest tools detection (PR [#6214](https://github.com/vatesfr/xen-orchestra/pull/6214))

### Released packages

- @xen-orchestra/mixins 0.3.1
- @xen-orchestra/xapi 0.11.0
- @xen-orchestra/backups 0.22.0
- @xen-orchestra/proxy 0.22.0
- xo-server 5.93.0

## 5.70.0 (2022-04-29)

### Highlights

- [VM export] Feat export to `ova` format (PR [#6006](https://github.com/vatesfr/xen-orchestra/pull/6006))
- [Backup] Add _Restore Health Check_: ensure a backup is viable by doing an automatic test restore (requires guest tools in the VM) (PR [#6148](https://github.com/vatesfr/xen-orchestra/pull/6148))
- [Import] Feat import `iso` disks (PR [#6180](https://github.com/vatesfr/xen-orchestra/pull/6180))
- New HTTP/HTTPS proxy implemented in xo-proxy and xo-server, [see the documentation](https://github.com/vatesfr/xen-orchestra/blob/master/@xen-orchestra/mixins/docs/HttpProxy.md) (PR [#6201](https://github.com/vatesfr/xen-orchestra/pull/6201))
- [Backup job] Cache DNS queries (PR [#6196](https://github.com/vatesfr/xen-orchestra/pull/6196))

### Enhancements

- [VM migrate] Allow to choose a private network for VIFs network (PR [#6200](https://github.com/vatesfr/xen-orchestra/pull/6200))
- [Proxy] Disable "Deploy proxy" button for source users (PR [#6199](https://github.com/vatesfr/xen-orchestra/pull/6199))

### Bug fixes

- [VM/Host Console] Fix support of older versions of XCP-ng/XS, please not that HTTP proxies are note supported in that case (PR [#6191](https://github.com/vatesfr/xen-orchestra/pull/6191))
- Fix HTTP proxy support to connect to pools (introduced in XO 5.69.0) (PR [#6204](https://github.com/vatesfr/xen-orchestra/pull/6204))
- [Backup] Fix failure when sending a backup (Full/Delta/Metadata) to S3 with Object Lock enabled (PR [#6190](https://github.com/vatesfr/xen-orchestra/pull/6190))

### Released packages

- @vates/cached-dns.lookup 1.0.0
- @vates/event-listeners-manager 1.0.0
- xen-api 1.2.0
- @xen-orchestra/mixins 0.3.0
- xo-vmdk-to-vhd 2.3.0
- @xen-orchestra/fs 1.0.1
- @xen-orchestra/backups 0.21.1
- @xen-orchestra/proxy 0.21.0
- xo-server 5.92.0
- xo-web 5.96.0
- vhd-cli 0.7.1
- @xen-orchestra/backups-cli 0.7.1

## **5.69.2** (2022-04-13)

### Enhancements

- [Rolling Pool Update] New algorithm for XCP-ng updates (PR [#6188](https://github.com/vatesfr/xen-orchestra/pull/6188))

### Bug fixes

- [Plugins] Automatically configure plugins when a configuration file is imported (PR [#6171](https://github.com/vatesfr/xen-orchestra/pull/6171))
- [VMDK Export] Fix `VBOX_E_FILE_ERROR (0x80BB0004)` when importing in VirtualBox (PR [#6163](https://github.com/vatesfr/xen-orchestra/pull/6163))
- [Backup] Fix "Cannot read properties of undefined" error when restoring from a proxied remote (PR [#6179](https://github.com/vatesfr/xen-orchestra/pull/6179))
- [Rolling Pool Update] Fix "cannot read properties of undefined" error [#6170](https://github.com/vatesfr/xen-orchestra/issues/6170) (PR [#6186](https://github.com/vatesfr/xen-orchestra/pull/6186))

### Released packages

- xen-api 1.1.0
- xo-vmdk-to-vhd 2.2.0
- @xen-orchestra/proxy 0.20.1
- xo-server 5.90.2

## **5.69.1** (2022-03-31)

### Bug fixes

- [Backup] Fix `plan enterprise is not defined in the PLANS object` (PR [#6168](https://github.com/vatesfr/xen-orchestra/pull/6168))

### Released packages

- xo-server 5.90.2

## **5.69.0** (2022-03-31)

### Highlights

- [REST API] Expose networks, VBDs, VDIs and VIFs
- [Console] Supports host and VM consoles behind HTTP proxies [#6133](https://github.com/vatesfr/xen-orchestra/pull/6133)
- [Install patches] Disable patch installation when `High Availability` is enabled (PR [#6145](https://github.com/vatesfr/xen-orchestra/pull/6145))
- [Delta Backup/Restore] Ability to ignore some VDIs (PR [#6143](https://github.com/vatesfr/xen-orchestra/pull/6143))
- [Import VM] Ability to import a VM from a URL (PR [#6130](https://github.com/vatesfr/xen-orchestra/pull/6130))

### Enhancements

- [Rolling Pool Update] Don't update if some of the hosts are not running
- [VM form] Add link to documentation on secure boot in the Advanced tab (PR [#6146](https://github.com/vatesfr/xen-orchestra/pull/6146))
- [Install patches] Update confirmation messages for patch installation (PR [#6159](https://github.com/vatesfr/xen-orchestra/pull/6159))

### Bug fixes

- [Rolling Pool Update] Don't fail if `load-balancer` plugin is missing (Starter and Enterprise plans)
- [Backup/Restore] Fix missing backups on Backblaze
- [Templates] Fix "incorrect state" error when trying to delete a default template [#6124](https://github.com/vatesfr/xen-orchestra/issues/6124) (PR [#6119](https://github.com/vatesfr/xen-orchestra/pull/6119))
- [New SR] Fix "SR_BACKEND_FAILURE_103" error when selecting "No selected value" for the path [#5991](https://github.com/vatesfr/xen-orchestra/issues/5991) (PR [#6137](https://github.com/vatesfr/xen-orchestra/pull/6137))
- [Jobs] Fix "invalid parameters" error when running jobs in some cases (PR [#6156](https://github.com/vatesfr/xen-orchestra/pull/6156))
- [New SR] Take NFS version and options into account when creating an ISO SR
- Allow a decimal when displaying small values (e.g. show _1.4 TiB_ instead of _1 TiB_ for 1,400 GiB of RAM)

### Released packages

- xo-common 0.8.0
- @vates/decorate-with 2.0.0
- xen-api 1.0.0
- @xen-orchestra/xapi 0.10.0
- @xen-orchestra/fs 1.0.0
- vhd-cli 0.7.0
- @xen-orchestra/backups 0.21.0
- @xen-orchestra/proxy 0.20.0
- xo-server 5.90.1
- xo-web 5.95.0

## **5.68.0** (2022-02-28)

### Highlights

- [New SR] Add confirmation message before creating local SR (PR [#6121](https://github.com/vatesfr/xen-orchestra/pull/6121))
- [Dashboard/Health] List all VDIs that need coalescing (PR [#6120](https://github.com/vatesfr/xen-orchestra/pull/6120))
- [Delta Backup/Restore] Ability to choose SR for each VDI [#4605](https://github.com/vatesfr/xen-orchestra/issues/4605), [#4016](https://github.com/vatesfr/xen-orchestra/issues/4016) (PR [#6117](https://github.com/vatesfr/xen-orchestra/pull/6117))

### Enhancements

- [Menu] Show a warning icon when some SRs have more than 10 VDIs to coalesce (PR [#6120](https://github.com/vatesfr/xen-orchestra/pull/6120))

### Bug fixes

- [Self service] Change identifiers used for VM templates to avoid them from being removed on XCP-ng upgrade
- [Proxy] Always connect to XAPI via [backup network if defined](https://xen-orchestra.com/blog/xen-orchestra-5-64/#backupmigrationnetwork)
- [Backup/File restore] Do not list backups on non-compatible remotes (S3) (PR [#6116](https://github.com/vatesfr/xen-orchestra/pull/6116))

### Released packages

- xen-api 0.36.0
- @xen-orchestra/xapi 0.9.0
- @vates/predicates 1.0.0
- @xen-orchestra/mixins 0.2.0
- @xen-orchestra/backups 0.20.0
- @xen-orchestra/proxy 0.19.0
- xo-cli 0.13.0
- xo-server 5.89.0
- xo-server-audit 0.9.3
- xo-web 5.94.0

## **5.67.0** (2022-01-31)

### Highlights

- [Rolling Pool Update] Automatically pause load balancer plugin during the update [#5711](https://github.com/vatesfr/xen-orchestra/issues/5711)
- [Export/Disks] Allow the export of disks in VMDK format (PR [#5982](https://github.com/vatesfr/xen-orchestra/pull/5982))
- Limit number of concurrent VM migrations per pool to `3`. Can be changed in `xo-server`'s configuration file: `xapiOptions.vmMigrationConcurrency` [#6065](https://github.com/vatesfr/xen-orchestra/issues/6065) (PR [#6076](https://github.com/vatesfr/xen-orchestra/pull/6076))
- [Health] Display pools with no default SR (PR [#6083](https://github.com/vatesfr/xen-orchestra/pull/6083))
- [Backup] Speedup merge and cleanup speed for S3 backup by a factor 10 (PR [#6100](https://github.com/vatesfr/xen-orchestra/pull/6100))
- [Proxy] Now ships a reverse proxy (PR [#6072](https://github.com/vatesfr/xen-orchestra/pull/6072))

### Enhancements

- [Delta Backup] When using S3 remote, retry uploading VHD parts on Internal Error to support [Blackblaze](https://www.backblaze.com/b2/docs/calling.html#error_handling) [Forum#5397](https://xcp-ng.org/forum/topic/5397/delta-backups-failing-aws-s3-uploadpartcopy-cpu-too-busy/5) (PR [#6086](https://github.com/vatesfr/xen-orchestra/issues/6086))
- [Backup] Add sanity check of aliases on S3 remotes (PR [#6043](https://github.com/vatesfr/xen-orchestra/pull/6043))

### Bug fixes

- [Backup] Detect and clear orphan merge states, fix `ENOENT` errors (PR [#6087](https://github.com/vatesfr/xen-orchestra/pull/6087))
- [Backup] Ensure merges are also executed after backup on S3, maintaining the size of the VHD chain under control [Forum#45743](https://xcp-ng.org/forum/post/45743) (PR [#6095](https://github.com/vatesfr/xen-orchestra/pull/6095))
- [Backup] Delete backups immediately instead of waiting for the next backup (PR [#6081](https://github.com/vatesfr/xen-orchestra/pull/6081))
- [Backup] Delete S3 backups completely, even if there are more than 1000 files (PR [#6103](https://github.com/vatesfr/xen-orchestra/pull/6103))
- [Backup] Fix merge resuming (PR [#6099](https://github.com/vatesfr/xen-orchestra/pull/6099))
- [Plugin/Audit] Fix `key cannot be 'null' or 'undefined'` error when no audit log in the database [#6040](https://github.com/vatesfr/xen-orchestra/issues/6040) (PR [#6071](https://github.com/vatesfr/xen-orchestra/pull/6071))
- [Backup] Fix backing up restored VMs
- [Audit Log] Don't log `proxy.getApplianceUpdaterState` API calls
- [Audit Log] Fix long data loading when displaying logs (PR [#6113](https://github.com/vatesfr/xen-orchestra/pull/6113))

### Released packages

- @xen-orchestra/fs 0.20.0
- vhd-lib 3.1.0
- @xen-orchestra/backups 0.19.0
- @xen-orchestra/backups-cli 0.7.0
- xo-vmdk-to-vhd 2.1.0
- @xen-orchestra/proxy 0.18.0
- xo-server-audit 0.9.2
- xo-server 5.87.0
- xo-web 5.92.0

## **5.66.2** (2022-01-05)

### Bug fixes

- [Import/Disk] Fix `JSON.parse` and `createReadableSparseStream is not a function` errors [#6068](https://github.com/vatesfr/xen-orchestra/issues/6068)
- [Backup] Fix delta backup are almost always full backup instead of differentials [Forum#5256](https://xcp-ng.org/forum/topic/5256/s3-backup-try-it/69) [Forum#5371](https://xcp-ng.org/forum/topic/5371/delta-backup-changes-in-5-66) (PR [#6075](https://github.com/vatesfr/xen-orchestra/pull/6075))

### Released packages

- vhd-lib 3.0.0
- xo-vmdk-to-vhd 2.0.3
- @xen-orchestra/backups 0.18.3
- @xen-orchestra/proxy 0.17.3
- xo-server 5.86.3
- xo-web 5.91.2

## **5.66.1** (2021-12-23)

### Bug fixes

- [Dashboard/Health] Fix `error has occurred` when a pool has no default SR
- [Delta Backup] Fix unnecessary full backup when not using S3 [Forum#5371](https://xcp-ng.org/forum/topic/5371/delta-backup-changes-in-5-66) (PR [#6070](https://github.com/vatesfr/xen-orchestra/pull/6070))
- [Backup] Fix incorrect warnings `incorrect size [...] instead of undefined`

### Released packages

- @xen-orchestra/backups 0.18.2
- @xen-orchestra/proxy 0.17.2
- xo-server 5.86.2
- xo-web 5.91.1

## **5.66.0** (2021-12-21)

### Enhancements

- [About] Show commit instead of version numbers for source users (PR [#6045](https://github.com/vatesfr/xen-orchestra/pull/6045))
- [Health] Display default SRs that aren't shared [#5871](https://github.com/vatesfr/xen-orchestra/issues/5871) (PR [#6033](https://github.com/vatesfr/xen-orchestra/pull/6033))
- [Pool,VM/advanced] Ability to change the suspend SR [#4163](https://github.com/vatesfr/xen-orchestra/issues/4163) (PR [#6044](https://github.com/vatesfr/xen-orchestra/pull/6044))
- [Home/VMs/Backup filter] Filter out VMs in disabled backup jobs (PR [#6037](https://github.com/vatesfr/xen-orchestra/pull/6037))
- [Rolling Pool Update] Automatically disable High Availability during the update [#5711](https://github.com/vatesfr/xen-orchestra/issues/5711) (PR [#6057](https://github.com/vatesfr/xen-orchestra/pull/6057))
- [Delta Backup on S3] Compress blocks by default ([Brotli](https://en.wikipedia.org/wiki/Brotli)) which reduces remote usage and increase backup speed (PR [#5932](https://github.com/vatesfr/xen-orchestra/pull/5932))

### Bug fixes

- [Tables/actions] Fix collapsed actions being clickable despite being disabled (PR [#6023](https://github.com/vatesfr/xen-orchestra/pull/6023))
- [Backup] Remove incorrect size warning following a merge [Forum#5727](https://xcp-ng.org/forum/topic/4769/warnings-showing-in-system-logs-following-each-backup-job/4) (PR [#6010](https://github.com/vatesfr/xen-orchestra/pull/6010))
- [Delta Backup] Preserve UEFI boot parameters [#6054](https://github.com/vatesfr/xen-orchestra/issues/6054) [Forum#5319](https://xcp-ng.org/forum/topic/5319/bug-uefi-boot-parameters-not-preserved-with-delta-backups)

### Released packages

- @xen-orchestra/mixins 0.1.2
- @xen-orchestra/xapi 0.8.5
- vhd-lib 2.1.0
- xo-vmdk-to-vhd 2.0.2
- @xen-orchestra/backups 0.18.1
- @xen-orchestra/proxy 0.17.1
- xo-server 5.86.1
- xo-web 5.91.0

## **5.65.3** (2021-12-20)

### Bug fixes

- [Continuous Replication] Fix `could not find the base VM`
- [Backup/Smart mode] Always ignore replicated VMs created by the current job
- [Backup] Fix `Unexpected end of JSON input` during merge step
- [Backup] Fix stuck jobs when using S3 remotes (PR [#6067](https://github.com/vatesfr/xen-orchestra/pull/6067))

### Released packages

- @xen-orchestra/fs 0.19.3
- vhd-lib 2.0.4
- @xen-orchestra/backups 0.17.1
- xo-server 5.85.1

## **5.65.2** (2021-12-10)

### Bug fixes

- [Backup] Fix `handler.rmTree` is not a function [Forum#5256](https://xcp-ng.org/forum/topic/5256/s3-backup-try-it/29) (PR [#6041](https://github.com/vatesfr/xen-orchestra/pull/6041))
- [Backup] Fix `EEXIST` in logs when multiple merge tasks are created at the same time [Forum#5301](https://xcp-ng.org/forum/topic/5301/warnings-errors-in-journalctl)
- [Backup] Fix missing backup on restore [Forum#5256](https://xcp-ng.org/forum/topic/5256/s3-backup-try-it/29) (PR [#6048](https://github.com/vatesfr/xen-orchestra/pull/6048))

### Released packages

- @xen-orchestra/fs 0.19.2
- vhd-lib 2.0.3
- @xen-orchestra/backups 0.16.2
- xo-server 5.84.3
- @xen-orchestra/proxy 0.15.5

## **5.65.1** (2021-12-03)

### Bug fixes

- [Delta Backup Restoration] Fix assertion error [Forum#5257](https://xcp-ng.org/forum/topic/5257/problems-building-from-source/16)
- [Delta Backup Restoration] `TypeError: this disposable has already been disposed` [Forum#5257](https://xcp-ng.org/forum/topic/5257/problems-building-from-source/20)
- [Backups] Fix: `Error: Chaining alias is forbidden xo-vm-backups/..alias.vhd to xo-vm-backups/....alias.vhd` when backing up a file to s3 [Forum#5226](https://xcp-ng.org/forum/topic/5256/s3-backup-try-it)
- [Delta Backup Restoration] `VDI_IO_ERROR(Device I/O errors)` [Forum#5727](https://xcp-ng.org/forum/topic/5257/problems-building-from-source/4) (PR [#6031](https://github.com/vatesfr/xen-orchestra/pull/6031))
- [Delta Backup] Fix `Cannot read property 'uuid' of undefined` when a VDI has been removed from a backed up VM (PR [#6034](https://github.com/vatesfr/xen-orchestra/pull/6034))

### Released packages

- @vates/compose 2.1.0
- vhd-lib 2.0.2
- xo-vmdk-to-vhd 2.0.1
- @xen-orchestra/backups 0.16.1
- @xen-orchestra/proxy 0.15.4
- xo-server 5.84.2

## **5.65.0** (2021-11-30)

### Highlights

- [VM] Ability to export a snapshot's memory (PR [#6015](https://github.com/vatesfr/xen-orchestra/pull/6015))
- [Cloud config] Ability to create a network cloud config template and reuse it in the VM creation [#5931](https://github.com/vatesfr/xen-orchestra/issues/5931) (PR [#5979](https://github.com/vatesfr/xen-orchestra/pull/5979))
- [Backup/logs] identify XAPI errors (PR [#6001](https://github.com/vatesfr/xen-orchestra/pull/6001))
- [lite] Highlight selected VM (PR [#5939](https://github.com/vatesfr/xen-orchestra/pull/5939))

### Enhancements

- [S3] Ability to authorize self-signed certificates for S3 remote (PR [#5961](https://github.com/vatesfr/xen-orchestra/pull/5961))

### Bug fixes

- [Import/VM] Fix the import of OVA files (PR [#5976](https://github.com/vatesfr/xen-orchestra/pull/5976))

### Released packages

- @vates/async-each 0.1.0
- xo-remote-parser 0.8.4
- @xen-orchestra/fs 0.19.0
- @xen-orchestra/xapi patch
- vhd-lib 2.0.1
- @xen-orchestra/backups 0.16.0
- xo-lib 0.11.1
- @xen-orchestra/proxy 0.15.3
- xo-server 5.84.1
- vhd-cli 0.6.0
- xo-web 5.90.0

## **5.64.0** (2021-10-29)

## Highlights

- [Netbox] Support older versions of Netbox and prevent "active is not a valid choice" error [#5898](https://github.com/vatesfr/xen-orchestra/issues/5898) (PR [#5946](https://github.com/vatesfr/xen-orchestra/pull/5946))
- [Tasks] Filter out short tasks using a default filter (PR [#5921](https://github.com/vatesfr/xen-orchestra/pull/5921))
- [Host] Handle evacuation failure during host shutdown (PR [#5966](https://github.com/vatesfr/xen-orchestra/pull/#5966))
- [Menu] Notify user when proxies need to be upgraded (PR [#5930](https://github.com/vatesfr/xen-orchestra/pull/5930))
- [Servers] Ability to use an HTTP proxy between XO and a server (PR [#5958](https://github.com/vatesfr/xen-orchestra/pull/5958))
- [VM/export] Ability to copy the export URL (PR [#5948](https://github.com/vatesfr/xen-orchestra/pull/5948))
- [Pool/advanced] Ability to define network for importing/exporting VMs/VDIs (PR [#5957](https://github.com/vatesfr/xen-orchestra/pull/5957))
- [Host/advanced] Add button to enable/disable the host (PR [#5952](https://github.com/vatesfr/xen-orchestra/pull/5952))
- [Backups] Enable merge worker by default

### Enhancements

- [Jobs] Ability to copy a job ID (PR [#5951](https://github.com/vatesfr/xen-orchestra/pull/5951))

### Bug fixes

- [Backups] Delete unused snapshots related to other schedules (even no longer existing) (PR [#5949](https://github.com/vatesfr/xen-orchestra/pull/5949))
- [Jobs] Fix `job.runSequence` method (PR [#5944](https://github.com/vatesfr/xen-orchestra/pull/5944))
- [Netbox] Fix error when testing plugin on versions older than 2.10 (PR [#5963](https://github.com/vatesfr/xen-orchestra/pull/5963))
- [Snapshot] Fix "Create VM from snapshot" creating a template instead of a VM (PR [#5955](https://github.com/vatesfr/xen-orchestra/pull/5955))
- [Host/Logs] Improve the display of log content (PR [#5943](https://github.com/vatesfr/xen-orchestra/pull/5943))
- [XOA licenses] Fix expiration date displaying "Invalid date" in some rare cases (PR [#5967](https://github.com/vatesfr/xen-orchestra/pull/5967))
- [API/pool.listPoolsMatchingCriteria] Fix `checkSrName`/`checkPoolName` `is not a function` error

### Released packages

- xo-server-netbox 0.3.3
- vhd-lib 1.3.0
- xen-api 0.35.1
- @xen-orchestra/xapi 0.8.0
- @xen-orchestra/backups 0.15.1
- @xen-orchestra/proxy 0.15.2
- vhd-cli 0.5.0
- xapi-explore-sr 0.4.0
- xo-server 5.83.0
- xo-web 5.89.0

## **5.63.0** (2021-09-30)

### Highlights

- [Backup] Go back to previous page instead of going to the overview after editing a job: keeps current filters and page (PR [#5913](https://github.com/vatesfr/xen-orchestra/pull/5913))
- [Health] Do not take into consideration duplicated MAC addresses from CR VMs (PR [#5916](https://github.com/vatesfr/xen-orchestra/pull/5916))
- [Health] Ability to filter duplicated MAC addresses by running VMs (PR [#5917](https://github.com/vatesfr/xen-orchestra/pull/5917))
- [Tables] Move the search bar and pagination to the top of the table (PR [#5914](https://github.com/vatesfr/xen-orchestra/pull/5914))
- [Netbox] Handle nested prefixes by always assigning an IP to the smallest prefix it matches (PR [#5908](https://github.com/vatesfr/xen-orchestra/pull/5908))

### Bug fixes

- [SSH keys] Allow SSH key to be broken anywhere to avoid breaking page formatting (Thanks [@tstivers1990](https://github.com/tstivers1990)!) [#5891](https://github.com/vatesfr/xen-orchestra/issues/5891) (PR [#5892](https://github.com/vatesfr/xen-orchestra/pull/5892))
- [Netbox] Better handling and error messages when encountering issues due to UUID custom field not being configured correctly [#5905](https://github.com/vatesfr/xen-orchestra/issues/5905) [#5806](https://github.com/vatesfr/xen-orchestra/issues/5806) [#5834](https://github.com/vatesfr/xen-orchestra/issues/5834) (PR [#5909](https://github.com/vatesfr/xen-orchestra/pull/5909))
- [New VM] Don't send network config if untouched as all commented config can make Cloud-init fail [#5918](https://github.com/vatesfr/xen-orchestra/issues/5918) (PR [#5923](https://github.com/vatesfr/xen-orchestra/pull/5923))

### Released packages

- xen-api 0.34.3
- vhd-lib 1.2.0
- xo-server-netbox 0.3.1
- @xen-orchestra/proxy 0.14.7
- xo-server 5.82.3
- xo-web 5.88.0

## **5.62.1** (2021-09-17)

### Bug fixes

- [VM/Advanced] Fix conversion from UEFI to BIOS boot firmware (PR [#5895](https://github.com/vatesfr/xen-orchestra/pull/5895))
- [VM/network] Support newline-delimited IP addresses reported by some guest tools
- Fix VM/host stats, VM creation with Cloud-init, and VM backups, with NATted hosts [#5896](https://github.com/vatesfr/xen-orchestra/issues/5896)
- [VM/import] Very small VMDK and OVA files were mangled upon import (PR [#5903](https://github.com/vatesfr/xen-orchestra/pull/5903))

### Released packages

- xen-api 0.34.2
- @xen-orchestra/proxy 0.14.6
- xo-server 5.82.2

## **5.62.0** (2021-08-31)

### Highlights

- [Host] Add warning in case of unmaintained host version [#5840](https://github.com/vatesfr/xen-orchestra/issues/5840) (PR [#5847](https://github.com/vatesfr/xen-orchestra/pull/5847))
- [Backup] Use default migration network if set when importing/exporting VMs/VDIs (PR [#5883](https://github.com/vatesfr/xen-orchestra/pull/5883))

### Enhancements

- [New network] Ability for pool's admin to create a new network within the pool (PR [#5873](https://github.com/vatesfr/xen-orchestra/pull/5873))
- [Netbox] Synchronize primary IPv4 and IPv6 addresses [#5633](https://github.com/vatesfr/xen-orchestra/issues/5633) (PR [#5879](https://github.com/vatesfr/xen-orchestra/pull/5879))

### Bug fixes

- [VM/network] Fix an issue where multiple IPs would be displayed in the same tag when using old Xen tools. This also fixes Netbox's IP synchronization for the affected VMs. (PR [#5860](https://github.com/vatesfr/xen-orchestra/pull/5860))
- [LDAP] Handle groups with no members (PR [#5862](https://github.com/vatesfr/xen-orchestra/pull/5862))
- Fix empty button on small size screen (PR [#5874](https://github.com/vatesfr/xen-orchestra/pull/5874))
- [Host] Fix `Cannot read property 'other_config' of undefined` error when enabling maintenance mode (PR [#5875](https://github.com/vatesfr/xen-orchestra/pull/5875))

### Released packages

- xen-api 0.34.1
- @xen-orchestra/xapi 0.7.0
- @xen-orchestra/backups 0.13.0
- @xen-orchestra/fs 0.18.0
- @xen-orchestra/log 0.3.0
- @xen-orchestra/mixins 0.1.1
- xo-server-auth-ldap 0.10.4
- xo-server-netbox 0.3.0
- xo-server 5.82.1
- xo-web 5.87.0

## **5.61.0** (2021-07-30)

### Highlights

- [SR/disks] Display base copies' active VDIs (PR [#5826](https://github.com/vatesfr/xen-orchestra/pull/5826))
- [Netbox] Optionally allow self-signed certificates (PR [#5850](https://github.com/vatesfr/xen-orchestra/pull/5850))
- [Host] When supported, use pool's default migration network to evacuate host [#5802](https://github.com/vatesfr/xen-orchestra/issues/5802) (PR [#5851](https://github.com/vatesfr/xen-orchestra/pull/5851))
- [VM] shutdown/reboot: offer to force shutdown/reboot the VM if no Xen tools were detected [#5838](https://github.com/vatesfr/xen-orchestra/issues/5838) (PR [#5855](https://github.com/vatesfr/xen-orchestra/pull/5855))

### Enhancements

- [Netbox] Add information about a failed request to the error log to help better understand what happened [#5834](https://github.com/vatesfr/xen-orchestra/issues/5834) (PR [#5842](https://github.com/vatesfr/xen-orchestra/pull/5842))
- [VM/console] Ability to rescan ISO SRs (PR [#5841](https://github.com/vatesfr/xen-orchestra/pull/5841))

### Bug fixes

- [VM/disks] Fix `an error has occurred` when self service user was on VM disk view (PR [#5841](https://github.com/vatesfr/xen-orchestra/pull/5841))
- [Backup] Protect replicated VMs from being started on specific hosts (PR [#5852](https://github.com/vatesfr/xen-orchestra/pull/5852))

### Released packages

- @xen-orchestra/backups 0.12.2
- @xen-orchestra/proxy 0.14.4
- xo-server-netbox 0.2.0
- xo-web 5.86.0
- xo-server 5.81.2

## **5.60.0** (2021-06-30)

### Highlights

- [VM/disks] Ability to rescan ISO SRs (PR [#5814](https://github.com/vatesfr/xen-orchestra/pull/5814))
- [VM/snapshots] Identify VM's current snapshot with an icon next to the snapshot's name (PR [#5824](https://github.com/vatesfr/xen-orchestra/pull/5824))

### Enhancements

- [OVA import] improve OVA import error reporting (PR [#5797](https://github.com/vatesfr/xen-orchestra/pull/5797))
- [Backup] Distinguish error messages between cancelation and interrupted HTTP connection
- [Jobs] Add `host.emergencyShutdownHost` to the list of methods that jobs can call (PR [#5818](https://github.com/vatesfr/xen-orchestra/pull/5818))
- [Host/Load-balancer] Log VM and host names when a VM is migrated + category (density, performance, ...) (PR [#5808](https://github.com/vatesfr/xen-orchestra/pull/5808))
- [VM/new disk] Auto-fill disk name input with generated unique name (PR [#5828](https://github.com/vatesfr/xen-orchestra/pull/5828))

### Bug fixes

- [IPs] Handle space-delimited IP address format provided by outdated guest tools [5801](https://github.com/vatesfr/xen-orchestra/issues/5801) (PR [5805](https://github.com/vatesfr/xen-orchestra/pull/5805))
- [API/pool.listPoolsMatchingCriteria] fix `unknown error from the peer` error (PR [5807](https://github.com/vatesfr/xen-orchestra/pull/5807))
- [Backup] Limit number of connections to hosts, which should reduce the occurrences of `ECONNRESET`
- [Plugins/perf-alert] All mode: only selects running hosts and VMs (PR [5811](https://github.com/vatesfr/xen-orchestra/pull/5811))
- [New VM] Fix summary section always showing "0 B" for RAM (PR [#5817](https://github.com/vatesfr/xen-orchestra/pull/5817))
- [Backup/Restore] Fix _start VM after restore_ [5820](https://github.com/vatesfr/xen-orchestra/issues/5820)
- [Netbox] Fix a bug where some devices' IPs would get deleted from Netbox (PR [#5821](https://github.com/vatesfr/xen-orchestra/pull/5821))
- [Netbox] Fix an issue where some IPv6 would be deleted just to be immediately created again (PR [#5822](https://github.com/vatesfr/xen-orchestra/pull/5822))

### Released packages

- @vates/decorate-with 0.1.0
- xen-api 0.33.1
- @xen-orchestra/xapi 0.6.4
- @xen-orchestra/backups 0.12.0
- @xen-orchestra/proxy 0.14.3
- vhd-lib 1.1.0
- vhd-cli 0.4.0
- xo-server-netbox 0.1.2
- xo-server-perf-alert 0.3.2
- xo-server-load-balancer 0.7.0
- xo-server 5.80.0
- xo-web 5.84.0

## **5.59.0** (2021-05-31)

### Highlights

- [Smart backup] Report missing pools [#2844](https://github.com/vatesfr/xen-orchestra/issues/2844) (PR [#5768](https://github.com/vatesfr/xen-orchestra/pull/5768))
- [Metadata Backup] Add a warning on restoring a metadata backup (PR [#5769](https://github.com/vatesfr/xen-orchestra/pull/5769))
- [Netbox][plugin](https://docs.xen-orchestra.com/advanced#netbox) to synchronize pools, VMs and IPs with [Netbox](https://netbox.readthedocs.io/en/stable/) (PR [#5783](https://github.com/vatesfr/xen-orchestra/pull/5783))

### Enhancements

- [SAML] Compatible with users created with other authentication providers (PR [#5781](https://github.com/vatesfr/xen-orchestra/pull/5781))

### Bug fixes

- [SDN Controller] Private network creation failure when the tunnels were created on different devices [Forum#4620](https://xcp-ng.org/forum/topic/4620/no-pif-found-in-center) (PR [#5793](https://github.com/vatesfr/xen-orchestra/pull/5793))

### Released packages

- @xen-orchestra/emit-async 0.1.0
- @xen-orchestra/defined 0.0.1
- xo-collection 0.5.0
- @xen-orchestra/log 0.2.1
- xen-api 0.33.0
- @xen-orchestra/xapi 0.6.3
- xo-server-auth-saml 0.9.0
- xo-server-backup-reports 0.16.10
- xo-server-netbox 0.1.1
- xo-server-sdn-controller 1.0.5
- xo-web 5.82.0
- xo-server 5.79.5

## **5.58.1** (2021-05-06)

### Bug fixes

- [Backups] Better handling of errors in remotes, fix `task has already ended`
- [Metadata Backup] Fix `Cannot read property 'constructor' of null` when editing job [Forum post](https://xcp-ng.org/forum/topic/4556/can-t-edit-xo-metatata-backup-config)

### Released packages

- @xen-orchestra/fs 0.17.0
- @xen-orchestra/backups 0.11.0
- xo-server 5.79.3

## **5.58.0** (2021-04-30)

### Enhancements

- [VM] Don't make a VM use [DMC](https://docs.citrix.com/en-us/xencenter/7-1/dmc-about.html) on creation by default [#5729](https://github.com/vatesfr/xen-orchestra/issues/5729)
- [NFS remotes] Don't force version 3 by default (PR [#5725](https://github.com/vatesfr/xen-orchestra/pull/5725))
- [Template] Ability to create a template from a snapshot [#4891](https://github.com/vatesfr/xen-orchestra/issues/4891) (PR [#5736](https://github.com/vatesfr/xen-orchestra/pull/5736))
- [PIF] Automatically reconfigure management PIF on host case of IP address change to avoid connection loss [#5730](https://github.com/vatesfr/xen-orchestra/issues/5730) (PR [#5745](https://github.com/vatesfr/xen-orchestra/pull/5745))
- [Backup] Lock VM directory during backup to avoid race conditions (PR [#5746](https://github.com/vatesfr/xen-orchestra/pull/5746))
- [XOA] Notify user when proxies need to be upgraded (PR [#5717](https://github.com/vatesfr/xen-orchestra/pull/5717))
- [Host/network] Identify the management network [#5731](https://github.com/vatesfr/xen-orchestra/issues/5731) (PR [#5743](https://github.com/vatesfr/xen-orchestra/pull/5743))
- [Backup/S3] Support for HTTP protocol and choice of region (PR [#5658](https://github.com/vatesfr/xen-orchestra/pull/5658))
- [Host/Load-balancer] Improve migration (perf mode) regarding memory and cpu usage (PR [#5734](https://github.com/vatesfr/xen-orchestra/pull/5734))
- [API/pool] Add listPoolsMatchingCriteria method that lists the pools matching certain criteria (PR [#5715](https://github.com/vatesfr/xen-orchestra/pull/5715))

### Bug fixes

- [Backup] Don't unnecessarily snapshot the VM when using _offline backup_ (PR [#5739](https://github.com/vatesfr/xen-orchestra/pull/5739))
- [Backup] Fix `ENOENT` error on deleting an existing VM backup (PR [#5744](https://github.com/vatesfr/xen-orchestra/pull/5744))
- [Host/Load-balancer] Fix error(s) that prevents the load balancer from running (PR [#5734](https://github.com/vatesfr/xen-orchestra/pull/5734))
- [Plugins/perf-alert] Fix impossibility to configure when not using smart mode (PR [#5755](https://github.com/vatesfr/xen-orchestra/pull/5755))
- [S3 Remotes] Fix `Not implemented` errors

### Dropped features

- [Backup] Remove legacy backup support (PR [#5718](https://github.com/vatesfr/xen-orchestra/pull/5718))

### Released packages

- xo-server-perf-alert 0.3.1
- xo-remote-parser 0.7.0
- @xen-orchestra/fs 0.16.1
- @xen-orchestra/xapi 0.6.2
- @xen-orchestra/backups 0.10.1
- @xen-orchestra/backups-cli 0.5.1
- @xen-orchestra/mixins 0.1.0
- xen-api 0.31.1
- xo-server-load-balancer 0.6.0
- xo-server 5.79.2
- xo-web 5.81.0

## **5.57.1** (2021-04-13)

### Enhancements

- [Host/Load-balancer] Add option to disable migration (PR [#5706](https://github.com/vatesfr/xen-orchestra/pull/5706))
- [VM] Don't switch a VM to use [DMC](https://docs.citrix.com/en-us/xencenter/7-1/dmc-about.html) when changing the memory [#4983](https://github.com/vatesfr/xen-orchestra/issues/4983)

### Bug fixes

- [Backup restore] Generate new MAC addresses is disabled by default (PR [#5707](https://github.com/vatesfr/xen-orchestra/pull/5707))
- [Backup] Fix `vm.refresh_snapshots is not a function` error
- [Backup] Fix `cannot read property "length" of undefined` when using _delete first_ [Forum post](https://xcp-ng.org/forum/topic/4440/error-on-delta-backup-cannot-read-property-length-of-undefined)
- [Delta backup] Fix merge task not under corresponding remote and missing merge size in summary [#5708](https://github.com/vatesfr/xen-orchestra/issues/5708)
- [Delta backup restore] Fix incorrect reported size (and speed)
- [Settings/Logs] Correctly hide `pool.listMissingPatches` and `host.stats` errors
- [Plugins] Fix `strict mode: unknown keyword` when configuring some plugins
- Fix `Cannot destructure property 'bypassMacAddressesCheck' of 'undefined'` error which happens on various actions deploying a proxy
- [Proxies] Fix _Force upgrade_ `expect the result to be iterator` error

### Released packages

- @xen-orchestra/xapi 0.6.1
- @xen-orchestra/backups 0.9.3
- xo-server-load-balancer 0.5.0
- xo-server 5.78.4
- xo-web 5.80.1

## **5.57.0** (2021-04-01)

### Highlights

- [Backup] Run backup jobs on different system processes (PR [#5660](https://github.com/vatesfr/xen-orchestra/pull/5660))
- [Home/VM, VM] Start: show confirmation modal when the VMs contain duplicate MAC addresses or have the same MAC addresses as other running VMs [#5601](https://github.com/vatesfr/xen-orchestra/issues/5601) (PR [#5655](https://github.com/vatesfr/xen-orchestra/pull/5655))
- [Host/Load-balancer] Add a new anti-affinity mode (PR [#5652](https://github.com/vatesfr/xen-orchestra/pull/5652))

### Enhancements

- [VM] Display the full driver version in the general and advanced tab instead of `major.minor` [#5680](https://github.com/vatesfr/xen-orchestra/issues/5680) (PR [#5691](https://github.com/vatesfr/xen-orchestra/pull/5691))
- [Usage report] Add VM IP addresses to the report (PR [#5696](https://github.com/vatesfr/xen-orchestra/pull/5696))
- [Plugins/perf-alert] Ability to choose all hosts, VMs and SRs [#2987](https://github.com/vatesfr/xen-orchestra/issues/2987) (PR [#5692](https://github.com/vatesfr/xen-orchestra/pull/5692))
- [Backup restore] Ability to generate new MAC addresses (PR [#5697](https://github.com/vatesfr/xen-orchestra/pull/5697))

### Bug fixes

- [Proxy] _Force upgrade_ no longer fails on broken proxy
- [Proxy] _Redeploy_ now works when the bound VM is missing
- [VM template] Fix confirmation modal doesn't appear on deleting a default template (PR [#5644](https://github.com/vatesfr/xen-orchestra/pull/5644))
- [OVA VM Import] Fix imported VMs all having the same MAC addresses
- [Disk import] Fix `an error has occurred` when importing wrong format or corrupted files [#5663](https://github.com/vatesfr/xen-orchestra/issues/5663) (PR [#5683](https://github.com/vatesfr/xen-orchestra/pull/5683))

### Released packages

- xo-server-load-balancer 0.4.0
- xo-server-perf-alert 0.3.0
- xo-server-usage-report 0.10.0
- xo-server-backup-reports 0.16.9
- @vates/disposable 0.1.1
- xo-server-transport-email 0.6.0
- @xen-orchestra/fs 0.14.0
- @xen-orchestra/xapi 0.6.0
- @xen-orchestra/backups 0.9.1
- @xen-orchestra/backups-cli 0.5.0
- xo-server 5.78.2
- xo-web 5.80.0

## **5.56.2** (2021-03-22)

### Bug fixes

- [Pool] Fix `an error has occurred` when using the "Disconnect" button from the pool page [#5669](https://github.com/vatesfr/xen-orchestra/issues/5669) (PR [#5671](https://github.com/vatesfr/xen-orchestra/pull/5671))
- [Configuration] Automatically connect enabled servers after import [#5660](https://github.com/vatesfr/xen-orchestra/issues/5660) (PR [#5672](https://github.com/vatesfr/xen-orchestra/pull/5672))
- Work-around some `ECONNRESET` errors when connecting to XEN-API (PR [#5674](https://github.com/vatesfr/xen-orchestra/pull/5674))
- [Backup] Retry automatically on `resource temporarily unavailable` error (PR [#5612](https://github.com/vatesfr/xen-orchestra/pull/5612))
- [Backup Restore] Don't break in case of malformed logs
- [Backup Restore] Fix `MESSAGE_METHOD_UNKNOWN(VM.set_bios_strings)` with XenServer < 7.3

### Released packages

- xo-common 0.7.0
- xen-api 0.31.0
- @xen-orchestra/xapi 0.4.5
- @xen-orchestra/fs 0.13.1
- @xen-orchestra/backups 0.7.1
- xo-server 5.77.1
- xo-web 5.79.1

## **5.56.1** (2021-03-10)

### Enhancements

- [VIF] To edit MAC address on a VIF, user has to be operator of the VIF and administrator of its network [#4700](https://github.com/vatesfr/xen-orchestra/issues/4700) (PR [#5631](https://github.com/vatesfr/xen-orchestra/pull/5631))
- [Backup/CR] Ability to set a specific schedule to always run full backups [#5541](https://github.com/vatesfr/xen-orchestra/issues/5541) (PR [#5648](https://github.com/vatesfr/xen-orchestra/pull/5648))

### Bug fixes

- [Editable number] When you are trying to edit a number and it's failing, display an error (PR [#5634](https://github.com/vatesfr/xen-orchestra/pull/5634))
- [VM/Network] Fix `an error has occurred` when trying to sort the table by the network's name (PR [#5639](https://github.com/vatesfr/xen-orchestra/pull/5639))
- [Backup] Try harder to avoid orphan VDI snapshots, especially with iSCSI SRs [#4926](https://github.com/vatesfr/xen-orchestra/issues/4926)
- [Backup] Disabled or unavailable remotes and SRs don't prevent job from running [#5353](https://github.com/vatesfr/xen-orchestra/issues/5353) (PR [#5651](https://github.com/vatesfr/xen-orchestra/pull/5651))

### Released packages

- xen-api 0.30.0
- @xen-orchestra/xapi 0.4.4
- @xen-orchestra/backups 0.7.0
- xo-server 5.77.0
- xo-web 5.79.0

## **5.56.0** (2021-02-26)

### Highlights

- [Task] Display age and estimated duration (PR [#5530](https://github.com/vatesfr/xen-orchestra/pull/5530))
- [Backup] Ability to set a specific schedule to always run full backups [#5541](https://github.com/vatesfr/xen-orchestra/issues/5541) (PR [#5546](https://github.com/vatesfr/xen-orchestra/pull/5546))
- [XOA] Add warning message in the menu if "XOA check" reports any problems (PR [#5534](https://github.com/vatesfr/xen-orchestra/pull/5534))

### Enhancements

- [Proxy] Ask for a confirmation before upgrading a proxy with running backups (PR [#5533](https://github.com/vatesfr/xen-orchestra/pull/5533))
- [Backup/restore] Allow backup restore to any licence even if XOA isn't registered (PR [#5547](https://github.com/vatesfr/xen-orchestra/pull/5547))
- [Import] Ignore case when detecting file type (PR [#5574](https://github.com/vatesfr/xen-orchestra/pull/5574))
- [Proxy] Log VM backup restoration (PR [#5576](https://github.com/vatesfr/xen-orchestra/pull/5576))
- [Backup] During CR/delta backups, bios_strings are restored similarly to DR/full backups

### Bug fixes

- [VM/Snapshot export] Fix `Error: no available place in queue` on canceling an export via browser then starting a new one when the concurrency threshold is reached [#5535](https://github.com/vatesfr/xen-orchestra/issues/5535) (PR [#5538](https://github.com/vatesfr/xen-orchestra/pull/5538))
- [Servers] Hide pool's objects if its master is unreachable [#5475](https://github.com/vatesfr/xen-orchestra/issues/5475) (PR [#5526](https://github.com/vatesfr/xen-orchestra/pull/5526))
- [Host] Restart toolstack: fix `ECONNREFUSED` error (PR [#5553](https://github.com/vatesfr/xen-orchestra/pull/5553))
- [VM migration] Intra-pool: don't automatically select migration network if no default migration network is defined on the pool (PR [#5564](https://github.com/vatesfr/xen-orchestra/pull/5564))
- [New SR] Fix `lun.LUNid.trim is not a function` error [#5497](https://github.com/vatesfr/xen-orchestra/issues/5497) (PR [#5581](https://github.com/vatesfr/xen-orchestra/pull/5581))
- [Home/vm] Bulk intra pool migration: fix VM VDIs on a shared SR wrongly migrated to the default SR (PR [#3987](https://github.com/vatesfr/xen-orchestra/pull/3987))
- [Select] Display the option on multiple lines if needed (PR [#5580](https://github.com/vatesfr/xen-orchestra/pull/5580))
- [VM/advanced] Fix `an error has occurred` in `Misc` section [#5592](https://github.com/vatesfr/xen-orchestra/issues/5592) (PR [#5604](https://github.com/vatesfr/xen-orchestra/pull/5604))
- [Task] Fix the items-per-page dropdown position (PR [#5584](https://github.com/vatesfr/xen-orchestra/pull/5584))

### Released packages

- @vates/disposable 0.1.0
- @xen-orchestra/fs 0.13.0
- @xen-orchestra/backups 0.5.0
- xen-api 0.29.1
- xo-common 0.6.0
- xo-server 5.76.0
- xo-web 5.78.1

## **5.55.1** (2021-02-05)

### Bug fixes

- [LDAP] "Synchronize LDAP groups" button: fix imported LDAP users not being correctly added or removed from groups in some cases (PR [#5545](https://github.com/vatesfr/xen-orchestra/pull/5545))
- [VM migration] Fix `VIF_NOT_IN_MAP` error (PR [#5544](https://github.com/vatesfr/xen-orchestra/pull/5544))

### Released packages

- xo-server-auth-ldap 0.10.2
- xo-server 5.74.1

## **5.55.0** (2021-01-29)

### Highlights

- [Web hooks] Possibility to wait a response from the server before continuing [#4948](https://github.com/vatesfr/xen-orchestra/issues/4948) (PR [#5420](https://github.com/vatesfr/xen-orchestra/pull/5420))
- [XOA/update] Add a link to the channel's changelog (PR [#5494](https://github.com/vatesfr/xen-orchestra/pull/5494))
- Assign custom date-time fields on pools, hosts, SRs, and VMs in advanced tab [#4730](https://github.com/vatesfr/xen-orchestra/issues/4730) (PR [#5473](https://github.com/vatesfr/xen-orchestra/pull/5473))
- [Health] Show duplicated MAC addresses with their VIFs, VMs and networks [#5448](https://github.com/vatesfr/xen-orchestra/issues/5448) (PR [#5468](https://github.com/vatesfr/xen-orchestra/pull/5468))
- [Pool/advanced] Ability to define default migration network [#3788](https://github.com/vatesfr/xen-orchestra/issues/3788#issuecomment-743207834) (PR [#5465](https://github.com/vatesfr/xen-orchestra/pull/5465))
- [Proxy] Support metadata backups (PRs [#5499](https://github.com/vatesfr/xen-orchestra/pull/5499) [#5517](https://github.com/vatesfr/xen-orchestra/pull/5517) [#5519](https://github.com/vatesfr/xen-orchestra/pull/5519) [#5520](https://github.com/vatesfr/xen-orchestra/pull/5520))
- [VM/console] Add button to connect to the VM via the local RDP client [#5495](https://github.com/vatesfr/xen-orchestra/issues/5495) (PR [#5523](https://github.com/vatesfr/xen-orchestra/pull/5523))

### Enhancements

- [Host/stats] Show interfaces' names in graph "Network throughput" instead of PIFs' indices (PR [#5483](https://github.com/vatesfr/xen-orchestra/pull/5483))
- [Metadata backups] Ability to link a backup to a proxy (PR [#4206](https://github.com/vatesfr/xen-orchestra/pull/4206))
- [VM] Ability to set guest secure boot (guest secure boot is available soon in XCP-ng) [#5502](https://github.com/vatesfr/xen-orchestra/issues/5502) (PR [#5527](https://github.com/vatesfr/xen-orchestra/pull/5527))
- [Proxy] Improve upgrade feedback (PR [#5525](https://github.com/vatesfr/xen-orchestra/pull/5525))

### Bug fixes

- [VM/network] Change VIF's locking mode automatically to `locked` when adding allowed IPs (PR [#5472](https://github.com/vatesfr/xen-orchestra/pull/5472))
- [Backup Reports] Don't hide errors during plugin test [#5486](https://github.com/vatesfr/xen-orchestra/issues/5486) (PR [#5491](https://github.com/vatesfr/xen-orchestra/pull/5491))
- [Backup reports] Fix malformed sent email in case of multiple VMs (PR [#5479](https://github.com/vatesfr/xen-orchestra/pull/5479))
- [Restore/metadata] Ignore disabled remotes on listing backups (PR [#5504](https://github.com/vatesfr/xen-orchestra/pull/5504))
- [VM/network] Change VIF's locking mode automatically to `network_default` when changing network (PR [#5500](https://github.com/vatesfr/xen-orchestra/pull/5500))
- [Backup/S3] Fix `TimeoutError: Connection timed out after 120000ms` (PR [#5456](https://github.com/vatesfr/xen-orchestra/pull/5456))
- [New SR/reattach SR] Fix SR not being properly reattached to hosts [#4546](https://github.com/vatesfr/xen-orchestra/issues/4546) (PR [#5488](https://github.com/vatesfr/xen-orchestra/pull/5488))
- [Home/pool] Missing patches warning: fix 1 patch showing as missing in case of error [#4922](https://github.com/vatesfr/xen-orchestra/issues/4922)
- [Proxy/remote] Fix error not updated on remote test (PR [#5514](https://github.com/vatesfr/xen-orchestra/pull/5514))
- [Home/SR] Sort SR usage in % instead of bytes [#5463](https://github.com/vatesfr/xen-orchestra/issues/5463) (PR [#5513](https://github.com/vatesfr/xen-orchestra/pull/5513))
- [VM migration] Fix `SR_NOT_ATTACHED` error when migration network is selected (PR [#5516](https://github.com/vatesfr/xen-orchestra/pull/5516))

### Released packages

- @xen-orchestra/fs 0.12.1
- xo-server-backup-reports 0.16.8
- xo-server 5.74.0
- xo-web 5.77.0
- xo-server-web-hooks 0.3.0

## **5.54.0** (2020-12-29)

### Highlights

- [Home] Ability to sort VMs by total disks physical usage (PR [#5418](https://github.com/vatesfr/xen-orchestra/pull/5418))
- [Home/VM] Ability to choose network for bulk migration within a pool (PR [#5427](https://github.com/vatesfr/xen-orchestra/pull/5427))
- [Host] Ability to set host control domain memory [#2218](https://github.com/vatesfr/xen-orchestra/issues/2218) (PR [#5437](https://github.com/vatesfr/xen-orchestra/pull/5437))
- [Patches] Rolling pool update: automatically patch and restart a whole pool by live migrating running VMs back and forth as needed [#5286](https://github.com/vatesfr/xen-orchestra/issues/5286) (PR [#5430](https://github.com/vatesfr/xen-orchestra/pull/5430))
- [Host] Replace `disabled/enabled state` by `maintenance mode` (PR [#5421](https://github.com/vatesfr/xen-orchestra/pull/5421))
- [Dashboard/Overview] Filter out `udev` SRs [#5423](https://github.com/vatesfr/xen-orchestra/issues/5423) (PR [#5453](https://github.com/vatesfr/xen-orchestra/pull/5453))

### Enhancements

- [Plugins] Add user feedback when a plugin test finishes successfully (PR [#5409](https://github.com/vatesfr/xen-orchestra/pull/5409))
- [New HBA SR] Show LUN serial and id in LUN selector (PR [#5422](https://github.com/vatesfr/xen-orchestra/pull/5422))
- [Proxy] Ability to delete VM backups (PR [#5428](https://github.com/vatesfr/xen-orchestra/pull/5428))
- [VM/disks, SR/disks] Destroy/forget VDIs: improve tooltip messages (PR [#5435](https://github.com/vatesfr/xen-orchestra/pull/5435))

### Bug fixes

- [Host] Fix `an error has occurred` on accessing a host's page (PR [#5417](https://github.com/vatesfr/xen-orchestra/pull/5417))

### Released packages

- xo-web 5.76.0
- xo-server 5.73.0

## **5.53.1** (2020-12-10)

### Bug fixes

- [OVA/import] Fix OVA CLI import tool (PR [#5432](https://github.com/vatesfr/xen-orchestra/pull/5432))
- [Jobs] Fix `Cannot read property id of undefined` error when running a job without a schedule [#5425](https://github.com/vatesfr/xen-orchestra/issues/5425) (PR [#5426](https://github.com/vatesfr/xen-orchestra/pull/5426))

### Released packages

- @xen-orchestra/upload-ova 0.1.4
- xo-server 5.72.0

## **5.53.0** (2020-11-30)

### Enhancements

- [LDAP] Prevent LDAP-provided groups from being edited from XO [#1884](https://github.com/vatesfr/xen-orchestra/issues/1884) (PR [#5351](https://github.com/vatesfr/xen-orchestra/pull/5351))
- [Licensing] Allow Free and Starter users to copy VMs and create a VM from snapshot on the same pool [#4890](https://github.com/vatesfr/xen-orchestra/issues/4890) (PR [5333](https://github.com/vatesfr/xen-orchestra/pull/5333))
- [SR] Use SR type `zfs` instead of `file` for ZFS storage repositories (PR [5302](https://github.com/vatesfr/xen-orchestra/pull/5330))
- [Dashboard/Health] List VMs with missing or outdated guest tools (PR [#5376](https://github.com/vatesfr/xen-orchestra/pull/5376))
- [VIF] Ability for admins to set any allowed IPs, including IPv6 and IPs that are not in an IP pool [#2535](https://github.com/vatesfr/xen-orchestra/issues/2535) [#1872](https://github.com/vatesfr/xen-orchestra/issues/1872) (PR [#5367](https://github.com/vatesfr/xen-orchestra/pull/5367))
- [Proxy] Ability to restore a file from VM backup (PR [#5359](https://github.com/vatesfr/xen-orchestra/pull/5359))
- [Web Hooks] `backupNg.runJob` is now triggered by scheduled runs [#5205](https://github.com/vatesfr/xen-orchestra/issues/5205) (PR [#5360](https://github.com/vatesfr/xen-orchestra/pull/5360))
- [Licensing] Add trial end information banner (PR [#5374](https://github.com/vatesfr/xen-orchestra/pull/5374))
- Assign custom fields on pools, hosts, SRs, and VMs in advanced tab [#4730](https://github.com/vatesfr/xen-orchestra/issues/4730) (PR [#5387](https://github.com/vatesfr/xen-orchestra/pull/5387))
- Ability to change the number of items displayed per table or page (PR [#5355](https://github.com/vatesfr/xen-orchestra/pull/5355))
- [VM] Handle setting memory when DMC is disabled [#4978](https://github.com/vatesfr/xen-orchestra/issues/4978) & [#5326](https://github.com/vatesfr/xen-orchestra/issues/5326) (PR [#5412](https://github.com/vatesfr/xen-orchestra/pull/5412))

### Bug fixes

- [Remotes/NFS] Only mount with `vers=3` when no other options [#4940](https://github.com/vatesfr/xen-orchestra/issues/4940) (PR [#5354](https://github.com/vatesfr/xen-orchestra/pull/5354))
- [VM/network] Don't change VIF's locking mode automatically (PR [#5357](https://github.com/vatesfr/xen-orchestra/pull/5357))
- [Import OVA] Fix 'Max payload size exceeded' error when importing huge OVAs (PR [#5372](https://github.com/vatesfr/xen-orchestra/pull/5372))
- [Backup] Make backup directories only accessible by root users (PR [#5378](https://github.com/vatesfr/xen-orchestra/pull/5378))

### Released packages

- xo-server-auth-ldap 0.10.1
- @vates/multi-key-map 0.1.0
- @xen-orchestra/fs 0.12.0
- vhd-lib 1.0.0
- xo-vmdk-to-vhd 2.0.0
- xo-server-web-hooks 0.2.0
- xo-server 5.71.2
- xo-web 5.75.0

## **5.52.0** (2020-10-30)

### Highlights

- [Host/Advanced] Display installed certificates with ability to install a new certificate [#5134](https://github.com/vatesfr/xen-orchestra/issues/5134) (PRs [#5319](https://github.com/vatesfr/xen-orchestra/pull/5319) [#5332](https://github.com/vatesfr/xen-orchestra/pull/5332))
- [VM/network] Allow Self Service users to change a VIF's network [#5020](https://github.com/vatesfr/xen-orchestra/issues/5020) (PR [#5203](https://github.com/vatesfr/xen-orchestra/pull/5203))
- [Host/Advanced] Ability to change the scheduler granularity. Only available on XCP-ng >= 8.2 [#5291](https://github.com/vatesfr/xen-orchestra/issues/5291) (PR [#5320](https://github.com/vatesfr/xen-orchestra/pull/5320))

### Enhancements

- [New SSH key] Show warning when the SSH key already exists (PR [#5329](https://github.com/vatesfr/xen-orchestra/pull/5329))
- [Pool/Network] Add a tooltip to the `Automatic` column (PR [#5345](https://github.com/vatesfr/xen-orchestra/pull/5345))
- [LDAP] Ability to force group synchronization [#1884](https://github.com/vatesfr/xen-orchestra/issues/1884) (PR [#5343](https://github.com/vatesfr/xen-orchestra/pull/5343))

### Bug fixes

- [Host] Fix power state stuck on busy after power off [#4919](https://github.com/vatesfr/xen-orchestra/issues/4919) (PR [#5288](https://github.com/vatesfr/xen-orchestra/pull/5288))
- [VM/Network] Don't allow users to change a VIF's locking mode if they don't have permissions on the network (PR [#5283](https://github.com/vatesfr/xen-orchestra/pull/5283))
- [Backup/overview] Add tooltip on the running backup job button (PR [#5325 ](https://github.com/vatesfr/xen-orchestra/pull/5325))
- [VM] Show snapshot button in toolbar for Self Service users (PR [#5324](https://github.com/vatesfr/xen-orchestra/pull/5324))
- [User] Fallback to default filter on resetting customized filter (PR [#5321](https://github.com/vatesfr/xen-orchestra/pull/5321))
- [Home] Show error notification when bulk VM snapshot fails (PR [#5323](https://github.com/vatesfr/xen-orchestra/pull/5323))
- [Backup] Skip VMs currently migrating

### Released packages

- xo-server-auth-ldap 0.10.0
- vhd-lib 0.8.0
- @xen-orchestra/audit-core 0.2.0
- xo-server-audit 0.9.0
- xo-web 5.74.0
- xo-server 5.70.0

## **5.51.1** (2020-10-14)

### Enhancements

- [Host/Advanced] Add the field `IOMMU` if it is defined (PR [#5294](https://github.com/vatesfr/xen-orchestra/pull/5294))
- [Backup logs/report] Hide merge task when no merge is done (PR [#5263](https://github.com/vatesfr/xen-orchestra/pull/5263))
- [New backup] Enable created schedules by default (PR [#5280](https://github.com/vatesfr/xen-orchestra/pull/5280))
- [Backup/overview] Link backup jobs/schedules to their corresponding logs [#4564](https://github.com/vatesfr/xen-orchestra/issues/4564) (PR [#5260](https://github.com/vatesfr/xen-orchestra/pull/5260))
- [VM] Hide backup tab for non-admin users [#5309](https://github.com/vatesfr/xen-orchestra/issues/5309) (PR [#5317](https://github.com/vatesfr/xen-orchestra/pull/5317))
- [VM/Bulk migrate] Sort hosts in the select so that the hosts on the same pool are shown first [#4462](https://github.com/vatesfr/xen-orchestra/issues/4462) (PR [#5308](https://github.com/vatesfr/xen-orchestra/pull/5308))
- [Proxy] Ability to update HTTP proxy configuration on XOA proxy (PR [#5148](https://github.com/vatesfr/xen-orchestra/pull/5148))

### Bug fixes

- [XOA/Notifications] Don't show expired notifications (PR [#5304](https://github.com/vatesfr/xen-orchestra/pull/5304))
- [Backup/S3] Fix secret key edit form [#5233](https://github.com/vatesfr/xen-orchestra/issues/5233) (PR[#5305](https://github.com/vatesfr/xen-orchestra/pull/5305))
- [New network] Remove the possibility of creating a network on a bond member interface (PR [#5262](https://github.com/vatesfr/xen-orchestra/pull/5262))
- [User] Fix custom filters not showing up when selecting a default filter for templates (PR [#5298](https://github.com/vatesfr/xen-orchestra/pull/5298))
- [Self/VDI migration] Fix hidden VDI after migration (PR [#5296](https://github.com/vatesfr/xen-orchestra/pull/5296))
- [Self/VDI migration] Fix `not enough permissions` error (PR [#5299](https://github.com/vatesfr/xen-orchestra/pull/5299))
- [Home] Hide backup filter for non-admin users [#5285](https://github.com/vatesfr/xen-orchestra/issues/5285) (PR [#5264](https://github.com/vatesfr/xen-orchestra/pull/5264))
- [Backup/S3] Fix request signature error [#5253](https://github.com/vatesfr/xen-orchestra/issues/5253) (PR[#5315](https://github.com/vatesfr/xen-orchestra/pull/5315))
- [SDN Controller] Fix tunnel traffic going on the wrong NIC: see https://xcp-ng.org/forum/topic/3544/mtu-problems-with-vxlan. (PR [#5281](https://github.com/vatesfr/xen-orchestra/pull/5281))
- [Settings/IP Pools] Fix some IP ranges being split into multiple ranges in the UI [#3170](https://github.com/vatesfr/xen-orchestra/issues/3170) (PR [#5314](https://github.com/vatesfr/xen-orchestra/pull/5314))
- [Self/Delete] Detach VMs and remove their ACLs on removing a resource set [#4797](https://github.com/vatesfr/xen-orchestra/issues/4797) (PR [#5312](https://github.com/vatesfr/xen-orchestra/pull/5312))
- Fix `not enough permissions` error when accessing some pages as a Self Service user (PR [#5303](https://github.com/vatesfr/xen-orchestra/pull/5303))
- [VM] Explicit error when VM migration failed due to unset default SR on destination pool [#5282](https://github.com/vatesfr/xen-orchestra/issues/5282) (PR [#5306](https://github.com/vatesfr/xen-orchestra/pull/5306))

### Released packages

- xo-server-sdn-controller 1.0.4
- xo-server-backup-reports 0.16.7
- xo-server 5.68.0
- xo-web 5.72.0

## **5.51.0** (2020-09-30)

### Highlights

- [Self/VDI migration] Ability to migrate VDIs to other SRs within a resource set [#5020](https://github.com/vatesfr/xen-orchestra/issues/5020) (PR [#5201](https://github.com/vatesfr/xen-orchestra/pull/5201))
- [LDAP] Ability to import LDAP groups to XO [#1884](https://github.com/vatesfr/xen-orchestra/issues/1884) (PR [#5279](https://github.com/vatesfr/xen-orchestra/pull/5279))
- [Tasks] Show XO objects linked to pending/finished tasks [#4275](https://github.com/vatesfr/xen-orchestra/issues/4275) (PR [#5267](https://github.com/vatesfr/xen-orchestra/pull/5267))
- [Backup logs] Ability to filter by VM/pool name [#4406](https://github.com/vatesfr/xen-orchestra/issues/4406) (PR [#5208](https://github.com/vatesfr/xen-orchestra/pull/5208))
- [Backup/logs] Log's tasks pagination [#4406](https://github.com/vatesfr/xen-orchestra/issues/4406) (PR [#5209](https://github.com/vatesfr/xen-orchestra/pull/5209))

### Enhancements

- [VM Import] Make the `Description` field optional (PR [#5258](https://github.com/vatesfr/xen-orchestra/pull/5258))
- [New VM] Hide missing ISOs in selector [#5222](https://github.com/vatesfr/xen-orchestra/issues/5222)
- [Dashboard/Health] Show VMs that have too many snapshots [#5238](https://github.com/vatesfr/xen-orchestra/pull/5238)
- [Groups] Ability to delete multiple groups at once (PR [#5264](https://github.com/vatesfr/xen-orchestra/pull/5264))

### Bug fixes

- [Import VMDK] Fix `No position specified for vmdisk1` error (PR [#5255](https://github.com/vatesfr/xen-orchestra/pull/5255))
- [API] Fix `this.removeSubjectFromResourceSet is not a function` error on calling `resourceSet.removeSubject` via `xo-cli` [#5265](https://github.com/vatesfr/xen-orchestra/issues/5265) (PR [#5266](https://github.com/vatesfr/xen-orchestra/pull/5266))
- [Import OVA] Fix frozen UI when dropping a big OVA on the page (PR [#5274](https://github.com/vatesfr/xen-orchestra/pull/5274))
- [Remotes/S3] Fix S3 backup of 50GB+ files [#5197](https://github.com/vatesfr/xen-orchestra/issues/5197) (PR[ #5242](https://github.com/vatesfr/xen-orchestra/pull/5242) )
- [Import OVA] Improve import speed of embedded gzipped VMDK disks (PR [#5275](https://github.com/vatesfr/xen-orchestra/pull/5275))
- [Remotes] Fix editing bucket and directory for S3 remotes [#5233](https://github.com/vatesfr/xen-orchestra/issues/5233) (PR [5276](https://github.com/vatesfr/xen-orchestra/pull/5276))

### Released packages

- xo-server-auth-ldap 0.9.0
- @xen-orchestra/fs 0.11.1
- xo-vmdk-to-vhd 1.3.1
- xo-server 5.67.0
- xo-web 5.71.0

## **5.50.3** (2020-09-17)

### Released packages

- xo-server-audit 0.8.0

## **5.50.2** (2020-09-10)

### Enhancements

- [VM/network] VIF's locking mode: improve tooltip messages [#4713](https://github.com/vatesfr/xen-orchestra/issues/4713) (PR [#5227](https://github.com/vatesfr/xen-orchestra/pull/5227))
- [Backup/overview] Link log entry to its job [#4564](https://github.com/vatesfr/xen-orchestra/issues/4564) (PR [#5202](https://github.com/vatesfr/xen-orchestra/pull/5202))

### Bug fixes

- [New SR] Fix `Cannot read property 'trim' of undefined` error (PR [#5212](https://github.com/vatesfr/xen-orchestra/pull/5212))
- [Dashboard/Health] Fix suspended VDIs considered as orphans [#5248](https://github.com/vatesfr/xen-orchestra/issues/5248) (PR [#5249](https://github.com/vatesfr/xen-orchestra/pull/5249))

### Released packages

- xo-server-audit 0.7.2
- xo-web 5.70.0
- xo-server 5.66.2

## **5.50.1** (2020-09-04)

### Enhancements

- [Usage report] Exclude replicated VMs from the VMs evolution [#4778](https://github.com/vatesfr/xen-orchestra/issues/4778) (PR [#5241](https://github.com/vatesfr/xen-orchestra/pull/5241))

### Bug fixes

- [VM/Network] Fix TX checksumming [#5234](https://github.com/vatesfr/xen-orchestra/issues/5234)

### Released packages

- xo-server-usage-report 0.9.0
- xo-server-audit 0.7.1
- xo-server 5.66.1

## **5.50.0** (2020-08-27)

### Highlights

- [Health/Orphan VDIs] Improve heuristic and list both VDI snapshots and normal VDIs (PR [#5228](https://github.com/vatesfr/xen-orchestra/pull/5228))
- [[Audit] Regularly save fingerprints on remote server for better tempering detection](https://xen-orchestra.com/blog/xo-audit/) [#4844](https://github.com/vatesfr/xen-orchestra/issues/4844) (PR [#5077](https://github.com/vatesfr/xen-orchestra/pull/5077))
- [VM/Network] Ability to change a VIF's locking mode [#4713](https://github.com/vatesfr/xen-orchestra/issues/4713) (PR [#5188](https://github.com/vatesfr/xen-orchestra/pull/5188))
- [VM/Network] Ability to set VIF TX checksumming [#5095](https://github.com/vatesfr/xen-orchestra/issues/5095) (PR [#5182](https://github.com/vatesfr/xen-orchestra/pull/5182))
- [Host/Network] Button to refresh the list of physical interfaces [#5230](https://github.com/vatesfr/xen-orchestra/issues/5230)
- [VM] Ability to protect VM from accidental shutdown [#4773](https://github.com/vatesfr/xen-orchestra/issues/4773)

### Enhancements

- [Proxy] Improve health check error messages [#5161](https://github.com/vatesfr/xen-orchestra/issues/5161) (PR [#5191](https://github.com/vatesfr/xen-orchestra/pull/5191))
- [VM/Console] Hide missing ISOs in selector [#5222](https://github.com/vatesfr/xen-orchestra/issues/5222)

### Bug fixes

- [Proxy/deploy] Fix `no such proxy ok` error on a failure trial start (PR [#5196](https://github.com/vatesfr/xen-orchestra/pull/5196))
- [VM/snapshots] Fix redirection when creating a VM from a snapshot (PR [#5213](https://github.com/vatesfr/xen-orchestra/pull/5213))
- [User] Fix `Incorrect password` error when changing password [#5218](https://github.com/vatesfr/xen-orchestra/issues/5218) (PR [#5221](https://github.com/vatesfr/xen-orchestra/pull/5221))
- [Audit] Obfuscate sensitive data in `user.changePassword` action's records [#5219](https://github.com/vatesfr/xen-orchestra/issues/5219) (PR [#5220](https://github.com/vatesfr/xen-orchestra/pull/5220))
- [SDN Controller] Fix `Cannot read property '$network' of undefined` error at the network creation (PR [#5217](https://github.com/vatesfr/xen-orchestra/pull/5217))

### Released packages

- xo-server-audit 0.7.0
- xo-server-sdn-controller 1.0.3
- xo-server 5.66.0
- xo-web 5.69.0

## **5.49.1** (2020-08-05)

### Enhancements

- [SR/advanced] Show thin/thick provisioning for missing SR types (PR [#5204](https://github.com/vatesfr/xen-orchestra/pull/5204))

### Bug fixes

- [Patches] Don't log errors related to missing patches listing (Previous fix in 5.48.3 was not working)

### Released packages

- xo-server 5.64.1
- xo-server-sdn-controller 1.0.2
- xo-web 5.67.0

## **5.49.0** (2020-07-31)

### Highlights

- [Home/VM, host] Ability to filter by power state (PR [#5118](https://github.com/vatesfr/xen-orchestra/pull/5118))
- [Proxy/deploy] Ability to set HTTP proxy configuration (PR [#5145](https://github.com/vatesfr/xen-orchestra/pull/5145))
- [Import/OVA] Allow for VMDK disks inside .ova files to be gzipped (PR [#5085](https://github.com/vatesfr/xen-orchestra/pull/5085))
- [Proxy] Show pending upgrades (PR [#5167](https://github.com/vatesfr/xen-orchestra/pull/5167))
- [SDN Controller] Add/Remove network traffic rules for a VM's VIFs (PR [#5135](https://github.com/vatesfr/xen-orchestra/pull/5135))
- [Backup/health] Show VM snapshots with missing jobs, schedules or VMs [#5086](https://github.com/vatesfr/xen-orchestra/issues/5086) (PR [#5125](https://github.com/vatesfr/xen-orchestra/pull/5125))
- [New delta backup] Show a warning icon when the advanced full backup interval setting and the backup retention are greater than 50 (PR (https://github.com/vatesfr/xen-orchestra/pull/5144))
- [VM/network] Improve the network locking mode feedback [#4713](https://github.com/vatesfr/xen-orchestra/issues/4713) (PR [#5170](https://github.com/vatesfr/xen-orchestra/pull/5170))
- [Remotes] Add AWS S3 as a backup storage
- [New VM] Only make network boot option first when the VM has no disks or when the network installation is chosen [#4980](https://github.com/vatesfr/xen-orchestra/issues/4980) (PR [#5119](https://github.com/vatesfr/xen-orchestra/pull/5119))

### Enhancements

- Log the `Invalid XML-RPC message` error as an unexpected response (PR [#5138](https://github.com/vatesfr/xen-orchestra/pull/5138))
- [VM/disks] By default, sort disks by their device position instead of their name [#5163](https://github.com/vatesfr/xen-orchestra/issues/5163) (PR [#5165](https://github.com/vatesfr/xen-orchestra/pull/5165))
- [Schedule/edit] Ability to enable/disable an ordinary job's schedule [#5026](https://github.com/vatesfr/xen-orchestra/issues/5026) (PR [#5111](https://github.com/vatesfr/xen-orchestra/pull/5111))
- [New schedule] Enable 'Enable immediately after creation' by default (PR [#5111](https://github.com/vatesfr/xen-orchestra/pull/5111))
- [Self Service] Ability to globally ignore snapshots in resource set quotas (PR [#5164](https://github.com/vatesfr/xen-orchestra/pull/5164))
- [Self] Ability to cancel a resource set edition without saving it (PR [#5174](https://github.com/vatesfr/xen-orchestra/pull/5174))
- [VIF] Ability to click an IP address to copy it to the clipboard [#5185](https://github.com/vatesfr/xen-orchestra/issues/5185) (PR [#5186](https://github.com/vatesfr/xen-orchestra/pull/5186))

### Bug fixes

- [Backup/Restore] Fixes `an error has occurred` when all backups for a specific VM have been deleted (PR [#5156](https://github.com/vatesfr/xen-orchestra/pull/5156))
- [OVA Import] Fix import of Red Hat generated .ova files (PR [#5159](https://github.com/vatesfr/xen-orchestra/pull/5159))
- [Fast clone] Fix bug where the name of the created VM would be "undefined_clone" (PR [#5173](https://github.com/vatesfr/xen-orchestra/pull/5173))
- [Audit] Fix unreadable exported records format (PR [#5179](https://github.com/vatesfr/xen-orchestra/pull/5179))
- [SDN Controller] Fixes TLS error `dh key too small` [#5074](https://github.com/vatesfr/xen-orchestra/issues/5074) (PR [#5187](https://github.com/vatesfr/xen-orchestra/pull/5187))

### Released packages

- xo-server-audit 0.6.1
- @xen-orchestra/openflow 0.1.1
- xo-server-sdn-controller 1.0.1
- xo-vmdk-to-vhd 1.3.0
- xo-remote-parser 0.6.0
- @xen-orchestra/fs 0.11.0
- xo-server 5.64.0
- xo-web 5.66.0

## **5.48.3** (2020-07-10)

### Enhancements

- [Audit] Logging user actions is now opt-in (PR [#5151](https://github.com/vatesfr/xen-orchestra/pull/5151))
- [Settings/Audit] Warn if logging is inactive (PR [#5152](https://github.com/vatesfr/xen-orchestra/pull/5152))

### Bug fixes

- [Proxy] Don't use configured HTTP proxy to connect to XO proxy
- [Backup with proxy] Correctly log job-level errors
- [XO] Fix a few broken documentation links (PR [#5146](https://github.com/vatesfr/xen-orchestra/pull/5146))
- [Patches] Don't log errors related to missing patches listing (PR [#5149](https://github.com/vatesfr/xen-orchestra/pull/5149))

### Released packages

- xo-server-audit 0.6.0
- xo-web 5.64.0
- xo-server 5.62.1

## **5.48.2** (2020-07-07)

### Enhancements

- [Backup] Better resolution of the "last run log" quick access (PR [#5141](https://github.com/vatesfr/xen-orchestra/pull/5141))
- [Patches] Don't check patches on halted XCP-ng hosts (PR [#5140](https://github.com/vatesfr/xen-orchestra/pull/5140))
- [XO] Don't check time consistency on halted hosts (PR [#5140](https://github.com/vatesfr/xen-orchestra/pull/5140))

### Bug fixes

- [Smart backup/edit] Fix "Excluded VMs tags" being reset to the default ones (PR [#5136](https://github.com/vatesfr/xen-orchestra/pull/5136))

### Released packages

- xo-web 5.63.0

## **5.48.1** (2020-07-03)

### Enhancements

- [Home] Remove 'tags' filter from the filter selector since tags have their own selector (PR [#5121](https://github.com/vatesfr/xen-orchestra/pull/5121))
- [Backup/New] Add "XOA Proxy" to the excluded tags by default (PR [#5128](https://github.com/vatesfr/xen-orchestra/pull/5128))
- [Backup/overview] Don't open backup job edition in a new tab (PR [#5130](https://github.com/vatesfr/xen-orchestra/pull/5130))

### Bug fixes

- [Restore legacy, File restore legacy] Fix mount error in case of existing proxy remotes (PR [#5124](https://github.com/vatesfr/xen-orchestra/pull/5124))
- [File restore] Don't fail with `TypeError [ERR_INVALID_ARG_TYPE]` on LVM partitions
- [Import/OVA] Fix import of bigger OVA files (>8GB .vmdk disk) (PR [#5129](https://github.com/vatesfr/xen-orchestra/pull/5129))

### Released packages

- xo-vmdk-to-vhd 1.2.1
- xo-server 5.62.0
- xo-web 5.62.0

## **5.48.0** (2020-06-30)

### Highlights

- [VM/Network] Show IP addresses in front of their VIFs [#4882](https://github.com/vatesfr/xen-orchestra/issues/4882) (PR [#5003](https://github.com/vatesfr/xen-orchestra/pull/5003))
- [Home/Template] Ability to copy/clone VM templates [#4734](https://github.com/vatesfr/xen-orchestra/issues/4734) (PR [#5006](https://github.com/vatesfr/xen-orchestra/pull/5006))
- [VM] Ability to protect VM from accidental deletion [#4773](https://github.com/vatesfr/xen-orchestra/issues/4773) (PR [#5045](https://github.com/vatesfr/xen-orchestra/pull/5045))
- [VM] Differentiate PV drivers detection from management agent detection [#4783](https://github.com/vatesfr/xen-orchestra/issues/4783) (PR [#5007](https://github.com/vatesfr/xen-orchestra/pull/5007))
- [SR/Advanced, SR selector] Show thin/thick provisioning [#2208](https://github.com/vatesfr/xen-orchestra/issues/2208) (PR [#5081](https://github.com/vatesfr/xen-orchestra/pull/5081))
- [Backup/health] Show VM backups with missing jobs, schedules and VMs [#4716](https://github.com/vatesfr/xen-orchestra/issues/4716) (PR [#5062](https://github.com/vatesfr/xen-orchestra/pull/5062))

### Enhancements

- [Plugin] Disable test plugin action when the plugin is not loaded (PR [#5038](https://github.com/vatesfr/xen-orchestra/pull/5038))
- [VM/bulk copy] Add fast clone option (PR [#5006](https://github.com/vatesfr/xen-orchestra/pull/5006))
- [Home/VM] Homogenize the list of backed up VMs with the normal list (PR [#5046](https://github.com/vatesfr/xen-orchestra/pull/5046))
- [SR/Disks] Add tooltip for disabled migration (PR [#4884](https://github.com/vatesfr/xen-orchestra/pull/4884))
- [Licenses] Ability to move a license from another XOA to the current XOA (PR [#5110](https://github.com/vatesfr/xen-orchestra/pull/5110))

### Bug fixes

- [VM/Creation] Fix `insufficient space` which could happened when moving and resizing disks (PR [#5044](https://github.com/vatesfr/xen-orchestra/pull/5044))
- [VM/General] Fix displayed IPV6 instead of IPV4 in case of an old version of XenServer (PR [#5036](https://github.com/vatesfr/xen-orchestra/pull/5036))
- [Host/Load-balancer] Fix VM migration condition: free memory in the destination host must be greater or equal to used VM memory (PR [#5054](https://github.com/vatesfr/xen-orchestra/pull/5054))
- [Home] Broken "Import VM" link [#5055](https://github.com/vatesfr/xen-orchestra/issues/5055) (PR [#5056](https://github.com/vatesfr/xen-orchestra/pull/5056))
- [Home/SR] Fix inability to edit SRs' name [#5057](https://github.com/vatesfr/xen-orchestra/issues/5057) (PR [#5058](https://github.com/vatesfr/xen-orchestra/pull/5058))
- [Backup] Fix huge logs in case of Continuous Replication or Disaster Recovery errors (PR [#5069](https://github.com/vatesfr/xen-orchestra/pull/5069))
- [Notification] Fix same notification showing again as unread (PR [#5067](https://github.com/vatesfr/xen-orchestra/pull/5067))
- [SDN Controller] Fix broken private network creation when specifying a preferred center [#5076](https://github.com/vatesfr/xen-orchestra/issues/5076) (PRs [#5079](https://github.com/vatesfr/xen-orchestra/pull/5079) & [#5080](https://github.com/vatesfr/xen-orchestra/pull/5080))
- [Import/VMDK] Import of VMDK disks has been broken since 5.45.0 (PR [#5087](https://github.com/vatesfr/xen-orchestra/pull/5087))
- [Remotes] Fix not displayed used/total disk (PR [#5093](https://github.com/vatesfr/xen-orchestra/pull/5093))
- [Perf alert] Regroup items with missing stats in one email [#3137](https://github.com/vatesfr/xen-orchestra/issues/3137) (PR [#4413](https://github.com/vatesfr/xen-orchestra/pull/4413))

### Released packages

- xo-server-perf-alert 0.2.3
- xo-server-audit 0.5.0
- xo-server-sdn-controller 0.4.3
- xo-server-load-balancer 0.3.3
- xo-server 5.61.1
- xo-web 5.61.1

## **5.47.1** (2020-06-02)

### Bug fixes

- [auth-ldap] Sign in was broken in XO 5.47.0 (PR [#5039](https://github.com/vatesfr/xen-orchestra/pull/5039))

### Released packages

- xo-server-auth-ldap 0.8.1

## **5.47.0** (2020-05-29)

### Highlights

- [Proxy] Ability to start a trial if no license available (PR [#5022](https://github.com/vatesfr/xen-orchestra/pull/5022))
- [Home/VM] Ability to list VMs which are (not) backed up [#4777](https://github.com/vatesfr/xen-orchestra/issues/4777) (PR [#4974](https://github.com/vatesfr/xen-orchestra/pull/4974))
- [SDN Controller] Ability to choose host as preferred center at private network creation [#4991](https://github.com/vatesfr/xen-orchestra/issues/4991) (PR [#5000](https://github.com/vatesfr/xen-orchestra/pull/5000))
- [Plugin/auth-ldap] Support `StartTLS` [#4999](https://github.com/vatesfr/xen-orchestra/issues/4999)
- [XO config export] Ability to encrypt the exported file (PR [#4997](https://github.com/vatesfr/xen-orchestra/pull/4997))
- [Backup] Improve listing performance (PR [#4985](https://github.com/vatesfr/xen-orchestra/pull/4985))
- [Audit] Record failed connection attempts [#4844](https://github.com/vatesfr/xen-orchestra/issues/4844) (PR [#4900](https://github.com/vatesfr/xen-orchestra/pull/4900))
- [OVA import] Add support for OVA 2.0 file format (PR [#4921](https://github.com/vatesfr/xen-orchestra/pull/4921))
- [XOA/licenses] Display proxy licenses (PR [#4944](https://github.com/vatesfr/xen-orchestra/pull/4944))
- [Usage report] Include CSV raw data files to the sent email [#4970](https://github.com/vatesfr/xen-orchestra/issues/4970) (PR [#4979](https://github.com/vatesfr/xen-orchestra/pull/4979))

### Enhancements

- [VM] Move boot order setting from Disk tab to Advanced tab [#1523](https://github.com/vatesfr/xen-orchestra/issues/1523#issuecomment-563141573) (PR [#4975](https://github.com/vatesfr/xen-orchestra/pull/4975))
- [Network selector] Display pool's name [#4885](https://github.com/vatesfr/xen-orchestra/issues/4885) (PR [#4990](https://github.com/vatesfr/xen-orchestra/pull/4990))
- [Modal] Don't close pop-up forms when you click outside or press escape (PR [#5002](https://github.com/vatesfr/xen-orchestra/pull/5002))

### Bug fixes

- Fix mounting of NFS remote in FreeBSD (PR [#4988](https://github.com/vatesfr/xen-orchestra/issues/4988))
- [Remotes] Fix "remote is disabled" error on getting the remotes info (commit [eb2f429964d7adc264bf678c37e49a856454388e](https://github.com/vatesfr/xen-orchestra/commit/eb2f429964d7adc264bf678c37e49a856454388e))
- Fix default filters not being set in all tables (PR [#4994](https://github.com/vatesfr/xen-orchestra/pull/4994))
- [SDN Controller] Broken encrypted tunnels after host reboot [#4996](https://github.com/vatesfr/xen-orchestra/pull/4996)
- Don't log server's credentials in case of `SESSION_AUTHENTICATION_FAILED` error (PR [#4995](https://github.com/vatesfr/xen-orchestra/pull/4995))
- [Plugin/perf-alert] Fix compatibility of the alert messages with XenCenter (PR [#5004](https://github.com/vatesfr/xen-orchestra/pull/5004))
- [Plugin/backup-reports] Fix `No recipients defined` error when recipients defined at plugin level (PR [#4998](https://github.com/vatesfr/xen-orchestra/pull/4998))
- [Snapshots] Fix reverts sometimes being stuck (PR [#5027](https://github.com/vatesfr/xen-orchestra/pull/5027))

### Released packages

- xo-server-audit 0.4.0
- xo-vmdk-to-vhd 1.2.0
- xo-server-backup-reports 0.16.6
- xo-server-perf-alert 0.2.2
- xen-api 0.28.5
- xo-server-auth-ldap 0.8.0
- xo-server-sdn-controller 0.4.2
- xo-server-usage-report 0.8.0
- @xen-orchestra/fs 0.10.4
- xo-server 5.60.0
- xo-web 5.60.0

## **5.46.0** (2020-04-30)

### Highlights

- [Internationalization] Italian translation (Thanks [@infodavide](https://github.com/infodavide)!) [#4908](https://github.com/vatesfr/xen-orchestra/issues/4908) (PRs [#4931](https://github.com/vatesfr/xen-orchestra/pull/4931) [#4932](https://github.com/vatesfr/xen-orchestra/pull/4932))
- [Proxy] Associate a license to the deployed proxy (PR [#4912](https://github.com/vatesfr/xen-orchestra/pull/4912))
- [OVA import] Fix memory hogging behavior when the destination SR is slower than the file upload. (PR [#4920](https://github.com/vatesfr/xen-orchestra/pull/4920))

### Enhancements

- [Snapshot] Confirmation message before creating a snapshot with memory [#4914](https://github.com/vatesfr/xen-orchestra/issues/4914) (PR [#4917](https://github.com/vatesfr/xen-orchestra/pull/4917))
- Automatic generation of self-signed certificate if `autoCert` is not `false` in `xo-server`'s configuration in the corresponding `http.listen` section (PR [#4954](https://github.com/vatesfr/xen-orchestra/pull/4954))
- [Self] Better error when not enough available resources (PR [#4952](https://github.com/vatesfr/xen-orchestra/pull/4952))
- [Backup/run job] Confirmation modal: show the number of VMs that will be backed up (PR [#4875](https://github.com/vatesfr/xen-orchestra/pull/4875))

### Bug fixes

- [Backup] Fix TLS error (`unsupported protocol`) when XenServer <= 6.5 is used as target
- [Patches] Hide patch `CH81` (upgrade patch) from the pool patches (PR [#4942](https://github.com/vatesfr/xen-orchestra/pull/4942))
- [Proxy] Fix some `operation timed out` errors on (re)deploy [#4927](https://github.com/vatesfr/xen-orchestra/issues/4927) (PR [#4928](https://github.com/vatesfr/xen-orchestra/pull/4928))
- [Backup] Fix some `cannot get the proxy VM IP` errors on backup's execution [#4927](https://github.com/vatesfr/xen-orchestra/issues/4927) (PR [#4928](https://github.com/vatesfr/xen-orchestra/pull/4928))
- [XOA] Allow to access the license page when a XOA trial has ended (PR [#4941](https://github.com/vatesfr/xen-orchestra/pull/4941))

### Released packages

- xo-common 0.5.0
- @xen-orchestra/self-signed 0.1.0
- xo-vmdk-to-vhd 1.1.2
- xo-server-audit 0.3.1
- xen-api 0.28.4
- xo-server 5.59.0
- xo-web 5.59.0

## **5.45.1** (2020-04-08)

### Enhancements

- [VDI migration]
  - Remove 'Migrate all VDIs' checkbox (PR [#4876](https://github.com/vatesfr/xen-orchestra/pull/4876))
  - [VM/disks]: Add bulk migration (PR [#4877](https://github.com/vatesfr/xen-orchestra/pull/4877))
- [SAML] Possibility to pass [settings to the underlying library](https://github.com/bergie/passport-saml#config-parameter-details) via the `plugins.auth-saml.strategyOptions` section in `xo-server`'s configuration file

### Bug fixes

- Fix TLS error (`unsupported protocol`) with XenServer <= 6.5 and Node >= 12 for backups, consoles, and statistics [#4906](https://github.com/vatesfr/xen-orchestra/issues/4906)
- [Audit] Fix "EACCES" error in case of changing the user that run "xo-server" [#4854](https://github.com/vatesfr/xen-orchestra/issues/4854) (PR [#4897](https://github.com/vatesfr/xen-orchestra/pull/4897))
- [Patches] Reduce the amount of error logs related to missing patches (PR [#4911](https://github.com/vatesfr/xen-orchestra/pull/4911))

### Released packages

- xo-server-auth-saml 0.8.0
- xo-server-audit 0.3.0
- xo-server 5.58.2
- xo-web 5.58.2

## **5.45.0** (2020-03-31)

### Highlights

- [Proxy / Deploy] Ability to select the destination network [#4825](https://github.com/vatesfr/xen-orchestra/issues/4825) (PR [#4855](https://github.com/vatesfr/xen-orchestra/pull/4855))
- [VM/backup] Show backup jobs [#4623](https://github.com/vatesfr/xen-orchestra/issues/4623) (PR [#4860](https://github.com/vatesfr/xen-orchestra/pull/4860))
- [SR / Disks] Ability to migrate VDIs [#4455](https://github.com/vatesfr/xen-orchestra/issues/4455) (PR [#4696](https://github.com/vatesfr/xen-orchestra/pull/4696))
- [VM migration] Ability to choose network for migration within a pool [#2028](https://github.com/vatesfr/xen-orchestra/issues/2028) (PR [#4828](https://github.com/vatesfr/xen-orchestra/pull/4828))
- [XOA] Manage the XOA licenses from the xoa/licenses page (PR [#3717](https://github.com/vatesfr/xen-orchestra/pull/3717))

### Enhancements

- [Support] Link to create a new support ticket [#4234](https://github.com/vatesfr/xen-orchestra/issues/4234) (PR [#4833](https://github.com/vatesfr/xen-orchestra/pull/4833))
- [Proxies] Ability to redeploy a proxy VM [#4825](https://github.com/vatesfr/xen-orchestra/issues/4825) (PR [#4725](https://github.com/vatesfr/xen-orchestra/pull/4725))
- [Proxies/Deploy] Remove SRs not connected to an HVM-capable host from selection [#4825](https://github.com/vatesfr/xen-orchestra/issues/4825) (PR [#4849](https://github.com/vatesfr/xen-orchestra/pull/4849))
- [Audit] Ability to export records [#4798](https://github.com/vatesfr/xen-orchestra/issues/4798) (PR [#4858](https://github.com/vatesfr/xen-orchestra/pull/4858))
- [Audit] Improve integrity check feedback [#4798](https://github.com/vatesfr/xen-orchestra/issues/4798) (PR [#4879](https://github.com/vatesfr/xen-orchestra/pull/4879))
- [Backup] **BETA** Ability to backup running VMs with their memory [#645](https://github.com/vatesfr/xen-orchestra/issues/645) (PR [#4252](https://github.com/vatesfr/xen-orchestra/pull/4252))
- [Import] add CLI tool to import OVA files (PR [#3630](https://github.com/vatesfr/xen-orchestra/pull/3630))

### Bug fixes

- [XOSAN] Fix the installer (PR [#4839](https://github.com/vatesfr/xen-orchestra/pull/4839))
- [OVA Import] Fix _no host available_ error when starting for imported VMs with low memory (PR [#4866](https://github.com/vatesfr/xen-orchestra/pull/4866))
- [Self] When a Self Service related operation fails, always revert the quotas to what they were before the operation (PR [#4861](https://github.com/vatesfr/xen-orchestra/pull/4861))
- [auth-{github,google,saml}] Don't require manually reloading the plugin for configuration changes to take effect [#4863](https://github.com/vatesfr/xen-orchestra/issues/4863) (PR [#4864](https://github.com/vatesfr/xen-orchestra/pull/4864))
- [auth-ldap] Fix reading certificate authorities files [#3873](https://github.com/vatesfr/xen-orchestra/issues/3873)
- [Backup NG / logs] Replace successful backup job status by failed status in case of missing VMs [#4857](https://github.com/vatesfr/xen-orchestra/issues/4857) (PR [#4862](https://github.com/vatesfr/xen-orchestra/pull/4862))
- [Jobs] Fix "no value for `user_ip`" error on jobs execution (PR [#4878](https://github.com/vatesfr/xen-orchestra/pull/4878))
- [Self] Properly take IP pools into account when computing quotas (PR [#4871](https://github.com/vatesfr/xen-orchestra/pull/4871))

### Released packages

- xo-vmdk-to-vhd 1.1.1
- @xen-orchestra/upload-ova 0.1.3
- @xen-orchestra/audit-core 0.1.1
- xo-server-audit 0.2.0
- xo-server-auth-github 0.2.2
- xo-server-auth-google 0.2.2
- xo-server-auth-ldap 0.7.1
- xo-server-auth-saml 0.7.2
- xo-server 5.58.1
- xo-web 5.58.1

## **5.44.1** (2020-03-05)

### Enhancements

- [Plugin] Show plugin description [#4569](https://github.com/vatesfr/xen-orchestra/issues/4569) (PR [#4832](https://github.com/vatesfr/xen-orchestra/pull/4832))

### Bug fixes

- [Backup reports] Fix backup report not sent in case of interrupted backup job (PR [#4772](https://github.com/vatesfr/xen-orchestra/pull/4772))
- Fix TLS error (`unsupported protocol`) with XenServer <= 6.5 and Node >= 12 (PR [#8437](https://github.com/vatesfr/xen-orchestra/pull/8437))
- [Metadata backup] Fix timeout when lots of pools are backed up [#4819](https://github.com/vatesfr/xen-orchestra/issues/4819) (PR [#4831](https://github.com/vatesfr/xen-orchestra/pull/4831))

### Released packages

- @xen-orchestra/fs v0.10.3
- xen-api v0.28.3
- xo-server-backup-reports v0.16.5
- xo-server-perf-alert v0.2.1
- xo-server-sdn-controller v0.4.1
- xo-server-transport-icinga2 v0.1.1
- xo-server-transport-nagios v0.1.1
- xo-server-usage-report v0.7.5
- xo-server-web-hooks v0.1.1
- xo-server v5.57.3
- xo-web v5.57.1

## **5.44.0** (2020-02-28)

### Highlights

- [Audit log] Record side effects triggered by users [#4653](https://github.com/vatesfr/xen-orchestra/issues/4653) [#701](https://github.com/vatesfr/xen-orchestra/issues/701) (PR [#4740](https://github.com/vatesfr/xen-orchestra/pull/4740))
- [SR/general] Clickable SR usage graph: shows the corresponding disks when you click on one of the sections [#4747](https://github.com/vatesfr/xen-orchestra/issues/4747) (PR [#4754](https://github.com/vatesfr/xen-orchestra/pull/4754))
- [New VM] Ability to copy host BIOS strings [#4204](https://github.com/vatesfr/xen-orchestra/issues/4204) (PR [4755](https://github.com/vatesfr/xen-orchestra/pull/4755))
- [New VM] Ability to set VM max vCPUS [#4703](https://github.com/vatesfr/xen-orchestra/issues/4703) (PR [#4729](https://github.com/vatesfr/xen-orchestra/pull/4729))

### Enhancements

- [SDN Controller] Automatically handle new, connected and disconnected servers (PR [#4677](https://github.com/vatesfr/xen-orchestra/pull/4677))
- [Proxy] Support network configuration for the deployed proxy (PR [#4810](https://github.com/vatesfr/xen-orchestra/pull/4810))
- [Menu] Display a warning icon in case of missing patches [#4475](https://github.com/vatesfr/xen-orchestra/issues/4475) (PR [#4683](https://github.com/vatesfr/xen-orchestra/pull/4683))

### Bug fixes

- [Usage Report] Fix wrong report date [#4779](https://github.com/vatesfr/xen-orchestra/issues/4779) (PR [#4799](https://github.com/vatesfr/xen-orchestra/pull/4799))
- [SDN Controller] Fix plugin stuck loading [#4649](https://github.com/vatesfr/xen-orchestra/issues/4649) (PR [#4677](https://github.com/vatesfr/xen-orchestra/pull/4677))
- [xo-server-logs] Fix `Cannot find module '../better-stacks'`

### Released packages

- xo-common v0.4.0
- @xen-orchestra/audit-core v0.1.0
- xo-server-audit v0.1.2
- xo-server-auth-ldap v0.7.0
- xo-server-usage-report v0.7.4
- xo-server-sdn-controller v0.4.0
- xo-server v5.57.2
- xo-web v5.57.0

## **5.43.3** (2020-03-06)

### Bug fixes

- [Backups] Fix an issue where DR and CR could stay stuck (commit [63739df](https://github.com/vatesfr/xen-orchestra/commit/63739df90369798f16b61bf96d1a89513c7edc77))

### Released packages

- xo-server v5.56.3

## **5.43.2** (2020-02-11)

### Bug fixes

- [Proxy] Correctly call the proxy when running backups (PRs [#4791](https://github.com/vatesfr/xen-orchestra/pull/4791) & [#4792](https://github.com/vatesfr/xen-orchestra/pull/4792))

### Released packages

- xo-server v5.56.2

## **5.43.1** (2020-02-06)

### Bug fixes

- [Self,IP pools] Fixed the creation being stuck and freezing XO (PR [#4776](https://github.com/vatesfr/xen-orchestra/pull/4776))
- [SDN Controller] Ensure the correct PIF is used to create private networks tunnels [#4737](https://github.com/vatesfr/xen-orchestra/issues/4737) (PR [#4757](https://github.com/vatesfr/xen-orchestra/pull/4757))

### Released packages

- xo-server-sdn-controller v0.3.2
- xo-server-auth-saml 0.7.1
- xo-server v5.56.1
- xo-web v5.56.2

## **5.43.0** (2020-01-31)

### Highlights

- [Home] Allow to change the number of items per page [#4535](https://github.com/vatesfr/xen-orchestra/issues/4535) (PR [#4708](https://github.com/vatesfr/xen-orchestra/pull/4708))
- [Tag] Adding a tag: ability to select from existing tags [#2810](https://github.com/vatesfr/xen-orchestra/issues/2810) (PR [#4530](https://github.com/vatesfr/xen-orchestra/pull/4530))
- [Smart backup] Ability to manually add custom tags [#2810](https://github.com/vatesfr/xen-orchestra/issues/2810) (PR [#4648](https://github.com/vatesfr/xen-orchestra/pull/4648))
- [Proxy] Ability to backup VMs via registered proxy [#4254](https://github.com/vatesfr/xen-orchestra/issues/4254) (PR [#4495](https://github.com/vatesfr/xen-orchestra/pull/4495))

### Enhancements

- [VM/Migrate] Ask user before forcing migration [#2136](https://github.com/vatesfr/xen-orchestra/issues/2136) (PR [#4364](https://github.com/vatesfr/xen-orchestra/pull/4364))

### Bug fixes

- [New network] Fix bonded network not linked to the slave hosts [#4529](https://github.com/vatesfr/xen-orchestra/issues/4529) (PR [#4756](https://github.com/vatesfr/xen-orchestra/pull/4756))

### Dropped features

- [Backup / Overview] Job cancellation will be disabled until we find a way to make it work [#4657](https://github.com/vatesfr/xen-orchestra/issues/4657) (PR [#4688](https://github.com/vatesfr/xen-orchestra/pull/4688))

### Released packages

- xo-common v0.3.0
- xo-server v5.56.0
- xo-web v5.56.1

## **5.42.1** (2020-01-17)

### Enhancements

- [Snapshot] Fallback to normal snapshot if quiesce is not available [#4735](https://github.com/vatesfr/xen-orchestra/issues/4735) (PR [#4736](https://github.com/vatesfr/xen-orchestra/pull/4736)) \
  Fixes compatibility with **Citrix Hypervisor 8.1**.
- [Uncompressed full backup] Quick healthcheck of downloaded XVAs in case there was an undetected issue (PR [#4741](https://github.com/vatesfr/xen-orchestra/pull/4741))
- [Backup] Make built-in concurrency limits configurable (PR [#4743](https://github.com/vatesfr/xen-orchestra/pull/4743)) \
  Via the following entries in `xo-server`'s configuration file:
  - `xapiOptions.vdiExportConcurrency`
  - `xapiOptions.vmExportConcurrency`
  - `xapiOptions.vmSnapshotConcurrency`

### Released packages

- xo-server v5.55.0
- xo-web v5.55.0

## **5.42.0** (2019-12-20)

### Highlights

- [SDN Controller] Allow private network creation on bond and VLAN (PR [#4682](https://github.com/vatesfr/xen-orchestra/pull/4682))
- [Hub/recipes][ability to create a kubernetes cluster](https://xen-orchestra.com/blog/devblog-5-kubernetes-clutser-on-xo/) (PR [#4695](https://github.com/vatesfr/xen-orchestra/pull/4695))

### Enhancements

- [XOA] Display XOA build number [#4693](https://github.com/vatesfr/xen-orchestra/issues/4693) (PR [#4694](https://github.com/vatesfr/xen-orchestra/pull/4694))

### Released packages

- xo-server v5.54.0
- xo-web v5.54.0

## **5.41.0** (2019-11-29)

### Highlights

- [Backup NG] Make report recipients configurable in the backup settings [#4581](https://github.com/vatesfr/xen-orchestra/issues/4581) (PR [#4646](https://github.com/vatesfr/xen-orchestra/pull/4646))
- [Host] Advanced Live Telemetry (PR [#4680](https://github.com/vatesfr/xen-orchestra/pull/4680))
- [Plugin][web hooks](https://docs.xen-orchestra.com/advanced#web-hooks) [#1946](https://github.com/vatesfr/xen-orchestra/issues/1946) (PR [#3155](https://github.com/vatesfr/xen-orchestra/pull/3155))

### Enhancements

- [SAML] Setting to disable requested authentication context (helps with _Active Directory_) (PR [#4675](https://github.com/vatesfr/xen-orchestra/pull/4675))
- The default sign-in page can be configured via `authentication.defaultSignInPage` (PR [#4678](https://github.com/vatesfr/xen-orchestra/pull/4678))
- [SR] Allow import of VHD and VMDK disks [#4137](https://github.com/vatesfr/xen-orchestra/issues/4137) (PR [#4138](https://github.com/vatesfr/xen-orchestra/pull/4138) )

### Bug fixes

- [Metadata backup] Add 10 minutes timeout to avoid stuck jobs [#4657](https://github.com/vatesfr/xen-orchestra/issues/4657) (PR [#4666](https://github.com/vatesfr/xen-orchestra/pull/4666))
- [Metadata backups] Fix out-of-date listing for 1 minute due to cache (PR [#4672](https://github.com/vatesfr/xen-orchestra/pull/4672))
- [Delta backup] Limit the number of merged deltas per run to avoid interrupted jobs (PR [#4674](https://github.com/vatesfr/xen-orchestra/pull/4674))

### Released packages

- vhd-lib v0.7.2
- xo-vmdk-to-vhd v0.1.8
- xo-server-auth-ldap v0.6.6
- xo-server-auth-saml v0.7.0
- xo-server-backup-reports v0.16.4
- xo-server-web-hooks v0.1.0
- @xen-orchestra/fs v0.10.2
- xo-server v5.53.0
- xo-web v5.53.3

## **5.40.2** (2019-11-22)

### Enhancements

- [Logs] Ability to report a bug with attached log (PR [#4201](https://github.com/vatesfr/xen-orchestra/pull/4201))
- [Backup] Reduce _VDI chain protection error_ occurrence by being more tolerant (configurable via `xo-server`'s `xapiOptions.maxUncoalescedVdis` setting) [#4124](https://github.com/vatesfr/xen-orchestra/issues/4124) (PR [#4651](https://github.com/vatesfr/xen-orchestra/pull/4651))
- [Tables] Always put the tables' search in the URL [#4542](https://github.com/vatesfr/xen-orchestra/issues/4542) (PR [#4637](https://github.com/vatesfr/xen-orchestra/pull/4637))

### Bug fixes

- [SDN controller] Prevent private network creation on bond slave PIF (Fixes https://github.com/xcp-ng/xcp/issues/300) (PR [4633](https://github.com/vatesfr/xen-orchestra/pull/4633))
- [Metadata backup] Fix failed backup reported as successful [#4596](https://github.com/vatesfr/xen-orchestra/issues/4596) (PR [#4598](https://github.com/vatesfr/xen-orchestra/pull/4598))
- [Backup NG] Fix "task cancelled" error when the backup job timeout exceeds 596 hours [#4662](https://github.com/vatesfr/xen-orchestra/issues/4662) (PR [#4663](https://github.com/vatesfr/xen-orchestra/pull/4663))
- Fix `promise rejected with non-error` warnings in logs (PR [#4659](https://github.com/vatesfr/xen-orchestra/pull/4659))

### Released packages

- xen-api v0.27.3
- xo-server-backup-reports v0.16.3
- vhd-lib v0.7.1
- xo-server v5.52.1
- xo-web v5.52.0

## **5.40.1** (2019-10-29)

### Bug fixes

- [XOSAN] Fix "Install Cloud plugin" warning (PR [#4631](https://github.com/vatesfr/xen-orchestra/pull/4631))

### Released packages

- xo-web v5.51.1

## **5.40.0** (2019-10-29)

### Breaking changes

- `xo-server` requires Node 8.

### Highlights

- [Backup NG] Offline backup feature [#3449](https://github.com/vatesfr/xen-orchestra/issues/3449) (PR [#4470](https://github.com/vatesfr/xen-orchestra/pull/4470))
- [Menu] Remove legacy backup entry [#4467](https://github.com/vatesfr/xen-orchestra/issues/4467) (PR [#4476](https://github.com/vatesfr/xen-orchestra/pull/4476))
- [Hub] Ability to update existing template (PR [#4613](https://github.com/vatesfr/xen-orchestra/pull/4613))
- [Support] Ability to open and close support tunnel from the user interface [#4513](https://github.com/vatesfr/xen-orchestra/issues/4513) (PR [#4616](https://github.com/vatesfr/xen-orchestra/pull/4616))

### Enhancements

- [Hub] Ability to select SR in hub VM installation (PR [#4571](https://github.com/vatesfr/xen-orchestra/pull/4571))
- [Hub] Display more info about downloadable templates (PR [#4593](https://github.com/vatesfr/xen-orchestra/pull/4593))
- [xo-server-transport-icinga2] Add support of [icinga2](https://icinga.com/docs/icinga2/latest/doc/12-icinga2-api/) for reporting services status [#4563](https://github.com/vatesfr/xen-orchestra/issues/4563) (PR [#4573](https://github.com/vatesfr/xen-orchestra/pull/4573))

### Bug fixes

- [SR] Fix `[object HTMLInputElement]` name after re-attaching a SR [#4546](https://github.com/vatesfr/xen-orchestra/issues/4546) (PR [#4550](https://github.com/vatesfr/xen-orchestra/pull/4550))
- [Schedules] Prevent double runs [#4625](https://github.com/vatesfr/xen-orchestra/issues/4625) (PR [#4626](https://github.com/vatesfr/xen-orchestra/pull/4626))
- [Schedules] Properly enable/disable on config import (PR [#4624](https://github.com/vatesfr/xen-orchestra/pull/4624))

### Released packages

- @xen-orchestra/cron v1.0.6
- xo-server-transport-icinga2 v0.1.0
- xo-server-sdn-controller v0.3.1
- xo-server v5.51.1
- xo-web v5.51.0

### Dropped packages

- xo-server-cloud : this package was useless for OpenSource installations because it required a complete XOA environment

## **5.39.1** (2019-10-11)

### Enhancements

- [Support] Ability to check the XOA on the user interface [#4513](https://github.com/vatesfr/xen-orchestra/issues/4513) (PR [#4574](https://github.com/vatesfr/xen-orchestra/pull/4574))

### Bug fixes

- [VM/new-vm] Fix template selection on creating new VM for resource sets [#4565](https://github.com/vatesfr/xen-orchestra/issues/4565) (PR [#4568](https://github.com/vatesfr/xen-orchestra/pull/4568))
- [VM] Clearer invalid cores per socket error [#4120](https://github.com/vatesfr/xen-orchestra/issues/4120) (PR [#4187](https://github.com/vatesfr/xen-orchestra/pull/4187))

### Released packages

- xo-web v5.50.3

## **5.39.0** (2019-09-30)

### Highlights

- [VM/console] Add a button to connect to the VM via the local SSH client (PR [#4415](https://github.com/vatesfr/xen-orchestra/pull/4415))
- [SDN Controller] Add possibility to encrypt private networks (PR [#4441](https://github.com/vatesfr/xen-orchestra/pull/4441))
- [Backups] Improve performance by caching VM backups listing (PR [#4509](https://github.com/vatesfr/xen-orchestra/pull/4509))
- [HUB] VM template store [#1918](https://github.com/vatesfr/xen-orchestra/issues/1918) (PR [#4442](https://github.com/vatesfr/xen-orchestra/pull/4442))

### Enhancements

- [SR/new] Clarify address formats [#4450](https://github.com/vatesfr/xen-orchestra/issues/4450) (PR [#4460](https://github.com/vatesfr/xen-orchestra/pull/4460))
- [Backup NG/New] Show warning if zstd compression is not supported on a VM [#3892](https://github.com/vatesfr/xen-orchestra/issues/3892) (PRs [#4411](https://github.com/vatesfr/xen-orchestra/pull/4411))
- [VM/disks] Don't hide disks that are attached to the same VM twice [#4400](https://github.com/vatesfr/xen-orchestra/issues/4400) (PR [#4414](https://github.com/vatesfr/xen-orchestra/pull/4414))
- [SDN Controller] Ability to configure MTU for private networks (PR [#4491](https://github.com/vatesfr/xen-orchestra/pull/4491))
- [VM Export] Filenames are now prefixed with datetime [#4503](https://github.com/vatesfr/xen-orchestra/issues/4503)
- [Settings/Logs] Differentiate XS/XCP-ng errors from XO errors [#4101](https://github.com/vatesfr/xen-orchestra/issues/4101) (PR [#4385](https://github.com/vatesfr/xen-orchestra/pull/4385))
- [Backups] Improve performance by caching logs consolidation (PR [#4541](https://github.com/vatesfr/xen-orchestra/pull/4541))
- [New VM] Cloud Init available for all plans (PR [#4543](https://github.com/vatesfr/xen-orchestra/pull/4543))
- [Servers] IPv6 addresses can be used [#4520](https://github.com/vatesfr/xen-orchestra/issues/4520) (PR [#4521](https://github.com/vatesfr/xen-orchestra/pull/4521)) \
  Note: They must enclosed in brackets to differentiate with the port, e.g.: `[2001:db8::7334]` or `[ 2001:db8::7334]:4343`

### Bug fixes

- [PBD] Obfuscate cifs password from device config [#4384](https://github.com/vatesfr/xen-orchestra/issues/4384) (PR [#4401](https://github.com/vatesfr/xen-orchestra/pull/4401))
- [XOSAN] Fix "invalid parameters" error on creating a SR (PR [#4478](https://github.com/vatesfr/xen-orchestra/pull/4478))
- [Patching] Avoid overloading XCP-ng by reducing the frequency of yum update checks [#4358](https://github.com/vatesfr/xen-orchestra/issues/4358) (PR [#4477](https://github.com/vatesfr/xen-orchestra/pull/4477))
- [Network] Fix inability to create a bonded network (PR [#4489](https://github.com/vatesfr/xen-orchestra/pull/4489))
- [Backup restore & Replication] Don't copy `sm_config` to new VDIs which might leads to useless coalesces [#4482](https://github.com/vatesfr/xen-orchestra/issues/4482) (PR [#4484](https://github.com/vatesfr/xen-orchestra/pull/4484))
- [Home] Fix intermediary "no results" display showed on filtering items [#4420](https://github.com/vatesfr/xen-orchestra/issues/4420) (PR [#4456](https://github.com/vatesfr/xen-orchestra/pull/4456)
- [Backup NG/New schedule] Properly show user errors in the form [#3831](https://github.com/vatesfr/xen-orchestra/issues/3831) (PR [#4131](https://github.com/vatesfr/xen-orchestra/pull/4131))
- [VM/Advanced] Fix `"vm.set_domain_type" is not a function` error on switching virtualization mode (PV/HVM) [#4348](https://github.com/vatesfr/xen-orchestra/issues/4348) (PR [#4504](https://github.com/vatesfr/xen-orchestra/pull/4504))
- [Backup NG/logs] Show warning when zstd compression is selected but not supported [#3892](https://github.com/vatesfr/xen-orchestra/issues/3892) (PR [#4375](https://github.com/vatesfr/xen-orchestra/pull/4375)
- [Patches] Fix patches installation for CH 8.0 (PR [#4511](https://github.com/vatesfr/xen-orchestra/pull/4511))
- [Network] Fix inability to set a network name [#4514](https://github.com/vatesfr/xen-orchestra/issues/4514) (PR [4510](https://github.com/vatesfr/xen-orchestra/pull/4510))
- [Backup NG] Fix race conditions that could lead to disabled jobs still running (PR [4510](https://github.com/vatesfr/xen-orchestra/pull/4510))
- [XOA] Remove "Updates" and "Licenses" tabs for non admin users (PR [#4526](https://github.com/vatesfr/xen-orchestra/pull/4526))
- [New VM] Ability to escape [cloud config template](https://xen-orchestra.com/blog/xen-orchestra-5-21/#cloudconfigtemplates) variables [#4486](https://github.com/vatesfr/xen-orchestra/issues/4486) (PR [#4501](https://github.com/vatesfr/xen-orchestra/pull/4501))
- [Backup NG] Properly log and report if job is already running [#4497](https://github.com/vatesfr/xen-orchestra/issues/4497) (PR [4534](https://github.com/vatesfr/xen-orchestra/pull/4534))
- [Host] Fix an issue where host was wrongly reporting time inconsistency (PR [#4540](https://github.com/vatesfr/xen-orchestra/pull/4540))

### Released packages

- xen-api v0.27.2
- xo-server-cloud v0.3.0
- @xen-orchestra/cron v1.0.4
- xo-server-sdn-controller v0.3.0
- @xen-orchestra/template v0.1.0
- xo-server v5.50.1
- xo-web v5.50.2

## **5.38.0** (2019-08-29)

### Enhancements

- [VM/Attach disk] Display confirmation modal when VDI is already attached [#3381](https://github.com/vatesfr/xen-orchestra/issues/3381) (PR [#4366](https://github.com/vatesfr/xen-orchestra/pull/4366))
- [Zstd]
  - [VM/copy, VM/export] Only show zstd option when it's supported [#3892](https://github.com/vatesfr/xen-orchestra/issues/3892) (PRs [#4326](https://github.com/vatesfr/xen-orchestra/pull/4326) [#4368](https://github.com/vatesfr/xen-orchestra/pull/4368))
  - [VM/Bulk copy] Show warning if zstd compression is not supported on a VM [#3892](https://github.com/vatesfr/xen-orchestra/issues/3892) (PR [#4346](https://github.com/vatesfr/xen-orchestra/pull/4346))
- [VM import & Continuous Replication] Enable `guessVhdSizeOnImport` by default, this fix some `VDI_IO_ERROR` with XenServer 7.1 and XCP-ng 8.0 (PR [#4436](https://github.com/vatesfr/xen-orchestra/pull/4436))
- [SDN Controller] Add possibility to create multiple GRE networks and VxLAN networks within a same pool (PR [#4435](https://github.com/vatesfr/xen-orchestra/pull/4435))
- [SDN Controller] Add possibility to create cross-pool private networks (PR [#4405](https://github.com/vatesfr/xen-orchestra/pull/4405))

### Bug fixes

- [SR/General] Display VDI VM name in SR usage graph (PR [#4370](https://github.com/vatesfr/xen-orchestra/pull/4370))
- [VM/Attach disk] Fix checking VDI mode (PR [#4373](https://github.com/vatesfr/xen-orchestra/pull/4373))
- [VM revert] Snapshot before: add admin ACLs on created snapshot [#4331](https://github.com/vatesfr/xen-orchestra/issues/4331) (PR [#4391](https://github.com/vatesfr/xen-orchestra/pull/4391))
- [Network] Fixed "invalid parameters" error when creating bonded network [#4425](https://github.com/vatesfr/xen-orchestra/issues/4425) (PR [#4429](https://github.com/vatesfr/xen-orchestra/pull/4429))

### Released packages

- xo-server-sdn-controller v0.2.0
- xo-server-usage-report v0.7.3
- xo-server v5.48.0
- xo-web v5.48.1

## **5.37.1** (2019-08-06)

### Enhancements

- [SDN Controller] Let the user choose on which PIF to create a private network (PR [#4379](https://github.com/vatesfr/xen-orchestra/pull/4379))

### Bug fixes

- [SDN Controller] Better detect host shutting down to adapt network topology (PR [#4314](https://github.com/vatesfr/xen-orchestra/pull/4314))
- [SDN Controller] Add new hosts to pool's private networks (PR [#4382](https://github.com/vatesfr/xen-orchestra/pull/4382))

### Released packages

- xo-server-sdn-controller v0.1.2

## **5.37.0** (2019-07-25)

### Highlights

- [Pool] Ability to add multiple hosts on the pool [#2402](https://github.com/vatesfr/xen-orchestra/issues/2402) (PR [#3716](https://github.com/vatesfr/xen-orchestra/pull/3716))
- [SR/General] Improve SR usage graph [#3608](https://github.com/vatesfr/xen-orchestra/issues/3608) (PR [#3830](https://github.com/vatesfr/xen-orchestra/pull/3830))
- [VM] Permission to revert to any snapshot for VM operators [#3928](https://github.com/vatesfr/xen-orchestra/issues/3928) (PR [#4247](https://github.com/vatesfr/xen-orchestra/pull/4247))
- [Backup NG] Ability to bypass unhealthy VDI chains check [#4324](https://github.com/vatesfr/xen-orchestra/issues/4324) (PR [#4340](https://github.com/vatesfr/xen-orchestra/pull/4340))
- [VM/console] Multiline copy/pasting [#4261](https://github.com/vatesfr/xen-orchestra/issues/4261) (PR [#4341](https://github.com/vatesfr/xen-orchestra/pull/4341))

### Enhancements

- [Stats] Ability to display last day stats [#4160](https://github.com/vatesfr/xen-orchestra/issues/4160) (PR [#4168](https://github.com/vatesfr/xen-orchestra/pull/4168))
- [Settings/servers] Display servers connection issues [#4300](https://github.com/vatesfr/xen-orchestra/issues/4300) (PR [#4310](https://github.com/vatesfr/xen-orchestra/pull/4310))
- [VM] Show current operations and progress [#3811](https://github.com/vatesfr/xen-orchestra/issues/3811) (PR [#3982](https://github.com/vatesfr/xen-orchestra/pull/3982))
- [Backup NG/New] Generate default schedule if no schedule is specified [#4036](https://github.com/vatesfr/xen-orchestra/issues/4036) (PR [#4183](https://github.com/vatesfr/xen-orchestra/pull/4183))
- [Host/Advanced] Ability to edit iSCSI IQN [#4048](https://github.com/vatesfr/xen-orchestra/issues/4048) (PR [#4208](https://github.com/vatesfr/xen-orchestra/pull/4208))
- [VM,host] Improved state icons/pills (colors and tooltips) (PR [#4363](https://github.com/vatesfr/xen-orchestra/pull/4363))

### Bug fixes

- [Settings/Servers] Fix read-only setting toggling
- [SDN Controller] Do not choose physical PIF without IP configuration for tunnels. (PR [#4319](https://github.com/vatesfr/xen-orchestra/pull/4319))
- [Xen servers] Fix `no connection found for object` error if pool master is reinstalled [#4299](https://github.com/vatesfr/xen-orchestra/issues/4299) (PR [#4302](https://github.com/vatesfr/xen-orchestra/pull/4302))
- [Backup-ng/restore] Display correct size for full VM backup [#4316](https://github.com/vatesfr/xen-orchestra/issues/4316) (PR [#4332](https://github.com/vatesfr/xen-orchestra/pull/4332))
- [VM/tab-advanced] Fix CPU limits edition (PR [#4337](https://github.com/vatesfr/xen-orchestra/pull/4337))
- [Remotes] Fix `EIO` errors due to massive parallel fs operations [#4323](https://github.com/vatesfr/xen-orchestra/issues/4323) (PR [#4330](https://github.com/vatesfr/xen-orchestra/pull/4330))
- [VM/Advanced] Fix virtualization mode switch (PV/HVM) (PR [#4349](https://github.com/vatesfr/xen-orchestra/pull/4349))
- [Task] fix hidden notification by search field [#3874](https://github.com/vatesfr/xen-orchestra/issues/3874) (PR [#4305](https://github.com/vatesfr/xen-orchestra/pull/4305)
- [VM] Fail to change affinity (PR [#4361](https://github.com/vatesfr/xen-orchestra/pull/4361)
- [VM] Number of CPUs not correctly changed on running VMs (PR [#4360](https://github.com/vatesfr/xen-orchestra/pull/4360)

### Released packages

- @xen-orchestra/fs v0.10.1
- xo-server-sdn-controller v0.1.1
- xen-api v0.27.1
- xo-server v5.46.0
- xo-web v5.46.0

## **5.36.0** (2019-06-27)

### Highlights

- [SR/new] Create ZFS storage [#4260](https://github.com/vatesfr/xen-orchestra/issues/4260) (PR [#4266](https://github.com/vatesfr/xen-orchestra/pull/4266))
- [Host/advanced] Fix host CPU hyperthreading detection [#4262](https://github.com/vatesfr/xen-orchestra/issues/4262) (PR [#4285](https://github.com/vatesfr/xen-orchestra/pull/4285))
- [VM/Advanced] Ability to use UEFI instead of BIOS [#4264](https://github.com/vatesfr/xen-orchestra/issues/4264) (PR [#4268](https://github.com/vatesfr/xen-orchestra/pull/4268))
- [Backup-ng/restore] Display size for full VM backup [#4009](https://github.com/vatesfr/xen-orchestra/issues/4009) (PR [#4245](https://github.com/vatesfr/xen-orchestra/pull/4245))
- [Sr/new] Ability to select NFS version when creating NFS storage [#3951](https://github.com/vatesfr/xen-orchestra/issues/3951) (PR [#4277](https://github.com/vatesfr/xen-orchestra/pull/4277))
- [Host/storages, SR/hosts] Display PBD details [#4264](https://github.com/vatesfr/xen-orchestra/issues/4161) (PR [#4268](https://github.com/vatesfr/xen-orchestra/pull/4284))
- [auth-saml] Improve compatibility with Microsoft Azure Active Directory (PR [#4294](https://github.com/vatesfr/xen-orchestra/pull/4294))

### Enhancements

- [Host] Display warning when "Citrix Hypervisor" license has restrictions [#4251](https://github.com/vatesfr/xen-orchestra/issues/4164) (PR [#4235](https://github.com/vatesfr/xen-orchestra/pull/4279))
- [VM/Backup] Create backup bulk action [#2573](https://github.com/vatesfr/xen-orchestra/issues/2573) (PR [#4257](https://github.com/vatesfr/xen-orchestra/pull/4257))
- [Host] Display warning when host's time differs too much from XOA's time [#4113](https://github.com/vatesfr/xen-orchestra/issues/4113) (PR [#4173](https://github.com/vatesfr/xen-orchestra/pull/4173))
- [VM/network] Display and set bandwidth rate-limit of a VIF [#4215](https://github.com/vatesfr/xen-orchestra/issues/4215) (PR [#4293](https://github.com/vatesfr/xen-orchestra/pull/4293))
- [SDN Controller] New plugin which enables creating pool-wide private networks [xcp-ng/xcp#175](https://github.com/xcp-ng/xcp/issues/175) (PR [#4269](https://github.com/vatesfr/xen-orchestra/pull/4269))

### Bug fixes

- [XOA] Don't require editing the _email_ field in case of re-registration (PR [#4259](https://github.com/vatesfr/xen-orchestra/pull/4259))
- [Metadata backup] Missing XAPIs should trigger a failure job [#4281](https://github.com/vatesfr/xen-orchestra/issues/4281) (PR [#4283](https://github.com/vatesfr/xen-orchestra/pull/4283))
- [iSCSI] Fix fibre channel paths display [#4291](https://github.com/vatesfr/xen-orchestra/issues/4291) (PR [#4303](https://github.com/vatesfr/xen-orchestra/pull/4303))
- [New VM] Fix tooltips not displayed on disabled elements in some browsers (e.g. Google Chrome) [#4304](https://github.com/vatesfr/xen-orchestra/issues/4304) (PR [#4309](https://github.com/vatesfr/xen-orchestra/pull/4309))

### Released packages

- xo-server-auth-ldap v0.6.5
- xen-api v0.26.0
- xo-server-sdn-controller v0.1
- xo-server-auth-saml v0.6.0
- xo-server-backup-reports v0.16.2
- xo-server v5.44.0
- xo-web v5.44.0

## **5.35.0** (2019-05-29)

### Enhancements

- [VM/general] Display 'Started... ago' instead of 'Halted... ago' for paused state [#3750](https://github.com/vatesfr/xen-orchestra/issues/3750) (PR [#4170](https://github.com/vatesfr/xen-orchestra/pull/4170))
- [Metadata backup] Ability to define when the backup report will be sent (PR [#4149](https://github.com/vatesfr/xen-orchestra/pull/4149))
- [XOA/Update] Ability to select release channel [#4200](https://github.com/vatesfr/xen-orchestra/issues/4200) (PR [#4202](https://github.com/vatesfr/xen-orchestra/pull/4202))
- [User] Forget connection tokens on password change or on demand [#4214](https://github.com/vatesfr/xen-orchestra/issues/4214) (PR [#4224](https://github.com/vatesfr/xen-orchestra/pull/4224))
- [Settings/Logs] LICENCE_RESTRICTION errors: suggest XCP-ng as an Open Source alternative [#3876](https://github.com/vatesfr/xen-orchestra/issues/3876) (PR [#4238](https://github.com/vatesfr/xen-orchestra/pull/4238))
- [VM/Migrate] Display VDI size on migrate modal [#2534](https://github.com/vatesfr/xen-orchestra/issues/2534) (PR [#4250](https://github.com/vatesfr/xen-orchestra/pull/4250))
- [Host] Display hyperthreading status on advanced tab [#4262](https://github.com/vatesfr/xen-orchestra/issues/4262) (PR [#4263](https://github.com/vatesfr/xen-orchestra/pull/4263))

### Bug fixes

- [Pool/Patches] Fix "an error has occurred" in "Applied patches" [#4192](https://github.com/vatesfr/xen-orchestra/issues/4192) (PR [#4193](https://github.com/vatesfr/xen-orchestra/pull/4193))
- [Backup NG] Fix report sent even though "Never" is selected [#4092](https://github.com/vatesfr/xen-orchestra/issues/4092) (PR [#4178](https://github.com/vatesfr/xen-orchestra/pull/4178))
- [Remotes] Fix issues after a config import (PR [#4197](https://github.com/vatesfr/xen-orchestra/pull/4197))
- [Charts] Fixed the chart lines sometimes changing order/color (PR [#4221](https://github.com/vatesfr/xen-orchestra/pull/4221))
- Prevent non-admin users to access admin pages with URL (PR [#4220](https://github.com/vatesfr/xen-orchestra/pull/4220))
- [Upgrade] Fix alert before upgrade while running backup jobs [#4164](https://github.com/vatesfr/xen-orchestra/issues/4164) (PR [#4235](https://github.com/vatesfr/xen-orchestra/pull/4235))
- [Import] Fix import OVA files (PR [#4232](https://github.com/vatesfr/xen-orchestra/pull/4232))
- [VM/network] Fix duplicate IPv4 (PR [#4239](https://github.com/vatesfr/xen-orchestra/pull/4239))
- [Remotes] Fix disconnected remotes which may appear to work
- [Host] Fix incorrect hypervisor name [#4246](https://github.com/vatesfr/xen-orchestra/issues/4246) (PR [#4248](https://github.com/vatesfr/xen-orchestra/pull/4248))

### Released packages

- xo-server-backup-reports v0.16.1
- @xen-orchestra/fs v0.9.0
- vhd-lib v0.7.0
- xo-server v5.42.1
- xo-web v5.42.1

## **5.34.0** (2019-04-30)

### Highlights

- [Self/New VM] Add network config box to custom cloud-init [#3872](https://github.com/vatesfr/xen-orchestra/issues/3872) (PR [#4150](https://github.com/vatesfr/xen-orchestra/pull/4150))
- [Metadata backup] Detailed logs [#4005](https://github.com/vatesfr/xen-orchestra/issues/4005) (PR [#4014](https://github.com/vatesfr/xen-orchestra/pull/4014))
- [Backup reports] Support metadata backups (PR [#4084](https://github.com/vatesfr/xen-orchestra/pull/4084))
- [VM migration] Auto select default SR and collapse optional actions [#3326](https://github.com/vatesfr/xen-orchestra/issues/3326) (PR [#4121](https://github.com/vatesfr/xen-orchestra/pull/4121))
- Unlock basic stats on all editions [#4166](https://github.com/vatesfr/xen-orchestra/issues/4166) (PR [#4172](https://github.com/vatesfr/xen-orchestra/pull/4172))

### Enhancements

- [Settings/remotes] Expose mount options field for SMB [#4063](https://github.com/vatesfr/xen-orchestra/issues/4063) (PR [#4067](https://github.com/vatesfr/xen-orchestra/pull/4067))
- [Backup/Schedule] Add warning regarding DST when you add a schedule [#4042](https://github.com/vatesfr/xen-orchestra/issues/4042) (PR [#4056](https://github.com/vatesfr/xen-orchestra/pull/4056))
- [Import] Avoid blocking the UI when dropping a big OVA file on the UI (PR [#4018](https://github.com/vatesfr/xen-orchestra/pull/4018))
- [Backup NG/Overview] Make backup list title clearer [#4111](https://github.com/vatesfr/xen-orchestra/issues/4111) (PR [#4129](https://github.com/vatesfr/xen-orchestra/pull/4129))
- [Dashboard] Hide "Report" section for non-admins [#4123](https://github.com/vatesfr/xen-orchestra/issues/4123) (PR [#4126](https://github.com/vatesfr/xen-orchestra/pull/4126))
- [Self/New VM] Display confirmation modal when user will use a large amount of resources [#4044](https://github.com/vatesfr/xen-orchestra/issues/4044) (PR [#4127](https://github.com/vatesfr/xen-orchestra/pull/4127))
- [VDI migration, New disk] Warning when SR host is different from the other disks [#3911](https://github.com/vatesfr/xen-orchestra/issues/3911) (PR [#4035](https://github.com/vatesfr/xen-orchestra/pull/4035))
- [Attach disk] Display warning message when VDI SR is on different host from the other disks [#3911](https://github.com/vatesfr/xen-orchestra/issues/3911) (PR [#4117](https://github.com/vatesfr/xen-orchestra/pull/4117))
- [Editable] Notify user when editable undo fails [#3799](https://github.com/vatesfr/xen-orchestra/issues/3799) (PR [#4150](https://github.com/vatesfr/xen-orchestra/pull/4157))
- [XO] Add banner for sources users to clarify support conditions [#4165](https://github.com/vatesfr/xen-orchestra/issues/4165) (PR [#4167](https://github.com/vatesfr/xen-orchestra/pull/4167))

### Bug fixes

- [Continuous Replication] Fix VHD size guess for empty files [#4105](https://github.com/vatesfr/xen-orchestra/issues/4105) (PR [#4107](https://github.com/vatesfr/xen-orchestra/pull/4107))
- [Backup NG] Only display full backup interval in case of a delta backup (PR [#4125](https://github.com/vatesfr/xen-orchestra/pull/4107))
- [Dashboard/Health] fix 'an error has occurred' on the storage state table [#4128](https://github.com/vatesfr/xen-orchestra/issues/4128) (PR [#4132](https://github.com/vatesfr/xen-orchestra/pull/4132))
- [Menu] XOA: Fixed empty slot when menu is collapsed [#4012](https://github.com/vatesfr/xen-orchestra/issues/4012) (PR [#4068](https://github.com/vatesfr/xen-orchestra/pull/4068)
- [Self/New VM] Fix missing templates when refreshing page [#3265](https://github.com/vatesfr/xen-orchestra/issues/3265) (PR [#3565](https://github.com/vatesfr/xen-orchestra/pull/3565))
- [Home] No more false positives when select Tag on Home page [#4087](https://github.com/vatesfr/xen-orchestra/issues/4087) (PR [#4112](https://github.com/vatesfr/xen-orchestra/pull/4112))

### Released packages

- xo-server-backup-reports v0.16.0
- complex-matcher v0.6.0
- xo-vmdk-to-vhd v0.1.7
- vhd-lib v0.6.1
- xo-server v5.40.0
- xo-web v5.40.1

## **5.33.1** (2019-04-04)

### Bug fix

- Fix major memory leak [2563be4](https://github.com/vatesfr/xen-orchestra/commit/2563be472bfd84c6ed867efd21c4aeeb824d387f)

### Released packages

- xen-api v0.25.1
- xo-server v5.38.2

## **5.33.0** (2019-03-29)

### Enhancements

- [SR/Disk] Disable actions on unmanaged VDIs [#3988](https://github.com/vatesfr/xen-orchestra/issues/3988) (PR [#4000](https://github.com/vatesfr/xen-orchestra/pull/4000))
- [Pool] Specify automatic networks on a Pool [#3916](https://github.com/vatesfr/xen-orchestra/issues/3916) (PR [#3958](https://github.com/vatesfr/xen-orchestra/pull/3958))
- [VM/advanced] Manage start delay for VM [#3909](https://github.com/vatesfr/xen-orchestra/issues/3909) (PR [#4002](https://github.com/vatesfr/xen-orchestra/pull/4002))
- [New/Vm] SR section: Display warning message when the selected SRs aren't in the same host [#3911](https://github.com/vatesfr/xen-orchestra/issues/3911) (PR [#3967](https://github.com/vatesfr/xen-orchestra/pull/3967))
- Enable compression for HTTP requests (and initial objects fetch)
- [VDI migration] Display same-pool SRs first in the selector [#3945](https://github.com/vatesfr/xen-orchestra/issues/3945) (PR [#3996](https://github.com/vatesfr/xen-orchestra/pull/3996))
- [Home] Save the current page in url [#3993](https://github.com/vatesfr/xen-orchestra/issues/3993) (PR [#3999](https://github.com/vatesfr/xen-orchestra/pull/3999))
- [VDI] Ensure suspend VDI is destroyed when destroying a VM [#4027](https://github.com/vatesfr/xen-orchestra/issues/4027) (PR [#4038](https://github.com/vatesfr/xen-orchestra/pull/4038))
- [VM/disk]: Warning when 2 VDIs are on 2 different hosts' local SRs [#3911](https://github.com/vatesfr/xen-orchestra/issues/3911) (PR [#3969](https://github.com/vatesfr/xen-orchestra/pull/3969))
- [Remotes] Benchmarks (read and write rate speed) added when remote is tested [#3991](https://github.com/vatesfr/xen-orchestra/issues/3991) (PR [#4015](https://github.com/vatesfr/xen-orchestra/pull/4015))
- [Cloud Config] Support both NoCloud and Config Drive 2 datasources for maximum compatibility (PR [#4053](https://github.com/vatesfr/xen-orchestra/pull/4053))
- [Advanced] Configurable cookie validity (PR [#4059](https://github.com/vatesfr/xen-orchestra/pull/4059))
- [Plugins] Display number of installed plugins [#4008](https://github.com/vatesfr/xen-orchestra/issues/4008) (PR [#4050](https://github.com/vatesfr/xen-orchestra/pull/4050))
- [Continuous Replication] Opt-in mode to guess VHD size, should help with XenServer 7.1 CU2 and various `VDI_IO_ERROR` errors (PR [#3726](https://github.com/vatesfr/xen-orchestra/pull/3726))
- [VM/Snapshots] Always delete broken quiesced snapshots [#4074](https://github.com/vatesfr/xen-orchestra/issues/4074) (PR [#4075](https://github.com/vatesfr/xen-orchestra/pull/4075))
- [Settings/Servers] Display link to pool [#4041](https://github.com/vatesfr/xen-orchestra/issues/4041) (PR [#4045](https://github.com/vatesfr/xen-orchestra/pull/4045))
- [Import] Change wording of drop zone (PR [#4020](https://github.com/vatesfr/xen-orchestra/pull/4020))
- [Backup NG] Ability to set the interval of the full backups [#1783](https://github.com/vatesfr/xen-orchestra/issues/1783) (PR [#4083](https://github.com/vatesfr/xen-orchestra/pull/4083))
- [Hosts] Display a warning icon if you have XenServer license restrictions [#4091](https://github.com/vatesfr/xen-orchestra/issues/4091) (PR [#4094](https://github.com/vatesfr/xen-orchestra/pull/4094))
- [Restore] Ability to restore a metadata backup [#4004](https://github.com/vatesfr/xen-orchestra/issues/4004) (PR [#4023](https://github.com/vatesfr/xen-orchestra/pull/4023))
- Improve connection to XCP-ng/XenServer hosts:
  - never disconnect by itself even in case of errors
  - never stop watching events

### Bug fixes

- [New network] PIF was wrongly required which prevented from creating a private network (PR [#4010](https://github.com/vatesfr/xen-orchestra/pull/4010))
- [Google authentication] Migrate to new endpoint
- [Backup NG] Better handling of huge logs [#4025](https://github.com/vatesfr/xen-orchestra/issues/4025) (PR [#4026](https://github.com/vatesfr/xen-orchestra/pull/4026))
- [Home/VM] Bulk migration: fixed VM VDIs not migrated to the selected SR [#3986](https://github.com/vatesfr/xen-orchestra/issues/3986) (PR [#3987](https://github.com/vatesfr/xen-orchestra/pull/3987))
- [Stats] Fix cache usage with simultaneous requests [#4017](https://github.com/vatesfr/xen-orchestra/issues/4017) (PR [#4028](https://github.com/vatesfr/xen-orchestra/pull/4028))
- [Backup NG] Fix compression displayed for the wrong backup mode (PR [#4021](https://github.com/vatesfr/xen-orchestra/pull/4021))
- [Home] Always sort the items by their names as a secondary sort criteria [#3983](https://github.com/vatesfr/xen-orchestra/issues/3983) (PR [#4047](https://github.com/vatesfr/xen-orchestra/pull/4047))
- [Remotes] Fixes `spawn mount EMFILE` error during backup
- Properly redirect to sign in page instead of being stuck in a refresh loop
- [Backup-ng] No more false positives when list matching VMs on Home page [#4078](https://github.com/vatesfr/xen-orchestra/issues/4078) (PR [#4085](https://github.com/vatesfr/xen-orchestra/pull/4085))
- [Plugins] Properly remove optional settings when unchecking _Fill information_ (PR [#4076](https://github.com/vatesfr/xen-orchestra/pull/4076))
- [Patches] (PR [#4077](https://github.com/vatesfr/xen-orchestra/pull/4077))
  - Add a host to a pool: fixes the auto-patching of the host on XenServer < 7.2 [#3783](https://github.com/vatesfr/xen-orchestra/issues/3783)
  - Add a host to a pool: homogenizes both the host and **pool**'s patches [#2188](https://github.com/vatesfr/xen-orchestra/issues/2188)
  - Safely install a subset of patches on a pool [#3777](https://github.com/vatesfr/xen-orchestra/issues/3777)
  - XCP-ng: no longer requires to run `yum install xcp-ng-updater` when it's already installed [#3934](https://github.com/vatesfr/xen-orchestra/issues/3934)

### Released packages

- xen-api v0.25.0
- vhd-lib v0.6.0
- @xen-orchestra/fs v0.8.0
- xo-server-usage-report v0.7.2
- xo-server v5.38.1
- xo-web v5.38.0

## **5.32.2** (2019-02-28)

### Bug fixes

- Fix XAPI events monitoring on old version (XenServer 7.2)

## **5.32.1** (2019-02-28)

### Bug fixes

- Fix a very short timeout in the monitoring of XAPI events which may lead to unresponsive XenServer hosts

## **5.32.0** (2019-02-28)

### Enhancements

- [VM migration] Display same-pool hosts first in the selector [#3262](https://github.com/vatesfr/xen-orchestra/issues/3262) (PR [#3890](https://github.com/vatesfr/xen-orchestra/pull/3890))
- [Home/VM] Sort VM by start time [#3955](https://github.com/vatesfr/xen-orchestra/issues/3955) (PR [#3970](https://github.com/vatesfr/xen-orchestra/pull/3970))
- [Editable fields] Unfocusing (clicking outside) submits the change instead of canceling (PR [#3980](https://github.com/vatesfr/xen-orchestra/pull/3980))
- [Network] Dedicated page for network creation [#3895](https://github.com/vatesfr/xen-orchestra/issues/3895) (PR [#3906](https://github.com/vatesfr/xen-orchestra/pull/3906))
- [Logs] Add button to download the log [#3957](https://github.com/vatesfr/xen-orchestra/issues/3957) (PR [#3985](https://github.com/vatesfr/xen-orchestra/pull/3985))
- [Continuous Replication] Share full copy between schedules [#3973](https://github.com/vatesfr/xen-orchestra/issues/3973) (PR [#3995](https://github.com/vatesfr/xen-orchestra/pull/3995))
- [Backup] Ability to backup XO configuration and pool metadata [#808](https://github.com/vatesfr/xen-orchestra/issues/808) [#3501](https://github.com/vatesfr/xen-orchestra/issues/3501) (PR [#3912](https://github.com/vatesfr/xen-orchestra/pull/3912))

### Bug fixes

- [Host] Fix multipathing status for XenServer < 7.5 [#3956](https://github.com/vatesfr/xen-orchestra/issues/3956) (PR [#3961](https://github.com/vatesfr/xen-orchestra/pull/3961))
- [Home/VM] Show creation date of the VM on if it available [#3953](https://github.com/vatesfr/xen-orchestra/issues/3953) (PR [#3959](https://github.com/vatesfr/xen-orchestra/pull/3959))
- [Notifications] Fix invalid notifications when not registered (PR [#3966](https://github.com/vatesfr/xen-orchestra/pull/3966))
- [Import] Fix import of some OVA files [#3962](https://github.com/vatesfr/xen-orchestra/issues/3962) (PR [#3974](https://github.com/vatesfr/xen-orchestra/pull/3974))
- [Servers] Fix _already connected error_ after a server has been removed during connection [#3976](https://github.com/vatesfr/xen-orchestra/issues/3976) (PR [#3977](https://github.com/vatesfr/xen-orchestra/pull/3977))
- [Backup] Fix random _mount_ issues with NFS/SMB remotes [#3973](https://github.com/vatesfr/xen-orchestra/issues/3973) (PR [#4003](https://github.com/vatesfr/xen-orchestra/pull/4003))

### Released packages

- @xen-orchestra/fs v0.7.0
- xen-api v0.24.3
- xoa-updater v0.15.2
- xo-server v5.36.0
- xo-web v5.36.0

## **5.31.2** (2019-02-08)

### Enhancements

- [Home] Set description on bulk snapshot [#3925](https://github.com/vatesfr/xen-orchestra/issues/3925) (PR [#3933](https://github.com/vatesfr/xen-orchestra/pull/3933))
- Work-around the XenServer issue when `VBD#VDI` is an empty string instead of an opaque reference (PR [#3950](https://github.com/vatesfr/xen-orchestra/pull/3950))
- [VDI migration] Retry when XenServer fails with `TOO_MANY_STORAGE_MIGRATES` (PR [#3940](https://github.com/vatesfr/xen-orchestra/pull/3940))
- [VM]
  - [General] The creation date of the VM is now visible [#3932](https://github.com/vatesfr/xen-orchestra/issues/3932) (PR [#3947](https://github.com/vatesfr/xen-orchestra/pull/3947))
  - [Disks] Display device name [#3902](https://github.com/vatesfr/xen-orchestra/issues/3902) (PR [#3946](https://github.com/vatesfr/xen-orchestra/pull/3946))
- [VM Snapshotting]
  - Detect and destroy broken quiesced snapshot left by XenServer [#3936](https://github.com/vatesfr/xen-orchestra/issues/3936) (PR [#3937](https://github.com/vatesfr/xen-orchestra/pull/3937))
  - Retry twice after a 1 minute delay if quiesce failed [#3938](https://github.com/vatesfr/xen-orchestra/issues/3938) (PR [#3952](https://github.com/vatesfr/xen-orchestra/pull/3952))

### Bug fixes

- [Import] Fix import of big OVA files
- [Host] Show the host's memory usage instead of the sum of the VMs' memory usage (PR [#3924](https://github.com/vatesfr/xen-orchestra/pull/3924))
- [SAML] Make `AssertionConsumerServiceURL` matches the callback URL
- [Backup NG] Correctly delete broken VHD chains [#3875](https://github.com/vatesfr/xen-orchestra/issues/3875) (PR [#3939](https://github.com/vatesfr/xen-orchestra/pull/3939))
- [Remotes] Don't ignore `mount` options [#3935](https://github.com/vatesfr/xen-orchestra/issues/3935) (PR [#3931](https://github.com/vatesfr/xen-orchestra/pull/3931))

### Released packages

- xen-api v0.24.2
- @xen-orchestra/fs v0.6.1
- xo-server-auth-saml v0.5.3
- xo-server v5.35.0
- xo-web v5.35.0

## **5.31.0** (2019-01-31)

### Enhancements

- [Backup NG] Restore logs moved to restore tab [#3772](https://github.com/vatesfr/xen-orchestra/issues/3772) (PR [#3802](https://github.com/vatesfr/xen-orchestra/pull/3802))
- [Remotes] New SMB implementation that provides better stability and performance [#2257](https://github.com/vatesfr/xen-orchestra/issues/2257) (PR [#3708](https://github.com/vatesfr/xen-orchestra/pull/3708))
- [VM/advanced] ACL management from VM view [#3040](https://github.com/vatesfr/xen-orchestra/issues/3040) (PR [#3774](https://github.com/vatesfr/xen-orchestra/pull/3774))
- [VM / snapshots] Ability to save the VM memory [#3795](https://github.com/vatesfr/xen-orchestra/issues/3795) (PR [#3812](https://github.com/vatesfr/xen-orchestra/pull/3812))
- [Backup NG / Health] Show number of lone snapshots in tab label [#3500](https://github.com/vatesfr/xen-orchestra/issues/3500) (PR [#3824](https://github.com/vatesfr/xen-orchestra/pull/3824))
- [Login] Add autofocus on username input on login page [#3835](https://github.com/vatesfr/xen-orchestra/issues/3835) (PR [#3836](https://github.com/vatesfr/xen-orchestra/pull/3836))
- [Home/VM] Bulk snapshot: specify snapshots' names [#3778](https://github.com/vatesfr/xen-orchestra/issues/3778) (PR [#3787](https://github.com/vatesfr/xen-orchestra/pull/3787))
- [Remotes] Show free space and disk usage on remote [#3055](https://github.com/vatesfr/xen-orchestra/issues/3055) (PR [#3767](https://github.com/vatesfr/xen-orchestra/pull/3767))
- [New SR] Add tooltip for reattach action button [#3845](https://github.com/vatesfr/xen-orchestra/issues/3845) (PR [#3852](https://github.com/vatesfr/xen-orchestra/pull/3852))
- [VM migration] Display hosts' free memory [#3264](https://github.com/vatesfr/xen-orchestra/issues/3264) (PR [#3832](https://github.com/vatesfr/xen-orchestra/pull/3832))
- [Plugins] New field to filter displayed plugins (PR [#3832](https://github.com/vatesfr/xen-orchestra/pull/3871))
- Ability to copy ID of "unknown item"s [#3833](https://github.com/vatesfr/xen-orchestra/issues/3833) (PR [#3856](https://github.com/vatesfr/xen-orchestra/pull/3856))
- [Cloud-Init] switch config drive type to `nocloud` to prepare for the passing of network config (PR [#3877](https://github.com/vatesfr/xen-orchestra/pull/3877))
- [UI] Show pool name next to templates' names [#3894](https://github.com/vatesfr/xen-orchestra/issues/3894) (PR [#3896](https://github.com/vatesfr/xen-orchestra/pull/3896))
- [Backup NG] Support zstd compression for full backups [#3773](https://github.com/vatesfr/xen-orchestra/issues/3773) (PR [#3883](https://github.com/vatesfr/xen-orchestra/pull/3883))
- [VM] Ability to copy a VM with zstd compression [#3773](https://github.com/vatesfr/xen-orchestra/issues/3773) (PR [#3889](https://github.com/vatesfr/xen-orchestra/pull/3889))
- [VM & Host] "Pool > Host" breadcrumb at the top of the page (PR [#3898](https://github.com/vatesfr/xen-orchestra/pull/3898))
- [Hosts] Ability to enable/disable host multipathing [#3659](https://github.com/vatesfr/xen-orchestra/issues/3659) (PR [#3865](https://github.com/vatesfr/xen-orchestra/pull/3865))
- [Login] Add OTP authentication [#2044](https://github.com/vatesfr/xen-orchestra/issues/2044) (PR [#3879](https://github.com/vatesfr/xen-orchestra/pull/3879))
- [Notifications] New notification page to provide important information about XOA (PR [#3904](https://github.com/vatesfr/xen-orchestra/pull/3904))
- [VM] Ability to export a VM with zstd compression [#3773](https://github.com/vatesfr/xen-orchestra/issues/3773) (PR [#3891](https://github.com/vatesfr/xen-orchestra/pull/3891))
- [Host/network] Display PIF speed [#3887](https://github.com/vatesfr/xen-orchestra/issues/3887) (PR [#3901](https://github.com/vatesfr/xen-orchestra/pull/3901))
- [SR] Display iscsi paths and mark the SR with a yellow dot if one path is not available. [#3659](https://github.com/vatesfr/xen-orchestra/issues/3659) (PR [#3829](https://github.com/vatesfr/xen-orchestra/pull/3829))
- [UI] Unifies the Signin buttons (PR [#3913](https://github.com/vatesfr/xen-orchestra/pull/3913))
- [Settings/remotes] NFS: display default option on placeholder [#3631](https://github.com/vatesfr/xen-orchestra/issues/3631) (PR [#3921](https://github.com/vatesfr/xen-orchestra/pull/3921))
- [VM/advanced] Ability to pin vCPU to physical cores [#3241](https://github.com/vatesfr/xen-orchestra/issues/3241) (PR [#3254](https://github.com/vatesfr/xen-orchestra/pull/3254))

### Bug fixes

- [Self] Display sorted Resource Sets [#3818](https://github.com/vatesfr/xen-orchestra/issues/3818) (PR [#3823](https://github.com/vatesfr/xen-orchestra/pull/3823))
- [Servers] Correctly report connecting status (PR [#3838](https://github.com/vatesfr/xen-orchestra/pull/3838))
- [Servers] Fix cannot reconnect to a server after connection has been lost [#3839](https://github.com/vatesfr/xen-orchestra/issues/3839) (PR [#3841](https://github.com/vatesfr/xen-orchestra/pull/3841))
- [New VM] Fix `NO_HOSTS_AVAILABLE()` error when creating a VM on a local SR from template on another local SR [#3084](https://github.com/vatesfr/xen-orchestra/issues/3084) (PR [#3827](https://github.com/vatesfr/xen-orchestra/pull/3827))
- [Backup NG] Fix typo in the form [#3854](https://github.com/vatesfr/xen-orchestra/issues/3854) (PR [#3855](https://github.com/vatesfr/xen-orchestra/pull/3855))
- [New SR] No warning when creating a NFS SR on a path that is already used as NFS SR [#3844](https://github.com/vatesfr/xen-orchestra/issues/3844) (PR [#3851](https://github.com/vatesfr/xen-orchestra/pull/3851))
- [New SR] No redirection if the SR creation failed or canceled [#3843](https://github.com/vatesfr/xen-orchestra/issues/3843) (PR [#3853](https://github.com/vatesfr/xen-orchestra/pull/3853))
- [Home] Fix two tabs opened by middle click in Firefox [#3450](https://github.com/vatesfr/xen-orchestra/issues/3450) (PR [#3825](https://github.com/vatesfr/xen-orchestra/pull/3825))
- [XOA] Enable downgrade for ending trial (PR [#3867](https://github.com/vatesfr/xen-orchestra/pull/3867))
- [OVA import] allow import of big files [#3468](https://github.com/vatesfr/xen-orchestra/issues/3468) (PR [#3504](https://github.com/vatesfr/xen-orchestra/pull/3504))
- [Backup NG] Smart settings not saved when editing a backup job [#3885](https://github.com/vatesfr/xen-orchestra/issues/3885) (PR [#3886](https://github.com/vatesfr/xen-orchestra/pull/3886))
- [VM/snapshot] New snapshot with memory: fix "invalid parameters" error (PR [#3903](https://github.com/vatesfr/xen-orchestra/pull/3903))
- [VM creation] Broken CloudInit config drive when VM created on local SR
- [Legacy Backup] Fix error when restoring a backup
- [Home] Fix `user.getAll` error when user is not admin [#3573](https://github.com/vatesfr/xen-orchestra/issues/3573) (PR [#3918](https://github.com/vatesfr/xen-orchestra/pull/3918))
- [Backup NG] Fix restore issue when a disk has grown [#3910](https://github.com/vatesfr/xen-orchestra/issues/3910) (PR [#3920](https://github.com/vatesfr/xen-orchestra/pull/3920))
- [Backup NG] Delete _importing_ VMs due to interrupted CR/DR (PR [#3923](https://github.com/vatesfr/xen-orchestra/pull/3923))

### Released packages

- vhd-cli v0.2.0
- @xen-orchestra/fs v0.6.0
- vhd-lib v0.5.1
- xoa-updater v0.15.0
- xen-api v0.24.1
- xo-vmdk-to-vhd v0.1.6
- xo-server v5.34.0
- xo-web v5.34.0

## **5.30.0** (2018-12-20)

### Enhancements

- [Users] Display user groups [#3719](https://github.com/vatesfr/xen-orchestra/issues/3719) (PR [#3740](https://github.com/vatesfr/xen-orchestra/pull/3740))
- [VDI] Display VDI's SR [3021](https://github.com/vatesfr/xen-orchestra/issues/3021) (PR [#3285](https://github.com/vatesfr/xen-orchestra/pull/3285))
- [Health, VM/disks] Display SR's container [#3021](https://github.com/vatesfr/xen-orchestra/issues/3021) (PRs [#3747](https://github.com/vatesfr/xen-orchestra/pull/3747), [#3751](https://github.com/vatesfr/xen-orchestra/pull/3751))
- [Servers] Auto-connect to ejected host [#2238](https://github.com/vatesfr/xen-orchestra/issues/2238) (PR [#3738](https://github.com/vatesfr/xen-orchestra/pull/3738))
- [Backup NG] Add "XOSAN" in excluded tags by default [#2128](https://github.com/vatesfr/xen-orchestra/issues/3563) (PR [#3559](https://github.com/vatesfr/xen-orchestra/pull/3563))
- [VM] add tooltip for VM status icon [#3749](https://github.com/vatesfr/xen-orchestra/issues/3749) (PR [#3765](https://github.com/vatesfr/xen-orchestra/pull/3765))
- [New XOSAN] Improve view and possibility to sort SRs by name/size/free space [#2416](https://github.com/vatesfr/xen-orchestra/issues/2416) (PR [#3691](https://github.com/vatesfr/xen-orchestra/pull/3691))
- [Backup NG] Disable HA on replicated VM (CR, DR) [#2359](https://github.com/vatesfr/xen-orchestra/issues/2359) (PR [#3755](https://github.com/vatesfr/xen-orchestra/pull/3755))
- [Backup NG] Display the last run status for each schedule with the possibility to show the associated log [#3769](https://github.com/vatesfr/xen-orchestra/issues/3769) (PR [#3779](https://github.com/vatesfr/xen-orchestra/pull/3779))
- [Backup NG] Add a link to the documentation [#3789](https://github.com/vatesfr/xen-orchestra/issues/3789) (PR [#3790](https://github.com/vatesfr/xen-orchestra/pull/3790))
- [Backup NG] Ability to copy schedule/job id to the clipboard [#3753](https://github.com/vatesfr/xen-orchestra/issues/3753) (PR [#3791](https://github.com/vatesfr/xen-orchestra/pull/3791))
- [Backup NG / logs] Merge the job log status with the display details button [#3797](https://github.com/vatesfr/xen-orchestra/issues/3797) (PR [#3800](https://github.com/vatesfr/xen-orchestra/pull/3800))
- [XOA] Notification banner when XOA is not registered [#3803](https://github.com/vatesfr/xen-orchestra/issues/3803) (PR [#3808](https://github.com/vatesfr/xen-orchestra/pull/3808))

### Bug fixes

- [Home/SRs] Fixed SR status for non admin users [#2204](https://github.com/vatesfr/xen-orchestra/issues/2204) (PR [#3742](https://github.com/vatesfr/xen-orchestra/pull/3742))
- [Servers] Fix occasional "server's pool already connected" errors when pool is not connected (PR [#3782](https://github.com/vatesfr/xen-orchestra/pull/3782))
- [Self] Fix missing objects when the self service view is the first one to be loaded when opening XO [#2689](https://github.com/vatesfr/xen-orchestra/issues/2689) (PR [#3096](https://github.com/vatesfr/xen-orchestra/pull/3096))

### Released packages

- @xen-orchestra/fs v0.5.0
- xen-api v0.23.0
- xo-acl-resolver v0.4.1
- xo-server v5.32.0
- xo-web v5.32.0

## **5.29.0** (2018-11-29)

### Enhancements

- [Perf alert] Ability to trigger an alarm if a host/VM/SR usage value is below the threshold [#3612](https://github.com/vatesfr/xen-orchestra/issues/3612) (PR [#3675](https://github.com/vatesfr/xen-orchestra/pull/3675))
- [Home/VMs] Display pool's name [#2226](https://github.com/vatesfr/xen-orchestra/issues/2226) (PR [#3709](https://github.com/vatesfr/xen-orchestra/pull/3709))
- [Servers] Prevent new connection if pool is already connected [#2238](https://github.com/vatesfr/xen-orchestra/issues/2238) (PR [#3724](https://github.com/vatesfr/xen-orchestra/pull/3724))
- [VM] Pause (like Suspend but doesn't copy RAM on disk) [#3727](https://github.com/vatesfr/xen-orchestra/issues/3727) (PR [#3731](https://github.com/vatesfr/xen-orchestra/pull/3731))

### Bug fixes

- [Servers] Fix deleting server on joining a pool [#2238](https://github.com/vatesfr/xen-orchestra/issues/2238) (PR [#3728](https://github.com/vatesfr/xen-orchestra/pull/3728))

### Released packages

- xen-api v0.22.0
- xo-server-perf-alert v0.2.0
- xo-server-usage-report v0.7.1
- xo-server v5.31.0
- xo-web v5.31.0

## **5.28.2** (2018-11-16)

### Enhancements

- [VM] Ability to set nested virtualization in settings [#3619](https://github.com/vatesfr/xen-orchestra/issues/3619) (PR [#3625](https://github.com/vatesfr/xen-orchestra/pull/3625))
- [Legacy Backup] Restore and File restore functionalities moved to the Backup NG view [#3499](https://github.com/vatesfr/xen-orchestra/issues/3499) (PR [#3610](https://github.com/vatesfr/xen-orchestra/pull/3610))
- [Backup NG logs] Display warning in case of missing VMs instead of a ghosts VMs tasks (PR [#3647](https://github.com/vatesfr/xen-orchestra/pull/3647))
- [VM] On migration, automatically selects the host and SR when only one is available [#3502](https://github.com/vatesfr/xen-orchestra/issues/3502) (PR [#3654](https://github.com/vatesfr/xen-orchestra/pull/3654))
- [VM] Display VGA and video RAM for PVHVM guests [#3576](https://github.com/vatesfr/xen-orchestra/issues/3576) (PR [#3664](https://github.com/vatesfr/xen-orchestra/pull/3664))
- [Backup NG form] Display a warning to let the user know that the Delta Backup and the Continuous Replication are not supported on XenServer < 6.5 [#3540](https://github.com/vatesfr/xen-orchestra/issues/3540) (PR [#3668](https://github.com/vatesfr/xen-orchestra/pull/3668))
- [Backup NG form] Omit VMs(Simple Backup)/pools(Smart Backup/Resident on) with XenServer < 6.5 from the selection when the Delta Backup mode or the Continuous Replication mode are selected [#3540](https://github.com/vatesfr/xen-orchestra/issues/3540) (PR [#3668](https://github.com/vatesfr/xen-orchestra/pull/3668))
- [VM] Allow to switch the Virtualization mode [#2372](https://github.com/vatesfr/xen-orchestra/issues/2372) (PR [#3669](https://github.com/vatesfr/xen-orchestra/pull/3669))

### Bug fixes

- [Backup ng logs] Fix restarting VMs with concurrency issue [#3603](https://github.com/vatesfr/xen-orchestra/issues/3603) (PR [#3634](https://github.com/vatesfr/xen-orchestra/pull/3634))
- Validate modal containing a confirm text input by pressing the Enter key [#2735](https://github.com/vatesfr/xen-orchestra/issues/2735) (PR [#2890](https://github.com/vatesfr/xen-orchestra/pull/2890))
- [Patches] Bulk install correctly ignores upgrade patches on licensed hosts (PR [#3651](https://github.com/vatesfr/xen-orchestra/pull/3651))
- [Backup NG logs] Handle failed restores (PR [#3648](https://github.com/vatesfr/xen-orchestra/pull/3648))
- [Self/New VM] Incorrect limit computation [#3658](https://github.com/vatesfr/xen-orchestra/issues/3658) (PR [#3666](https://github.com/vatesfr/xen-orchestra/pull/3666))
- [Plugins] Don't expose credentials in config to users (PR [#3671](https://github.com/vatesfr/xen-orchestra/pull/3671))
- [Self/New VM] `not enough … available in the set …` error in some cases (PR [#3667](https://github.com/vatesfr/xen-orchestra/pull/3667))
- [XOSAN] Creation stuck at "Configuring VMs" [#3688](https://github.com/vatesfr/xen-orchestra/issues/3688) (PR [#3689](https://github.com/vatesfr/xen-orchestra/pull/3689))
- [Backup NG] Errors listing backups on SMB remotes with extraneous files (PR [#3685](https://github.com/vatesfr/xen-orchestra/pull/3685))
- [Remotes] Don't expose credentials to users [#3682](https://github.com/vatesfr/xen-orchestra/issues/3682) (PR [#3687](https://github.com/vatesfr/xen-orchestra/pull/3687))
- [VM] Correctly display guest metrics updates (tools, network, etc.) [#3533](https://github.com/vatesfr/xen-orchestra/issues/3533) (PR [#3694](https://github.com/vatesfr/xen-orchestra/pull/3694))
- [VM Templates] Fix deletion [#3498](https://github.com/vatesfr/xen-orchestra/issues/3498) (PR [#3695](https://github.com/vatesfr/xen-orchestra/pull/3695))

### Released packages

- xen-api v0.21.0
- xo-common v0.2.0
- xo-acl-resolver v0.4.0
- xo-server v5.30.1
- xo-web v5.30.0

## **5.28.1** (2018-11-05)

### Enhancements

### Bug fixes

- [Backup NG] Increase timeout in stale remotes detection to limit false positives (PR [#3632](https://github.com/vatesfr/xen-orchestra/pull/3632))
- Fix re-registration issue ([4e35b19ac](https://github.com/vatesfr/xen-orchestra/commit/4e35b19ac56c60f61c0e771cde70a50402797b8a))
- [Backup NG logs] Fix started jobs filter [#3636](https://github.com/vatesfr/xen-orchestra/issues/3636) (PR [#3641](https://github.com/vatesfr/xen-orchestra/pull/3641))
- [New VM] CPU and memory user inputs were ignored since previous release [#3644](https://github.com/vatesfr/xen-orchestra/issues/3644) (PR [#3646](https://github.com/vatesfr/xen-orchestra/pull/3646))

### Released packages

- @xen-orchestra/fs v0.4.1
- xo-server v5.29.4
- xo-web v5.29.3

## **5.28.0** (2018-10-31)

### Enhancements

- [Usage Report] Add IOPS read/write/total per VM [#3309](https://github.com/vatesfr/xen-orchestra/issues/3309) (PR [#3455](https://github.com/vatesfr/xen-orchestra/pull/3455))
- [Self service] Sort resource sets by name (PR [#3507](https://github.com/vatesfr/xen-orchestra/pull/3507))
- [Usage Report] Add top 3 SRs which use the most IOPS read/write/total [#3306](https://github.com/vatesfr/xen-orchestra/issues/3306) (PR [#3508](https://github.com/vatesfr/xen-orchestra/pull/3508))
- [New VM] Display a warning when the memory is below the template memory static min [#3496](https://github.com/vatesfr/xen-orchestra/issues/3496) (PR [#3513](https://github.com/vatesfr/xen-orchestra/pull/3513))
- [Backup NG form] Add link to plugins setting [#3457](https://github.com/vatesfr/xen-orchestra/issues/3457) (PR [#3514](https://github.com/vatesfr/xen-orchestra/pull/3514))
- [Backup reports] Add job and run ID [#3488](https://github.com/vatesfr/xen-orchestra/issues/3488) (PR [#3516](https://github.com/vatesfr/xen-orchestra/pull/3516))
- [Usage Report] Add top 3 VMs which use the most IOPS read/write/total [#3308](https://github.com/vatesfr/xen-orchestra/issues/3308) (PR [#3463](https://github.com/vatesfr/xen-orchestra/pull/3463))
- [Settings/logs] Homogenize action buttons in table and enable bulk deletion [#3179](https://github.com/vatesfr/xen-orchestra/issues/3179) (PR [#3528](https://github.com/vatesfr/xen-orchestra/pull/3528))
- [Settings/acls] Add bulk deletion [#3179](https://github.com/vatesfr/xen-orchestra/issues/3179) (PR [#3536](https://github.com/vatesfr/xen-orchestra/pull/3536))
- [Home] Improve search usage: raw numbers also match in names [#2906](https://github.com/vatesfr/xen-orchestra/issues/2906) (PR [#3552](https://github.com/vatesfr/xen-orchestra/pull/3552))
- [Backup NG] Timeout of a job is now in hours [#3550](https://github.com/vatesfr/xen-orchestra/issues/3550) (PR [#3553](https://github.com/vatesfr/xen-orchestra/pull/3553))
- [Backup NG] Explicit error if a VM is missing [#3434](https://github.com/vatesfr/xen-orchestra/issues/3434) (PR [#3522](https://github.com/vatesfr/xen-orchestra/pull/3522))
- [Backup NG] Show all advanced settings with non-default values in overview [#3549](https://github.com/vatesfr/xen-orchestra/issues/3549) (PR [#3554](https://github.com/vatesfr/xen-orchestra/pull/3554))
- [Backup NG] Collapse advanced settings by default [#3551](https://github.com/vatesfr/xen-orchestra/issues/3551) (PR [#3559](https://github.com/vatesfr/xen-orchestra/pull/3559))
- [Scheduling] Merge selection and interval tabs [#1902](https://github.com/vatesfr/xen-orchestra/issues/1902) (PR [#3519](https://github.com/vatesfr/xen-orchestra/pull/3519))
- [Backup NG/Restore] The backup selector now also shows the job name [#3366](https://github.com/vatesfr/xen-orchestra/issues/3366) (PR [#3564](https://github.com/vatesfr/xen-orchestra/pull/3564))
- Sort buttons by criticality in tables [#3168](https://github.com/vatesfr/xen-orchestra/issues/3168) (PR [#3545](https://github.com/vatesfr/xen-orchestra/pull/3545))
- [Usage Report] Ability to send a daily report [#3544](https://github.com/vatesfr/xen-orchestra/issues/3544) (PR [#3582](https://github.com/vatesfr/xen-orchestra/pull/3582))
- [Backup NG logs] Disable state filters with no entries [#3438](https://github.com/vatesfr/xen-orchestra/issues/3438) (PR [#3442](https://github.com/vatesfr/xen-orchestra/pull/3442))
- [ACLs] Global performance improvement on UI for non-admin users [#3578](https://github.com/vatesfr/xen-orchestra/issues/3578) (PR [#3584](https://github.com/vatesfr/xen-orchestra/pull/3584))
- [Backup NG] Improve the Schedule's view (Replace table by list) [#3491](https://github.com/vatesfr/xen-orchestra/issues/3491) (PR [#3586](https://github.com/vatesfr/xen-orchestra/pull/3586))
- ([Host/Storage], [Sr/hosts]) add bulk deletion [#3179](https://github.com/vatesfr/xen-orchestra/issues/3179) (PR [#3539](https://github.com/vatesfr/xen-orchestra/pull/3539))
- [xo-server] Use @xen-orchestra/log for basic logging [#3555](https://github.com/vatesfr/xen-orchestra/issues/3555) (PR [#3579](https://github.com/vatesfr/xen-orchestra/pull/3579))
- [Backup Report] Log error when job failed [#3458](https://github.com/vatesfr/xen-orchestra/issues/3458) (PR [#3593](https://github.com/vatesfr/xen-orchestra/pull/3593))
- [Backup NG] Display logs for backup restoration [#2511](https://github.com/vatesfr/xen-orchestra/issues/2511) (PR [#3609](https://github.com/vatesfr/xen-orchestra/pull/3609))
- [XOA] Display product version and list of all installed packages [#3560](https://github.com/vatesfr/xen-orchestra/issues/3560) (PR [#3621](https://github.com/vatesfr/xen-orchestra/pull/3621))

### Bug fixes

- [Remotes] Fix removal of broken remotes [#3327](https://github.com/vatesfr/xen-orchestra/issues/3327) (PR [#3521](https://github.com/vatesfr/xen-orchestra/pull/3521))
- [Backups] Fix stuck backups due to broken NFS remotes [#3467](https://github.com/vatesfr/xen-orchestra/issues/3467) (PR [#3534](https://github.com/vatesfr/xen-orchestra/pull/3534))
- [New VM] Fix missing cloud config when creating multiple VMs at once in some cases [#3532](https://github.com/vatesfr/xen-orchestra/issues/3532) (PR [#3535](https://github.com/vatesfr/xen-orchestra/pull/3535))
- [VM] Fix an error when an admin tried to add a disk on a Self VM whose resource set had been deleted [#2814](https://github.com/vatesfr/xen-orchestra/issues/2814) (PR [#3530](https://github.com/vatesfr/xen-orchestra/pull/3530))
- [Self/Create VM] Fix some quotas based on the template instead of the user inputs [#2683](https://github.com/vatesfr/xen-orchestra/issues/2683) (PR [#3546](https://github.com/vatesfr/xen-orchestra/pull/3546))
- [Self] Ignore DR and CR VMs when computing quotas [#3064](https://github.com/vatesfr/xen-orchestra/issues/3064) (PR [#3561](https://github.com/vatesfr/xen-orchestra/pull/3561))
- [Patches] Wrongly requiring to eject CDs from halted VMs and snapshots before installing patches (PR [#3611](https://github.com/vatesfr/xen-orchestra/pull/3611))
- [Jobs] Ensure the scheduling is not interrupted in rare cases (PR [#3617](https://github.com/vatesfr/xen-orchestra/pull/3617))
- [Home] Fix `server.getAll` error at login when user is not admin [#2335](https://github.com/vatesfr/xen-orchestra/issues/2335) (PR [#3613](https://github.com/vatesfr/xen-orchestra/pull/3613))

### Released packages

- xo-server-backup-reports v0.15.0
- xo-common v0.1.2
- @xen-orchestra/log v0.1.0
- @xen-orchestra/fs v0.4.0
- complex-matcher v0.5.0
- vhd-lib v0.4.0
- xen-api v0.20.0
- xo-server-usage-report v0.7.0
- xo-server v5.29.0
- xo-web v5.29.0

## **5.27.2** (2018-10-05)

### Enhancements

- [Host/Networks] Remove "Add network" button [#3386](https://github.com/vatesfr/xen-orchestra/issues/3386) (PR [#3478](https://github.com/vatesfr/xen-orchestra/pull/3478))
- [Host/networks] Private networks table [#3387](https://github.com/vatesfr/xen-orchestra/issues/3387) (PR [#3481](https://github.com/vatesfr/xen-orchestra/pull/3481))
- [Home/pool] Patch count pill now shows the number of unique patches in the pool [#3321](https://github.com/vatesfr/xen-orchestra/issues/3321) (PR [#3483](https://github.com/vatesfr/xen-orchestra/pull/3483))
- [Patches] Pre-install checks to avoid errors [#3252](https://github.com/vatesfr/xen-orchestra/issues/3252) (PR [#3484](https://github.com/vatesfr/xen-orchestra/pull/3484))
- [Vm/Snapshots] Allow VM operators to create snapshots and delete those they created [#3443](https://github.com/vatesfr/xen-orchestra/issues/3443) (PR [#3482](https://github.com/vatesfr/xen-orchestra/pull/3482))
- [VM/clone] Handle ACLs and Self Service [#3139](https://github.com/vatesfr/xen-orchestra/issues/3139) (PR [#3493](https://github.com/vatesfr/xen-orchestra/pull/3493))

### Bug fixes

- [Backup NG] Fix `Cannot read property 'uuid' of undefined` when a disk is removed from a VM to backup (PR [#3479](https://github.com/vatesfr/xen-orchestra/pull/3479))
- [Backup NG] Fix unexpected full after failure, interruption or basic rolling snapshot (PR [#3485](https://github.com/vatesfr/xen-orchestra/pull/3485))
- [Usage report] Display top 3 used SRs instead of top 3 biggest SRs [#3307](https://github.com/vatesfr/xen-orchestra/issues/3307) (PR [#3475](https://github.com/vatesfr/xen-orchestra/pull/3475))

### Released packages

- vhd-lib v0.3.2
- xo-vmdk-to-vhd v0.1.5
- xo-server-usage-report v0.6.0
- xo-acl-resolver v0.3.0
- xo-server v5.28.0
- xo-web v5.28.0

## **5.27.1** (2018-09-28)

### Enhancements

### Bug fixes

- [OVA Import] Allow import of files bigger than 127GB (PR [#3451](https://github.com/vatesfr/xen-orchestra/pull/3451))
- [File restore] Fix a path issue when going back to the parent folder (PR [#3446](https://github.com/vatesfr/xen-orchestra/pull/3446))
- [File restore] Fix a minor issue when showing which selected files are redundant (PR [#3447](https://github.com/vatesfr/xen-orchestra/pull/3447))
- [Memory] Fix a major leak [#2580](https://github.com/vatesfr/xen-orchestra/issues/2580) [#2820](https://github.com/vatesfr/xen-orchestra/issues/2820) (PR [#3453](https://github.com/vatesfr/xen-orchestra/pull/3453))
- [NFS Remotes] Fix `already mounted` race condition [#3380](https://github.com/vatesfr/xen-orchestra/issues/3380) (PR [#3460](https://github.com/vatesfr/xen-orchestra/pull/3460))
- Fix `Cannot read property 'type' of undefined` when deleting a VM (PR [#3465](https://github.com/vatesfr/xen-orchestra/pull/3465))

### Released packages

- @xen-orchestra/fs v0.3.1
- vhd-lib v0.3.1
- xo-vmdk-to-vhd v0.1.4
- xo-server v5.27.2
- xo-web v5.27.1

## **5.27.0** (2018-09-24)

### Enhancements

- [Remotes] Test the remote automatically on changes [#3323](https://github.com/vatesfr/xen-orchestra/issues/3323) (PR [#3397](https://github.com/vatesfr/xen-orchestra/pull/3397))
- [Remotes] Use _WORKGROUP_ as default domain for new SMB remote (PR [#3398](https://github.com/vatesfr/xen-orchestra/pull/3398))
- [Backup NG form] Display a tip to encourage users to create vms on a thin-provisioned storage [#3334](https://github.com/vatesfr/xen-orchestra/issues/3334) (PR [#3402](https://github.com/vatesfr/xen-orchestra/pull/3402))
- [Backup NG form] improve schedule's form [#3138](https://github.com/vatesfr/xen-orchestra/issues/3138) (PR [#3359](https://github.com/vatesfr/xen-orchestra/pull/3359))
- [Backup NG Overview] Display transferred and merged data size for backup jobs [#3340](https://github.com/vatesfr/xen-orchestra/issues/3340) (PR [#3408](https://github.com/vatesfr/xen-orchestra/pull/3408))
- [VM] Display the PVHVM status [#3014](https://github.com/vatesfr/xen-orchestra/issues/3014) (PR [#3418](https://github.com/vatesfr/xen-orchestra/pull/3418))
- [Backup reports] Ability to test the plugin (PR [#3421](https://github.com/vatesfr/xen-orchestra/pull/3421))
- [Backup NG] Ability to restart failed VMs' backup [#3339](https://github.com/vatesfr/xen-orchestra/issues/3339) (PR [#3420](https://github.com/vatesfr/xen-orchestra/pull/3420))
- [VM] Ability to change the NIC type [#3423](https://github.com/vatesfr/xen-orchestra/issues/3423) (PR [#3440](https://github.com/vatesfr/xen-orchestra/pull/3440))
- [Backup NG Overview] Display the schedule's name [#3444](https://github.com/vatesfr/xen-orchestra/issues/3444) (PR [#3445](https://github.com/vatesfr/xen-orchestra/pull/3445))

### Bug fixes

- [Remotes] Rename connect(ed)/disconnect(ed) to enable(d)/disable(d) [#3323](https://github.com/vatesfr/xen-orchestra/issues/3323) (PR [#3396](https://github.com/vatesfr/xen-orchestra/pull/3396))
- [Remotes] Fix error appears twice on testing (PR [#3399](https://github.com/vatesfr/xen-orchestra/pull/3399))
- [Backup NG] Don't fail on VMs with empty VBDs (like CDs or floppy disks) (PR [#3410](https://github.com/vatesfr/xen-orchestra/pull/3410))
- [XOA updater] Fix issue where trial request would fail [#3407](https://github.com/vatesfr/xen-orchestra/issues/3407) (PR [#3412](https://github.com/vatesfr/xen-orchestra/pull/3412))
- [Backup NG logs] Fix log's value not being updated in the copy and report button [#3273](https://github.com/vatesfr/xen-orchestra/issues/3273) (PR [#3360](https://github.com/vatesfr/xen-orchestra/pull/3360))
- [Backup NG] Fix issue when _Delete first_ was enabled for some of the remotes [#3424](https://github.com/vatesfr/xen-orchestra/issues/3424) (PR [#3427](https://github.com/vatesfr/xen-orchestra/pull/3427))
- [VM/host consoles] Work around a XenServer/XCP-ng issue which lead to some consoles not working [#3432](https://github.com/vatesfr/xen-orchestra/issues/3432) (PR [#3435](https://github.com/vatesfr/xen-orchestra/pull/3435))
- [Backup NG] Remove extraneous snapshots in case of multiple schedules [#3132](https://github.com/vatesfr/xen-orchestra/issues/3132) (PR [#3439](https://github.com/vatesfr/xen-orchestra/pull/3439))
- [Backup NG] Fix page reloaded on creating a schedule [#3461](https://github.com/vatesfr/xen-orchestra/issues/3461) (PR [#3462](https://github.com/vatesfr/xen-orchestra/pull/3462))

### Released packages

- xo-server-backup-reports v0.14.0
- @xen-orchestra/async-map v0.0.0
- @xen-orchestra/defined v0.0.0
- @xen-orchestra/emit-async v0.0.0
- @xen-orchestra/mixin v0.0.0
- xo-server v5.27.0
- xo-web v5.27.0

## **5.26.0** (2018-09-07)

### Enhancements

- [Backup (file) restore] Order backups by date in selector [#3294](https://github.com/vatesfr/xen-orchestra/issues/3294) (PR [#3374](https://github.com/vatesfr/xen-orchestra/pull/3374))
- [Self] Hide Tasks entry in menu for self users [#3311](https://github.com/vatesfr/xen-orchestra/issues/3311) (PR [#3373](https://github.com/vatesfr/xen-orchestra/pull/3373))
- [Tasks] Show previous tasks [#3266](https://github.com/vatesfr/xen-orchestra/issues/3266) (PR [#3377](https://github.com/vatesfr/xen-orchestra/pull/3377))
- [Backup NG] Add job name in names of replicated VMs (PR [#3379](https://github.com/vatesfr/xen-orchestra/pull/3379))
- [Backup NG] Restore directories [#1924](https://github.com/vatesfr/xen-orchestra/issues/1924) (PR [#3384](https://github.com/vatesfr/xen-orchestra/pull/3384))
- [VM] Start a VM on a specific host [#3191](https://github.com/vatesfr/xen-orchestra/issues/3191) (PR [#3389](https://github.com/vatesfr/xen-orchestra/pull/3389))

### Bug fixes

- [Self] Fix Self Service quotas not being correctly updated when deleting multiple VMs at a time (PR [#3368](https://github.com/vatesfr/xen-orchestra/pull/3368))
- [Backup NG] Don't fail listing backups when a remote is broken [#3365](https://github.com/vatesfr/xen-orchestra/issues/3365) (PR [#3367](https://github.com/vatesfr/xen-orchestra/pull/3367))
- [New XOSAN] Fix error sometimes occurring when selecting the pool (PR [#3370](https://github.com/vatesfr/xen-orchestra/pull/3370))
- [New VM] Selecting multiple VMs and clicking Create then Cancel used to redirect to Home [#3268](https://github.com/vatesfr/xen-orchestra/issues/3268) (PR [#3371](https://github.com/vatesfr/xen-orchestra/pull/3371))
- [Remotes] `cannot read 'properties' of undefined` error (PR [#3382](https://github.com/vatesfr/xen-orchestra/pull/3382))
- [Servers] Various issues when adding a new server [#3385](https://github.com/vatesfr/xen-orchestra/issues/3385) (PR [#3388](https://github.com/vatesfr/xen-orchestra/pull/3388))
- [Backup NG] Always delete the correct old replications [#3391](https://github.com/vatesfr/xen-orchestra/issues/3391) (PR [#3394](https://github.com/vatesfr/xen-orchestra/pull/3394))

### Released packages

- xo-server v5.26.0
- xo-web v5.26.0

## **5.25.2** (2018-08-27)

### Enhancements

### Bug fixes

- [Remotes] Fix "undefined" mount option issue [#3361](https://github.com/vatesfr/xen-orchestra/issues/3361) (PR [#3363](https://github.com/vatesfr/xen-orchestra/pull/3363))
- [Continuous Replication] Don't try to import/export VDIs on halted host [#3354](https://github.com/vatesfr/xen-orchestra/issues/3354) (PR [#3355](https://github.com/vatesfr/xen-orchestra/pull/3355))
- [Disaster Recovery] Don't try to import/export VMs on halted host (PR [#3364](https://github.com/vatesfr/xen-orchestra/pull/3364))
- [Backup NG] A successful backup job reported as Interrupted [#3018](https://github.com/vatesfr/xen-orchestra/issues/3018) (PR [#3238](https://github.com/vatesfr/xen-orchestra/pull/3238))

### Released packages

- xo-server v5.25.2
- xo-web v5.25.1

## **5.25.0** (2018-08-23)

### Enhancements

- [Tables] Filter input now always shows up even if the table is empty [#3295](https://github.com/vatesfr/xen-orchestra/issues/3295) (PR [#3296](https://github.com/vatesfr/xen-orchestra/pull/3296))
- [Tasks] The table is now still shown when there are no tasks (PR [#3305](https://github.com/vatesfr/xen-orchestra/pull/3305))
- [Host / Logs] Homogenize action buttons in table and enable bulk deletion [#3179](https://github.com/vatesfr/xen-orchestra/issues/3179) (PR [#3313](https://github.com/vatesfr/xen-orchestra/pull/3313))
- [VM/Advanced] Change "Convert" to "Convert to template" and always show the button [#3201](https://github.com/vatesfr/xen-orchestra/issues/3201) (PR [#3319](https://github.com/vatesfr/xen-orchestra/pull/3319))
- [Backup NG form] Display a tip when doing a CR on a thick-provisioned SR [#3291](https://github.com/vatesfr/xen-orchestra/issues/3291) (PR [#3333](https://github.com/vatesfr/xen-orchestra/pull/3333))
- [SR/new] Add local ext SR type [#3332](https://github.com/vatesfr/xen-orchestra/issues/3332) (PR [#3335](https://github.com/vatesfr/xen-orchestra/pull/3335))
- [Backup reports] Send report for the interrupted backup jobs on the server startup [#2998](https://github.com/vatesfr/xen-orchestra/issues/#2998) (PR [3164](https://github.com/vatesfr/xen-orchestra/pull/3164) [3154](https://github.com/vatesfr/xen-orchestra/pull/3154))
- [Backup NG form] Move VMs' selection to a dedicated card [#2711](https://github.com/vatesfr/xen-orchestra/issues/2711) (PR [#3338](https://github.com/vatesfr/xen-orchestra/pull/3338))
- [Backup NG smart mode] Exclude replicated VMs [#2338](https://github.com/vatesfr/xen-orchestra/issues/2338) (PR [#3312](https://github.com/vatesfr/xen-orchestra/pull/3312))
- [Backup NG form] Show the compression checkbox when the full mode is active [#3236](https://github.com/vatesfr/xen-orchestra/issues/3236) (PR [#3345](https://github.com/vatesfr/xen-orchestra/pull/3345))
- [New VM] Display an error when the getting of the coreOS default template fails [#3227](https://github.com/vatesfr/xen-orchestra/issues/3227) (PR [#3343](https://github.com/vatesfr/xen-orchestra/pull/3343))
- [Backup NG form] Set default retention to 1 [#3134](https://github.com/vatesfr/xen-orchestra/issues/3134) (PR [#3290](https://github.com/vatesfr/xen-orchestra/pull/3290))
- [Backup NG] New logs are searchable by job name [#3272](https://github.com/vatesfr/xen-orchestra/issues/3272) (PR [#3351](https://github.com/vatesfr/xen-orchestra/pull/3351))
- [Remotes] Add a field for NFS remotes to set mount options [#1793](https://github.com/vatesfr/xen-orchestra/issues/1793) (PR [#3353](https://github.com/vatesfr/xen-orchestra/pull/3353))

### Bug fixes

- [Backup NG form] Fix schedule's name overridden with undefined if it's not been edited [#3286](https://github.com/vatesfr/xen-orchestra/issues/3286) (PR [#3288](https://github.com/vatesfr/xen-orchestra/pull/3288))
- [Remotes] Don't change `enabled` state on errors (PR [#3318](https://github.com/vatesfr/xen-orchestra/pull/3318))
- [Remotes] Auto-reconnect on use if necessary [#2852](https://github.com/vatesfr/xen-orchestra/issues/2852) (PR [#3320](https://github.com/vatesfr/xen-orchestra/pull/3320))
- [XO items' select] Fix adding or removing a XO item from a select make the missing XO items disappear [#3322](https://github.com/vatesfr/xen-orchestra/issues/3322) (PR [#3315](https://github.com/vatesfr/xen-orchestra/pull/3315))
- [New VM / Self] Filter out SRs that are not in the template's pool [#3068](https://github.com/vatesfr/xen-orchestra/issues/3068) (PR [#3070](https://github.com/vatesfr/xen-orchestra/pull/3070))
- [New VM / Self] Fix 'unknown item' displayed in SR selector [#3267](https://github.com/vatesfr/xen-orchestra/issues/3267) (PR [#3070](https://github.com/vatesfr/xen-orchestra/pull/3070))

### Released packages

- xo-server-backup-reports v0.13.0
- @xen-orchestra/fs 0.3.0
- xo-server v5.25.0
- xo-web v5.25.0

## **5.24.0** (2018-08-09)

### Enhancements

- [Remotes] Make SMB subfolder field optional [#3249](https://github.com/vatesfr/xen-orchestra/issues/3249) (PR [#3250](https://github.com/vatesfr/xen-orchestra/pull/3250))
- [Backup NG form] Make the smart mode's toggle more visible [#2711](https://github.com/vatesfr/xen-orchestra/issues/2711) (PR [#3263](https://github.com/vatesfr/xen-orchestra/pull/3263))
- Move the copy clipboard of the VM's UUID to the header [#3221](https://github.com/vatesfr/xen-orchestra/issues/3221) (PR [#3248](https://github.com/vatesfr/xen-orchestra/pull/3248))
- [Health / Orphaned VMs] Homogenize action buttons in table and enable bulk deletion [#3179](https://github.com/vatesfr/xen-orchestra/issues/3179) (PR [#3274](https://github.com/vatesfr/xen-orchestra/pull/3274))
- [Health / Orphaned snapshot VDIs] Homogenize action buttons in table and enable bulk deletion [#3179](https://github.com/vatesfr/xen-orchestra/issues/3179) (PR [#3270](https://github.com/vatesfr/xen-orchestra/pull/3270))
- [Health / Alarms] Homogenize action buttons in table and enable bulk deletion [#3179](https://github.com/vatesfr/xen-orchestra/issues/3179) (PR [#3271](https://github.com/vatesfr/xen-orchestra/pull/3271))
- [Backup NG Overview] List the Backup NG job's modes [#3169](https://github.com/vatesfr/xen-orchestra/issues/3169) (PR [#3277](https://github.com/vatesfr/xen-orchestra/pull/3277))
- [Backup NG form] Move "Use compression" checkbox in the advanced settings [#2711](https://github.com/vatesfr/xen-orchestra/issues/2711) (PR [#3281](https://github.com/vatesfr/xen-orchestra/pull/3281))
- [Backup NG form] Ability to remove previous backups first before backup the VMs [#3212](https://github.com/vatesfr/xen-orchestra/issues/3212) (PR [#3260](https://github.com/vatesfr/xen-orchestra/pull/3260))
- [Patching] Check date consistency before patching to avoid error on install [#3056](https://github.com/vatesfr/xen-orchestra/issues/3056)

### Bug fixes

- [Pools] Filter GPU groups by pool [#3176](https://github.com/vatesfr/xen-orchestra/issues/3176) (PR [#3253](https://github.com/vatesfr/xen-orchestra/pull/3253))
- [Backup NG] Fix delta backups with SMB remotes [#3224](https://github.com/vatesfr/xen-orchestra/issues/3224) (PR [#3278](https://github.com/vatesfr/xen-orchestra/pull/3278))
- Fix VM restoration getting stuck on local SRs [#3245](https://github.com/vatesfr/xen-orchestra/issues/3245) (PR [#3243](https://github.com/vatesfr/xen-orchestra/pull/3243))

### Released packages

- xen-api v0.17.0
- @xen-orchestra/fs 0.2.1
- xo-server v5.24.0
- xo-web v5.24.0

## **5.23.0** (2018-07-26)

### Enhancements

- Export VDI content [#2432](https://github.com/vatesfr/xen-orchestra/issues/2432) (PR [#3194](https://github.com/vatesfr/xen-orchestra/pull/3194))
- Search syntax support wildcard (`*`) and regular expressions [#3190](https://github.com/vatesfr/xen-orchestra/issues/3190) (PRs [#3198](https://github.com/vatesfr/xen-orchestra/pull/3198) & [#3199](https://github.com/vatesfr/xen-orchestra/pull/3199))
- Import VDI content [#2432](https://github.com/vatesfr/xen-orchestra/issues/2432) (PR [#3216](https://github.com/vatesfr/xen-orchestra/pull/3216))
- [Backup NG form] Ability to edit a schedule's name [#2711](https://github.com/vatesfr/xen-orchestra/issues/2711) [#3071](https://github.com/vatesfr/xen-orchestra/issues/3071) (PR [#3143](https://github.com/vatesfr/xen-orchestra/pull/3143))
- [Remotes] Ability to change the type of a remote [#2423](https://github.com/vatesfr/xen-orchestra/issues/2423) (PR [#3207](https://github.com/vatesfr/xen-orchestra/pull/3207))
- [Backup NG new] Ability to set a job's timeout [#2978](https://github.com/vatesfr/xen-orchestra/issues/2978) (PR [#3222](https://github.com/vatesfr/xen-orchestra/pull/3222))
- [Remotes] Ability to edit/delete a remote with an invalid URL [#3182](https://github.com/vatesfr/xen-orchestra/issues/3182) (PR [#3226](https://github.com/vatesfr/xen-orchestra/pull/3226))
- [Backup NG logs] Prevent user from deleting logs to help resolving issues [#3153](https://github.com/vatesfr/xen-orchestra/issues/3153) (PR [#3235](https://github.com/vatesfr/xen-orchestra/pull/3235))

### Bug fixes

- [Backup Reports] Report not sent if reportWhen failure and at least a VM is successful [#3181](https://github.com/vatesfr/xen-orchestra/issues/3181) (PR [#3185](https://github.com/vatesfr/xen-orchestra/pull/3185))
- [Backup NG] Correctly migrate report setting from legacy jobs [#3180](https://github.com/vatesfr/xen-orchestra/issues/3180) (PR [#3206](https://github.com/vatesfr/xen-orchestra/pull/3206))
- [Backup NG] remove incomplete XVA files [#3159](https://github.com/vatesfr/xen-orchestra/issues/3159) (PR [#3215](https://github.com/vatesfr/xen-orchestra/pull/3215))
- [Backup NG form] Ability to edit a schedule's state [#3223](https://github.com/vatesfr/xen-orchestra/issues/3223) (PR [#3228](https://github.com/vatesfr/xen-orchestra/pull/3228))

### Released packages

- xo-remote-parser v0.5.0
- complex-matcher v0.4.0
- xo-server-backup-reports v0.12.3
- xo-server v5.23.0
- xo-web v5.23.0

## **5.22.1** (2018-07-13)

### Bug fixes

- [Remote select] Gracefully ignore remotes with invalid URL (PR [#3178](https://github.com/vatesfr/xen-orchestra/pull/3178))

### Released packages

- xo-web v5.22.1

## **5.22.0** (2018-07-12)

### Enhancements

- [Backup NG form] Add a link to the remotes' settings [#2711](https://github.com/vatesfr/xen-orchestra/issues/2711) [#3106](https://github.com/vatesfr/xen-orchestra/issues/3106) [#2299](https://github.com/vatesfr/xen-orchestra/issues/2299) (PR [#3128](https://github.com/vatesfr/xen-orchestra/pull/3128))
- [Backup NG logs] Make copy to clipboard and report buttons always available [#3130](https://github.com/vatesfr/xen-orchestra/issues/3130) (PR [#3133](https://github.com/vatesfr/xen-orchestra/pull/3133))
- Warning message when creating a local remote [#3105](https://github.com/vatesfr/xen-orchestra/issues/3105) (PR [3142](https://github.com/vatesfr/xen-orchestra/pull/3142))
- [Remotes] Allow optional port for NFS remote [2299](https://github.com/vatesfr/xen-orchestra/issues/2299) (PR [#3131](https://github.com/vatesfr/xen-orchestra/pull/3131))
- [Backup NG form] Add offline snapshot info (PR [#3144](https://github.com/vatesfr/xen-orchestra/pull/3144))
- [Backup NG overview] Display concurrency and offline snapshot value [3087](https://github.com/vatesfr/xen-orchestra/issues/3087) (PR [3145](https://github.com/vatesfr/xen-orchestra/pull/3145))
- [VM revert] notify the result of reverting a VM [3095](https://github.com/vatesfr/xen-orchestra/issues/3095) (PR [3150](https://github.com/vatesfr/xen-orchestra/pull/3150))
- [Backup NG logs] Link XO items in the details modal [#2711](https://github.com/vatesfr/xen-orchestra/issues/2711) (PR [#3171](https://github.com/vatesfr/xen-orchestra/pull/3171))
- [VM/Snapshots] Add fast clone option when creating a VM [#3120](https://github.com/vatesfr/xen-orchestra/issues/3120) (PR [#3136](https://github.com/vatesfr/xen-orchestra/pull/3136))
- Add the Turkish translation (PR [#3174](https://github.com/vatesfr/xen-orchestra/pull/3174) [#2870](https://github.com/vatesfr/xen-orchestra/pull/2870) [#2871](https://github.com/vatesfr/xen-orchestra/pull/2871))

### Bug fixes

- Delete schedules with their job [#3108](https://github.com/vatesfr/xen-orchestra/issues/3108) (PR [3124](https://github.com/vatesfr/xen-orchestra/pull/3124))
- Remote creation: correctly reset form [#3140](https://github.com/vatesfr/xen-orchestra/issues/3140) (PR [3141](https://github.com/vatesfr/xen-orchestra/pull/3141))
- Make cloud config templates available for all users [3147](https://github.com/vatesfr/xen-orchestra/issues/3147) (PR [3148](https://github.com/vatesfr/xen-orchestra/pull/3148))
- [New VM] Only create the cloud config drive when its option is enabled [3161](https://github.com/vatesfr/xen-orchestra/issues/3161) (PR [3162](https://github.com/vatesfr/xen-orchestra/pull/3162))
- Fix error when installing patches from the host or without a default SR (PR [3166](https://github.com/vatesfr/xen-orchestra/pull/3166))
- [Backup NG] Fix SMB _Not implemented_ issue [#3149](<](https://github.com/vatesfr/xen-orchestra/issues/3149)> 'PR [3175](https://github.com/vatesfr/xen-orchestra/pull/3175')

### Released packages

- xo-remote-parser 0.4.0
- @xen-orchestra/fs 0.2.0
- vhd-lib 0.3.0
- vhd-cli 0.1.0
- xo-server v5.22.0
- xo-web v5.22.0

## **5.21.0** (2018-06-28)

### Enhancements

- Hide legacy backup creation view [#2956](https://github.com/vatesfr/xen-orchestra/issues/2956)
- [Delta Backup NG logs] Display whether the export is a full or a delta [#2711](https://github.com/vatesfr/xen-orchestra/issues/2711)
- Copy VDIs' UUID from SR/disks view [#3051](https://github.com/vatesfr/xen-orchestra/issues/3051)
- [Backup NG] New option to shutdown VMs before snapshotting them [#3058](https://github.com/vatesfr/xen-orchestra/issues/3058#event-1673756438)
- [Backup NG form] Improve feedback [#2711](https://github.com/vatesfr/xen-orchestra/issues/2711)
- [Backup NG] Different retentions for backup and replication [#2895](https://github.com/vatesfr/xen-orchestra/issues/2895)
- Possibility to use a fast clone when creating a VM from a snapshot [#2937](https://github.com/vatesfr/xen-orchestra/issues/2937)
- Ability to customize cloud config templates [#2984](https://github.com/vatesfr/xen-orchestra/issues/2984)
- Add Backup deprecation message and link to Backup NG migration blog post [#3089](https://github.com/vatesfr/xen-orchestra/issues/3089)
- [Backup NG] Ability to cancel a running backup job [#3047](https://github.com/vatesfr/xen-orchestra/issues/3047)
- [Backup NG form] Ability to enable/disable a schedule [#3062](https://github.com/vatesfr/xen-orchestra/issues/3062)
- New backup/health view with nonexistent backup snapshots table [#3090](https://github.com/vatesfr/xen-orchestra/issues/3090)
- Disable cancel/destroy tasks when not allowed [#3076](https://github.com/vatesfr/xen-orchestra/issues/3076)
- Default remote type is NFS [#3103](https://github.com/vatesfr/xen-orchestra/issues/3103) (PR [#3114](https://github.com/vatesfr/xen-orchestra/pull/3114))
- Add legacy backups snapshots to backup/health [#3082](https://github.com/vatesfr/xen-orchestra/issues/3082) (PR [#3111](https://github.com/vatesfr/xen-orchestra/pull/3111))
- [Backup NG logs] Add the job's name to the modal's title [#2711](https://github.com/vatesfr/xen-orchestra/issues/2711) (PR [#3115](https://github.com/vatesfr/xen-orchestra/pull/3115))
- Adding a XCP-ng host to a XS pool now fails fast [#3061](https://github.com/vatesfr/xen-orchestra/issues/3061) (PR [#3118](https://github.com/vatesfr/xen-orchestra/pull/3118))
- [Backup NG logs] Ability to report a failed job and copy its log to the clipboard [#3100](https://github.com/vatesfr/xen-orchestra/issues/3100) (PR [#3110](https://github.com/vatesfr/xen-orchestra/pull/3110))

### Bug fixes

- update the xentools search item to return the version number of installed xentools [#3015](https://github.com/vatesfr/xen-orchestra/issues/3015)
- Fix Nagios backup reports [#2991](https://github.com/vatesfr/xen-orchestra/issues/2991)
- Fix the retry of a single failed/interrupted VM backup [#2912](https://github.com/vatesfr/xen-orchestra/issues/2912#issuecomment-395480321)
- New VM with Self: filter out networks that are not in the template's pool [#3011](https://github.com/vatesfr/xen-orchestra/issues/3011)
- [Backup NG] Auto-detect when a full export is necessary.
- Fix Load Balancer [#3075](https://github.com/vatesfr/xen-orchestra/issues/3075#event-1685469551) [#3026](https://github.com/vatesfr/xen-orchestra/issues/3026)
- [SR stats] Don't scale XAPI iowait values [#2969](https://github.com/vatesfr/xen-orchestra/issues/2969)
- [Backup NG] Don't list unusable SRs for CR/DR [#3050](https://github.com/vatesfr/xen-orchestra/issues/3050)
- Fix creating VM from snapshot (PR [3117](https://github.com/vatesfr/xen-orchestra/pull/3117))

## **5.20.0** (2018-05-31)

### Enhancements

- Add VDI UUID in SR coalesce view [#2903](https://github.com/vatesfr/xen-orchestra/issues/2903)
- Create new VDI from SR view not attached to any VM [#2229](https://github.com/vatesfr/xen-orchestra/issues/2229)
- [Patches] ignore XS upgrade in missing patches counter [#2866](https://github.com/vatesfr/xen-orchestra/issues/2866)
- [Health] List VM snapshots related to non-existing backup jobs/schedules [#2828](https://github.com/vatesfr/xen-orchestra/issues/2828)

## **5.19.0** (2018-05-01)

### Enhancements

- Expose vendor device in VM advanced tab [#2883](https://github.com/vatesfr/xen-orchestra/issues/2883)
- Networks created in XO are missing the "automatic" parameter [#2818](https://github.com/vatesfr/xen-orchestra/issues/2818)
- Performance alert disk space monitoring XS [#2737](https://github.com/vatesfr/xen-orchestra/issues/2737)
- Add ability to create NFSv4 storage repository [#2706](https://github.com/vatesfr/xen-orchestra/issues/2706)
- [SortedTable] Support link actions [#2691](https://github.com/vatesfr/xen-orchestra/issues/2691)
- Additional sort option: by host name [#2680](https://github.com/vatesfr/xen-orchestra/issues/2680)
- Expose XenTools version numbers in data model and UI [#2650](https://github.com/vatesfr/xen-orchestra/issues/2650)
- RRDs stats for SR object [#2644](https://github.com/vatesfr/xen-orchestra/issues/2644)
- composite jobs [#2367](https://github.com/vatesfr/xen-orchestra/issues/2367)
- Better error message [#2344](https://github.com/vatesfr/xen-orchestra/issues/2344)
- Avoid using backup tag with special characters [#2336](https://github.com/vatesfr/xen-orchestra/issues/2336)
- Prefix/suffix for temporary files [#2333](https://github.com/vatesfr/xen-orchestra/issues/2333)
- Continuous Replication - better interface matching on destination [#2093](https://github.com/vatesfr/xen-orchestra/issues/2093)
- Creation of LVMoHBA SRs [#1992](https://github.com/vatesfr/xen-orchestra/issues/1992)
- [Delta backup] Improve restoration by creating a virtual full VHD [#1943](https://github.com/vatesfr/xen-orchestra/issues/1943)
- VM Backups should be done in a dedicated remote directory [#1752](https://github.com/vatesfr/xen-orchestra/issues/1752)
- Add Pool / SR filter in backup view [#1762](https://github.com/vatesfr/xen-orchestra/issues/1762)
- Hide/Disable upgrade button when no upgrade exists [#1594](https://github.com/vatesfr/xen-orchestra/issues/1594)
- "Upgrade" button should display "Downgrade" when trial is over [#1483](https://github.com/vatesfr/xen-orchestra/issues/1483)

### Bugs

- Allowed-ips don't works displaying index.js:1 Uncaught TypeError: (0 , z.isIp) is not a function [#2891](https://github.com/vatesfr/xen-orchestra/issues/2891)
- Error on "usage-report" [#2876](https://github.com/vatesfr/xen-orchestra/issues/2876)
- SR selection combo only listing local storage [#2875](https://github.com/vatesfr/xen-orchestra/issues/2875)
- [Backup NG - Delta] Issue while importing delta [#2857](https://github.com/vatesfr/xen-orchestra/issues/2857)
- Create New SR page broken with past commit [#2853](https://github.com/vatesfr/xen-orchestra/issues/2853)
- [Backup NG] a target should only be preset once [#2848](https://github.com/vatesfr/xen-orchestra/issues/2848)
- Auth Method iSCSI [#2835](https://github.com/vatesfr/xen-orchestra/issues/2835)
- [Backup NG] ENOENT with Delta Backup [#2833](https://github.com/vatesfr/xen-orchestra/issues/2833)
- Different backup logs [#2732](https://github.com/vatesfr/xen-orchestra/issues/2732)
- Creating network fails silently when omitting Description [#2719](https://github.com/vatesfr/xen-orchestra/issues/2719)
- Can't create ISO NFS SR via XOA [#1845](https://github.com/vatesfr/xen-orchestra/issues/1845)

## **5.18.0** (2018-03-31)

### Enhancements

- Support huge VHDs [#2785](https://github.com/vatesfr/xen-orchestra/issues/2785)
- Usage report extended usage [#2770](https://github.com/vatesfr/xen-orchestra/issues/2770)
- Improve host available RAM display [#2750](https://github.com/vatesfr/xen-orchestra/issues/2750)
- Hide IP field during VM creation if not configured [#2739](https://github.com/vatesfr/xen-orchestra/issues/2739)
- [Home] Delete VMs modal should autofocus the input field [#2736](https://github.com/vatesfr/xen-orchestra/issues/2736)
- Backup restore view load icon [#2692](https://github.com/vatesfr/xen-orchestra/issues/2692)
- Deleting default templates doesn't work [#2666](https://github.com/vatesfr/xen-orchestra/issues/2666)
- DR clean previous "failed" snapshots [#2656](https://github.com/vatesfr/xen-orchestra/issues/2656)
- [Home] Put sort criteria in URL like the filter [#2585](https://github.com/vatesfr/xen-orchestra/issues/2585)
- Allow disconnect VDI in SR disk view [#2505](https://github.com/vatesfr/xen-orchestra/issues/2505)
- Add confirmation modal for manual backup run [#2355](https://github.com/vatesfr/xen-orchestra/issues/2355)
- Multiple schedule for backup jobs [#2286](https://github.com/vatesfr/xen-orchestra/issues/2286)
- Checks before web update [#2250](https://github.com/vatesfr/xen-orchestra/issues/2250)
- Backup logs should truly reflect if the job is running [#2206](https://github.com/vatesfr/xen-orchestra/issues/2206)
- Hook/action if an export stream is cut [#1929](https://github.com/vatesfr/xen-orchestra/issues/1929)
- Backup paths should not contain tags but job ids [#1854](https://github.com/vatesfr/xen-orchestra/issues/1854)
- Add a button to delete a backup [#1751](https://github.com/vatesfr/xen-orchestra/issues/1751)
- Dashboard available for Pool and Host level [#1631](https://github.com/vatesfr/xen-orchestra/issues/1631)
- UI Enhancement - VM list - Always show the Toolbar [#1581](https://github.com/vatesfr/xen-orchestra/issues/1581)
- xoa-updater --register: unable to define proxy using the CLI [#873](https://github.com/vatesfr/xen-orchestra/issues/873)

### Bugs

- [Backup NG] CR/DR fail with multiple VMs [#2807](https://github.com/vatesfr/xen-orchestra/issues/2807)
- HTTPS Crash [#2803](https://github.com/vatesfr/xen-orchestra/issues/2803)
- Backup NG "cannot fork the stream after it has been created" [#2790](https://github.com/vatesfr/xen-orchestra/issues/2790)
- [XOSAN] Make temporary `boundObjectId` unique [#2758](https://github.com/vatesfr/xen-orchestra/issues/2758)
- First VIF ignored at VM creation [#2794](https://github.com/vatesfr/xen-orchestra/issues/2794)
- VM creation from snapshot does not work [#2748](https://github.com/vatesfr/xen-orchestra/issues/2748)
- Error: no such object with CentOS 7 template [#2747](https://github.com/vatesfr/xen-orchestra/issues/2747)
- [Tasks] Filter does not work [#2740](https://github.com/vatesfr/xen-orchestra/issues/2740)
- Pagination broken when listing pool VMs [#2730](https://github.com/vatesfr/xen-orchestra/issues/2730)
- All jobs show error icon with message "This backup's creator no longer exists" [#2728](https://github.com/vatesfr/xen-orchestra/issues/2728)
- [Basic backup] Continuous Replication VM names [#2727](https://github.com/vatesfr/xen-orchestra/issues/2727)
- Continuous replication clone removed [#2724](https://github.com/vatesfr/xen-orchestra/issues/2724)
- [Backup] "See matching VMs" issue [#2704](https://github.com/vatesfr/xen-orchestra/issues/2704)
- How to exclude CR targets from a smart backup using tags? [#2613](https://github.com/vatesfr/xen-orchestra/issues/2613)
- Successful VM import reported as failed [#2056](https://github.com/vatesfr/xen-orchestra/issues/2056)
- Delta backup: issue if a disk is once again backed up [#1824](https://github.com/vatesfr/xen-orchestra/issues/1824)

## **5.17.0** (2018-03-02)

### Enhancements

- Username field labeled inconsistently [#2651](https://github.com/vatesfr/xen-orchestra/issues/2651)
- Add modal confirmation for host emergency mode [#2230](https://github.com/vatesfr/xen-orchestra/issues/2230)
- Authorize stats fetching in RO mode [#2678](https://github.com/vatesfr/xen-orchestra/issues/2678)
- Limit VM.export concurrency [#2669](https://github.com/vatesfr/xen-orchestra/issues/2669)
- Basic backup: snapshots names [#2668](https://github.com/vatesfr/xen-orchestra/issues/2668)
- Change placement of "share" button for self [#2663](https://github.com/vatesfr/xen-orchestra/issues/2663)
- Username field labeled inconsistently [#2651](https://github.com/vatesfr/xen-orchestra/issues/2651)
- Backup report for VDI chain status [#2639](https://github.com/vatesfr/xen-orchestra/issues/2639)
- [Dashboard/Health] Control domain VDIs should includes snapshots [#2634](https://github.com/vatesfr/xen-orchestra/issues/2634)
- Do not count VM-snapshot in self quota [#2626](https://github.com/vatesfr/xen-orchestra/issues/2626)
- [xo-web] Backup logs [#2618](https://github.com/vatesfr/xen-orchestra/issues/2618)
- [VM/Snapshots] grouped deletion [#2595](https://github.com/vatesfr/xen-orchestra/issues/2595)
- [Backups] add a new state for a VM: skipped [#2591](https://github.com/vatesfr/xen-orchestra/issues/2591)
- Set a self-service VM at "share" after creation [#2589](https://github.com/vatesfr/xen-orchestra/issues/2589)
- [Backup logs] Improve Unhealthy VDI Chain message [#2586](https://github.com/vatesfr/xen-orchestra/issues/2586)
- [SortedTable] Put sort criteria in URL like the filter [#2584](https://github.com/vatesfr/xen-orchestra/issues/2584)
- Cant attach XenTools on User side. [#2503](https://github.com/vatesfr/xen-orchestra/issues/2503)
- Pool filter for health view [#2302](https://github.com/vatesfr/xen-orchestra/issues/2302)
- [Smart Backup] Improve feedback [#2253](https://github.com/vatesfr/xen-orchestra/issues/2253)
- Backup jobs stuck if no space left on NFS remote [#2116](https://github.com/vatesfr/xen-orchestra/issues/2116)
- Link between backup and XS tasks [#1193](https://github.com/vatesfr/xen-orchestra/issues/1193)
- Move delta backup grouping to server side [#1008](https://github.com/vatesfr/xen-orchestra/issues/1008)

### Bugs

- Limit VDI export concurrency [#2672](https://github.com/vatesfr/xen-orchestra/issues/2672)
- Select is broken outside dev mode [#2645](https://github.com/vatesfr/xen-orchestra/issues/2645)
- "New" XOSAN automatically register the user [#2625](https://github.com/vatesfr/xen-orchestra/issues/2625)
- [VM/Advanced] Error on resource set change should not be hidden [#2620](https://github.com/vatesfr/xen-orchestra/issues/2620)
- misspelled word [#2606](https://github.com/vatesfr/xen-orchestra/issues/2606)
- Jobs vm.revert failing all the time [#2498](https://github.com/vatesfr/xen-orchestra/issues/2498)

## **5.16.0** (2018-01-31)

### Enhancements

- Use @xen-orchestra/cron everywhere [#2616](https://github.com/vatesfr/xen-orchestra/issues/2616)
- [SortedTable] Possibility to specify grouped/individual actions together [#2596](https://github.com/vatesfr/xen-orchestra/issues/2596)
- Self-service: allow VIF create [#2593](https://github.com/vatesfr/xen-orchestra/issues/2593)
- Ghost tasks [#2579](https://github.com/vatesfr/xen-orchestra/issues/2579)
- Autopatching: ignore 7.3 update patch for 7.2 [#2564](https://github.com/vatesfr/xen-orchestra/issues/2564)
- Better Handling of suspending VMs from the Home screen [#2547](https://github.com/vatesfr/xen-orchestra/issues/2547)
- Allow deleting VMs for which `destroy` is blocked [#2525](https://github.com/vatesfr/xen-orchestra/issues/2525)
- Better confirmation on mass destructive actions [#2522](https://github.com/vatesfr/xen-orchestra/issues/2522)
- Move VM In to/Out of Self Service Group [#1913](https://github.com/vatesfr/xen-orchestra/issues/1913)
- Two factor auth [#1897](https://github.com/vatesfr/xen-orchestra/issues/1897)
- token.create should accept an expiration [#1769](https://github.com/vatesfr/xen-orchestra/issues/1769)
- Self Service User - User don't have quota in his dashboard [#1538](https://github.com/vatesfr/xen-orchestra/issues/1538)
- Remove CoffeeScript in xo-server [#189](https://github.com/vatesfr/xen-orchestra/issues/189)
- Better Handling of suspending VMs from the Home screen [#2547](https://github.com/vatesfr/xen-orchestra/issues/2547)
- [xen-api] Stronger reconnection policy [#2410](https://github.com/vatesfr/xen-orchestra/issues/2410)
- home view - allow selecting more than 25 items [#1210](https://github.com/vatesfr/xen-orchestra/issues/1210)
- Performances alerts [#511](https://github.com/vatesfr/xen-orchestra/issues/511)

### Bugs

- [cron] toJSDate is not a function [#2661](https://github.com/vatesfr/xen-orchestra/issues/2661)
- [Delta backup] Merge should not fail when delta contains no data [#2635](https://github.com/vatesfr/xen-orchestra/issues/2635)
- Select issues [#2590](https://github.com/vatesfr/xen-orchestra/issues/2590)
- Fix selects display [#2575](https://github.com/vatesfr/xen-orchestra/issues/2575)
- [SortedTable] Stuck when displaying last page [#2569](https://github.com/vatesfr/xen-orchestra/issues/2569)
- [vm/network] Duplicate key error [#2553](https://github.com/vatesfr/xen-orchestra/issues/2553)
- Jobs vm.revert failing all the time [#2498](https://github.com/vatesfr/xen-orchestra/issues/2498)
- TZ selector is not used for backup schedule preview [#2464](https://github.com/vatesfr/xen-orchestra/issues/2464)
- Remove filter in VM/network view [#2548](https://github.com/vatesfr/xen-orchestra/issues/2548)

## **5.15.0** (2017-12-29)

### Enhancements

- VDI resize online method removed in 7.3 [#2542](https://github.com/vatesfr/xen-orchestra/issues/2542)
- Smart replace VDI.pool_migrate removed from XenServer 7.3 Free [#2541](https://github.com/vatesfr/xen-orchestra/issues/2541)
- New memory constraints in XenServer 7.3 [#2540](https://github.com/vatesfr/xen-orchestra/issues/2540)
- Link to Settings/Logs for admins in error notifications [#2516](https://github.com/vatesfr/xen-orchestra/issues/2516)
- [Self Service] Do not use placehodlers to describe inputs [#2509](https://github.com/vatesfr/xen-orchestra/issues/2509)
- Obfuscate password in log in LDAP plugin test [#2506](https://github.com/vatesfr/xen-orchestra/issues/2506)
- Log rotation [#2492](https://github.com/vatesfr/xen-orchestra/issues/2492)
- Continuous Replication TAG [#2473](https://github.com/vatesfr/xen-orchestra/issues/2473)
- Graphs in VM list view [#2469](https://github.com/vatesfr/xen-orchestra/issues/2469)
- [Delta Backups] Do not include merge duration in transfer speed stat [#2426](https://github.com/vatesfr/xen-orchestra/issues/2426)
- Warning for disperse mode [#2537](https://github.com/vatesfr/xen-orchestra/issues/2537)
- Select components: auto select value if only 1 choice possible [#1479](https://github.com/vatesfr/xen-orchestra/issues/1479)

### Bugs

- VM console doesn't work when using IPv6 in URL [#2530](https://github.com/vatesfr/xen-orchestra/issues/2530)
- Retention issue with failed basic backup [#2524](https://github.com/vatesfr/xen-orchestra/issues/2524)
- [VM/Advanced] Check that the autopower on setting is working [#2489](https://github.com/vatesfr/xen-orchestra/issues/2489)
- Cloud config drive create fail on XenServer < 7 [#2478](https://github.com/vatesfr/xen-orchestra/issues/2478)
- VM create fails due to missing vGPU id [#2466](https://github.com/vatesfr/xen-orchestra/issues/2466)

## **5.14.0** (2017-10-31)

### Enhancements

- VM snapshot description display [#2458](https://github.com/vatesfr/xen-orchestra/issues/2458)
- [Home] Ability to sort VM by number of snapshots [#2450](https://github.com/vatesfr/xen-orchestra/issues/2450)
- Display XS version in host view [#2439](https://github.com/vatesfr/xen-orchestra/issues/2439)
- [File restore]: Clarify the possibility to select multiple files [#2438](https://github.com/vatesfr/xen-orchestra/issues/2438)
- [Continuous Replication] Time in replicated VMs [#2431](https://github.com/vatesfr/xen-orchestra/issues/2431)
- [SortedTable] Active page in URL param [#2405](https://github.com/vatesfr/xen-orchestra/issues/2405)
- replace all '...' with the UTF-8 equivalent [#2391](https://github.com/vatesfr/xen-orchestra/issues/2391)
- [SortedTable] Explicit when no items [#2388](https://github.com/vatesfr/xen-orchestra/issues/2388)
- Handle patching licenses [#2382](https://github.com/vatesfr/xen-orchestra/issues/2382)
- Credential leaking in logs for messages regarding invalid credentials and "too fast authentication" [#2363](https://github.com/vatesfr/xen-orchestra/issues/2363)
- [SortedTable] Keyboard support [#2330](https://github.com/vatesfr/xen-orchestra/issues/2330)
- token.create should accept an expiration [#1769](https://github.com/vatesfr/xen-orchestra/issues/1769)
- On updater error, display link to documentation [#1610](https://github.com/vatesfr/xen-orchestra/issues/1610)
- Add basic vGPU support [#2413](https://github.com/vatesfr/xen-orchestra/issues/2413)
- Storage View - Disk Tab - real disk usage [#2475](https://github.com/vatesfr/xen-orchestra/issues/2475)

### Bugs

- Config drive - Custom config not working properly [#2449](https://github.com/vatesfr/xen-orchestra/issues/2449)
- Snapshot sorted table breaks copyVm [#2446](https://github.com/vatesfr/xen-orchestra/issues/2446)
- [vm/snapshots] Incorrect default sort order [#2442](https://github.com/vatesfr/xen-orchestra/issues/2442)
- [Backups/Jobs] Incorrect months mapping [#2427](https://github.com/vatesfr/xen-orchestra/issues/2427)
- [Xapi#barrier()] Not compatible with XenServer < 6.1 [#2418](https://github.com/vatesfr/xen-orchestra/issues/2418)
- [SortedTable] Change page when no more items on the page [#2401](https://github.com/vatesfr/xen-orchestra/issues/2401)
- Review and fix creating a VM from a snapshot [#2343](https://github.com/vatesfr/xen-orchestra/issues/2343)
- Unable to edit / save restored backup job [#1922](https://github.com/vatesfr/xen-orchestra/issues/1922)

## **5.13.0** (2017-09-29)

### Enhancements

- replace all '...' with the UTF-8 equivalent [#2391](https://github.com/vatesfr/xen-orchestra/issues/2391)
- [SortedTable] Explicit when no items [#2388](https://github.com/vatesfr/xen-orchestra/issues/2388)
- Auto select iqn or lun if there is only one [#2379](https://github.com/vatesfr/xen-orchestra/issues/2379)
- [Sparklines] Hide points [#2370](https://github.com/vatesfr/xen-orchestra/issues/2370)
- Allow xo-server-recover-account to generate a random password [#2360](https://github.com/vatesfr/xen-orchestra/issues/2360)
- Add disk in existing VM as self user [#2348](https://github.com/vatesfr/xen-orchestra/issues/2348)
- Sorted table for Settings/server [#2340](https://github.com/vatesfr/xen-orchestra/issues/2340)
- Sign in should be case-insensitive [#2337](https://github.com/vatesfr/xen-orchestra/issues/2337)
- [SortedTable] Extend checkbox click to whole column [#2329](https://github.com/vatesfr/xen-orchestra/issues/2329)
- [SortedTable] Ability to select all items (across pages) [#2324](https://github.com/vatesfr/xen-orchestra/issues/2324)
- [SortedTable] Range selection [#2323](https://github.com/vatesfr/xen-orchestra/issues/2323)
- Warning on SMB remote creation [#2316](https://github.com/vatesfr/xen-orchestra/issues/2316)
- [Home | SortedTable] Add link to syntax doc in the filter input [#2305](https://github.com/vatesfr/xen-orchestra/issues/2305)
- [SortedTable] Add optional binding of filter to an URL query [#2301](https://github.com/vatesfr/xen-orchestra/issues/2301)
- [Home][keyboard navigation] Allow selecting the objects [#2214](https://github.com/vatesfr/xen-orchestra/issues/2214)
- SR view / Disks: option to display non managed VDIs [#1724](https://github.com/vatesfr/xen-orchestra/issues/1724)
- Continuous Replication Retention [#1692](https://github.com/vatesfr/xen-orchestra/issues/1692)

### Bugs

- iSCSI issue on LUN selector [#2374](https://github.com/vatesfr/xen-orchestra/issues/2374)
- Errors in VM copy are not properly reported [#2347](https://github.com/vatesfr/xen-orchestra/issues/2347)
- Removing a PIF IP fails [#2346](https://github.com/vatesfr/xen-orchestra/issues/2346)
- Review and fix creating a VM from a snapshot [#2343](https://github.com/vatesfr/xen-orchestra/issues/2343)
- iSCSI LUN Detection fails with authentication [#2339](https://github.com/vatesfr/xen-orchestra/issues/2339)
- Fix PoolActionBar to add a new SR [#2307](https://github.com/vatesfr/xen-orchestra/issues/2307)
- [VM migration] Error if default SR not accessible to target host [#2180](https://github.com/vatesfr/xen-orchestra/issues/2180)
- A job shouldn't executable more than once at the same time [#2053](https://github.com/vatesfr/xen-orchestra/issues/2053)

## **5.12.0** (2017-08-31)

### Enhancements

- PIF selector with physical status [#2326](https://github.com/vatesfr/xen-orchestra/issues/2326)
- [SortedTable] Range selection [#2323](https://github.com/vatesfr/xen-orchestra/issues/2323)
- Self service filter for home/VM view [#2303](https://github.com/vatesfr/xen-orchestra/issues/2303)
- SR/Disks Display total of VDIs to coalesce [#2300](https://github.com/vatesfr/xen-orchestra/issues/2300)
- Pool filter in the task view [#2293](https://github.com/vatesfr/xen-orchestra/issues/2293)
- "Loading" while fetching objects [#2285](https://github.com/vatesfr/xen-orchestra/issues/2285)
- [SortedTable] Add grouped actions feature [#2276](https://github.com/vatesfr/xen-orchestra/issues/2276)
- Add a filter to the backups' log [#2246](https://github.com/vatesfr/xen-orchestra/issues/2246)
- It should not be possible to migrate a halted VM. [#2233](https://github.com/vatesfr/xen-orchestra/issues/2233)
- [Home][keyboard navigation] Allow selecting the objects [#2214](https://github.com/vatesfr/xen-orchestra/issues/2214)
- Allow to set pool master [#2213](https://github.com/vatesfr/xen-orchestra/issues/2213)
- Continuous Replication Retention [#1692](https://github.com/vatesfr/xen-orchestra/issues/1692)

### Bugs

- Home pagination bug [#2310](https://github.com/vatesfr/xen-orchestra/issues/2310)
- Fix PoolActionBar to add a new SR [#2307](https://github.com/vatesfr/xen-orchestra/issues/2307)
- VM snapshots are not correctly deleted [#2304](https://github.com/vatesfr/xen-orchestra/issues/2304)
- Parallel deletion of VMs fails [#2297](https://github.com/vatesfr/xen-orchestra/issues/2297)
- Continuous replication create multiple zombie disks [#2292](https://github.com/vatesfr/xen-orchestra/issues/2292)
- Add user to Group issue [#2196](https://github.com/vatesfr/xen-orchestra/issues/2196)
- [VM migration] Error if default SR not accessible to target host [#2180](https://github.com/vatesfr/xen-orchestra/issues/2180)

## **5.11.0** (2017-07-31)

### Enhancements

- Storage VHD chain health [\#2178](https://github.com/vatesfr/xen-orchestra/issues/2178)

### Bug fixes

- No web VNC console [\#2258](https://github.com/vatesfr/xen-orchestra/issues/2258)
- Patching issues [\#2254](https://github.com/vatesfr/xen-orchestra/issues/2254)
- Advanced button in VM creation for self service user [\#2202](https://github.com/vatesfr/xen-orchestra/issues/2202)
- Hide "new VM" menu entry if not admin or not self service user [\#2191](https://github.com/vatesfr/xen-orchestra/issues/2191)

## **5.10.0** (2017-06-30)

### Enhancements

- Improve backup log display [\#2239](https://github.com/vatesfr/xen-orchestra/issues/2239)
- Patch SR detection improvement [\#2215](https://github.com/vatesfr/xen-orchestra/issues/2215)
- Less strict coalesce detection [\#2207](https://github.com/vatesfr/xen-orchestra/issues/2207)
- IP pool UI improvement [\#2203](https://github.com/vatesfr/xen-orchestra/issues/2203)
- Ability to clear "Auto power on" flag for DR-ed VM [\#2097](https://github.com/vatesfr/xen-orchestra/issues/2097)
- [Delta backup restoration] Choose SR for each VDIs [\#2070](https://github.com/vatesfr/xen-orchestra/issues/2070)
- Ability to forget a host (even if no longer present) [\#1934](https://github.com/vatesfr/xen-orchestra/issues/1934)

### Bug fixes

- Cross pool migrate fail [\#2248](https://github.com/vatesfr/xen-orchestra/issues/2248)
- ActionButtons with modals stay in pending state forever [\#2222](https://github.com/vatesfr/xen-orchestra/issues/2222)
- Permission issue for a user on self service VMs [\#2212](https://github.com/vatesfr/xen-orchestra/issues/2212)
- Self-Service resource loophole [\#2198](https://github.com/vatesfr/xen-orchestra/issues/2198)
- Backup log no longer shows the name of destination VM [\#2195](https://github.com/vatesfr/xen-orchestra/issues/2195)
- State not restored when exiting modal dialog [\#2194](https://github.com/vatesfr/xen-orchestra/issues/2194)
- [Xapi#exportDeltaVm] Cannot read property 'managed' of undefined [\#2189](https://github.com/vatesfr/xen-orchestra/issues/2189)
- VNC keyboard layout change [\#404](https://github.com/vatesfr/xen-orchestra/issues/404)

## **5.9.0** (2017-05-31)

### Enhancements

- Allow DR to remove previous backup first [\#2157](https://github.com/vatesfr/xen-orchestra/issues/2157)
- Feature request - add amount of RAM to memory bars [\#2149](https://github.com/vatesfr/xen-orchestra/issues/2149)
- Make the acceptability of invalid certificates configurable [\#2138](https://github.com/vatesfr/xen-orchestra/issues/2138)
- label of VM names in tasks link [\#2135](https://github.com/vatesfr/xen-orchestra/issues/2135)
- Backup report timezone [\#2133](https://github.com/vatesfr/xen-orchestra/issues/2133)
- xo-server-recover-account [\#2129](https://github.com/vatesfr/xen-orchestra/issues/2129)
- Detect disks attached to control domain [\#2126](https://github.com/vatesfr/xen-orchestra/issues/2126)
- Add task description in Tasks view [\#2125](https://github.com/vatesfr/xen-orchestra/issues/2125)
- Host reboot warning after patching for 7.1 [\#2124](https://github.com/vatesfr/xen-orchestra/issues/2124)
- Continuous Replication - possibility run VM without a clone [\#2119](https://github.com/vatesfr/xen-orchestra/issues/2119)
- Unreachable host should be detected [\#2099](https://github.com/vatesfr/xen-orchestra/issues/2099)
- Orange icon when host is is disabled [\#2098](https://github.com/vatesfr/xen-orchestra/issues/2098)
- Enhanced backup report logs [\#2096](https://github.com/vatesfr/xen-orchestra/issues/2096)
- Only show failures when configured to report on failures [\#2095](https://github.com/vatesfr/xen-orchestra/issues/2095)
- "Add all" button in self service [\#2081](https://github.com/vatesfr/xen-orchestra/issues/2081)
- Patch and pack mechanism changed on Ely [\#2058](https://github.com/vatesfr/xen-orchestra/issues/2058)
- Tip or ask people to patch from pool view [\#2057](https://github.com/vatesfr/xen-orchestra/issues/2057)
- File restore - Remind compatible backup [\#1930](https://github.com/vatesfr/xen-orchestra/issues/1930)
- Reporting for halted vm time [\#1613](https://github.com/vatesfr/xen-orchestra/issues/1613)
- Add standalone XS server to a pool and patch it to the pool level [\#878](https://github.com/vatesfr/xen-orchestra/issues/878)
- Add Cores-per-sockets [\#130](https://github.com/vatesfr/xen-orchestra/issues/130)

### Bug fixes

- VM creation is broken for non-admins [\#2168](https://github.com/vatesfr/xen-orchestra/issues/2168)
- Can't create cloud config drive [\#2162](https://github.com/vatesfr/xen-orchestra/issues/2162)
- Select is "moving" [\#2142](https://github.com/vatesfr/xen-orchestra/issues/2142)
- Select issue for affinity host [\#2141](https://github.com/vatesfr/xen-orchestra/issues/2141)
- Dashboard Storage Usage incorrect [\#2123](https://github.com/vatesfr/xen-orchestra/issues/2123)
- Detect unmerged _base copy_ and prevent too long chains [\#2047](https://github.com/vatesfr/xen-orchestra/issues/2047)

## **5.8.0** (2017-04-28)

### Enhancements

- Limit About view info for non-admins [\#2109](https://github.com/vatesfr/xen-orchestra/issues/2109)
- Enabling/disabling boot device on HVM VM [\#2105](https://github.com/vatesfr/xen-orchestra/issues/2105)
- Filter: Hide snapshots in SR disk view [\#2102](https://github.com/vatesfr/xen-orchestra/issues/2102)
- Smarter XOSAN install [\#2084](https://github.com/vatesfr/xen-orchestra/issues/2084)
- PL translation [\#2079](https://github.com/vatesfr/xen-orchestra/issues/2079)
- Remove the "share this VM" option if not in self service [\#2061](https://github.com/vatesfr/xen-orchestra/issues/2061)
- "connected" status graphics are not the same on the host storage and networking tabs [\#2060](https://github.com/vatesfr/xen-orchestra/issues/2060)
- Ability to view and edit `vga` and `videoram` fields in VM view [\#158](https://github.com/vatesfr/xen-orchestra/issues/158)
- Performances [\#1](https://github.com/vatesfr/xen-api/issues/1)

### Bug fixes

- Dashboard display issues [\#2108](https://github.com/vatesfr/xen-orchestra/issues/2108)
- Dashboard CPUs Usage [\#2105](https://github.com/vatesfr/xen-orchestra/issues/2105)
- [Dashboard/Overview] Warning [\#2090](https://github.com/vatesfr/xen-orchestra/issues/2090)
- VM creation displays all networks [\#2086](https://github.com/vatesfr/xen-orchestra/issues/2086)
- Cannot change HA mode for a VM [\#2080](https://github.com/vatesfr/xen-orchestra/issues/2080)
- [Smart backup] Tags selection does not work [\#2077](https://github.com/vatesfr/xen-orchestra/issues/2077)
- [Backup jobs] Timeout should be in seconds, not milliseconds [\#2076](https://github.com/vatesfr/xen-orchestra/issues/2076)
- Missing VM templates [\#2075](https://github.com/vatesfr/xen-orchestra/issues/2075)
- [transport-email] From header not set [\#2074](https://github.com/vatesfr/xen-orchestra/issues/2074)
- Missing objects should be displayed in backup edition [\#2052](https://github.com/vatesfr/xen-orchestra/issues/2052)

## **5.7.0** (2017-03-31)

### Enhancements

- Improve ActionButton error reporting [\#2048](https://github.com/vatesfr/xen-orchestra/issues/2048)
- Home view master checkbox UI issue [\#2027](https://github.com/vatesfr/xen-orchestra/issues/2027)
- HU Translation [\#2019](https://github.com/vatesfr/xen-orchestra/issues/2019)
- [Usage report] Add name for all objects [\#2017](https://github.com/vatesfr/xen-orchestra/issues/2017)
- [Home] Improve inter-types linkage [\#2012](https://github.com/vatesfr/xen-orchestra/issues/2012)
- Remove bootable checkboxes in VM creation [\#2007](https://github.com/vatesfr/xen-orchestra/issues/2007)
- Do not display bootable toggles for disks of non-PV VMs [\#1996](https://github.com/vatesfr/xen-orchestra/issues/1996)
- Try to match network VLAN for VM migration modal [\#1990](https://github.com/vatesfr/xen-orchestra/issues/1990)
- [Usage reports] Add VM names in addition to UUIDs [\#1984](https://github.com/vatesfr/xen-orchestra/issues/1984)
- Host affinity in "advanced" VM creation [\#1983](https://github.com/vatesfr/xen-orchestra/issues/1983)
- Add job tag in backup logs [\#1982](https://github.com/vatesfr/xen-orchestra/issues/1982)
- Possibility to add a label/description to servers [\#1965](https://github.com/vatesfr/xen-orchestra/issues/1965)
- Possibility to create shared VM in a resource set [\#1964](https://github.com/vatesfr/xen-orchestra/issues/1964)
- Clearer display of disabled (backup) jobs [\#1958](https://github.com/vatesfr/xen-orchestra/issues/1958)
- Job should have a configurable timeout [\#1956](https://github.com/vatesfr/xen-orchestra/issues/1956)
- Sort failed VMs in backup report [\#1950](https://github.com/vatesfr/xen-orchestra/issues/1950)
- Support for UNIX socket path [\#1944](https://github.com/vatesfr/xen-orchestra/issues/1944)
- Interface - Host Patching - Button Verbiage [\#1911](https://github.com/vatesfr/xen-orchestra/issues/1911)
- Display if a VM is in Self Service (and which group) [\#1905](https://github.com/vatesfr/xen-orchestra/issues/1905)
- Install supplemental pack on a whole pool [\#1896](https://github.com/vatesfr/xen-orchestra/issues/1896)
- Allow VM snapshots with ACLs [\#1865](https://github.com/vatesfr/xen-orchestra/issues/1886)
- Icon to indicate if a snapshot is quiesce [\#1858](https://github.com/vatesfr/xen-orchestra/issues/1858)
- Pool Ips input too permissive [\#1731](https://github.com/vatesfr/xen-orchestra/issues/1731)
- Select is going on top after each choice [\#1359](https://github.com/vatesfr/xen-orchestra/issues/1359)

### Bug fixes

- Missing objects should be displayed in backup edition [\#2052](https://github.com/vatesfr/xen-orchestra/issues/2052)
- Search bar content changes while typing [\#2035](https://github.com/vatesfr/xen-orchestra/issues/2035)
- VM.\$guest_metrics.PV_drivers_up_to_date is deprecated in XS 7.1 [\#2024](https://github.com/vatesfr/xen-orchestra/issues/2024)
- Bootable flag selection checkbox for extra disk not fetched [\#1994](https://github.com/vatesfr/xen-orchestra/issues/1994)
- Home view − Changing type must reset paging [\#1993](https://github.com/vatesfr/xen-orchestra/issues/1993)
- XOSAN menu item should only be displayed to admins [\#1968](https://github.com/vatesfr/xen-orchestra/issues/1968)
- Object type change are not correctly handled in UI [\#1967](https://github.com/vatesfr/xen-orchestra/issues/1967)
- VM creation is stuck when using ISO/DVD as install method [\#1966](https://github.com/vatesfr/xen-orchestra/issues/1966)
- Install pack on whole pool fails [\#1957](https://github.com/vatesfr/xen-orchestra/issues/1957)
- Consoles are broken in next-release [\#1954](https://github.com/vatesfr/xen-orchestra/issues/1954)
- [VHD merge] Increase BAT when necessary [\#1939](https://github.com/vatesfr/xen-orchestra/issues/1939)
- Issue on VM restore time [\#1936](https://github.com/vatesfr/xen-orchestra/issues/1936)
- Two remotes should not be able to have the same name [\#1879](https://github.com/vatesfr/xen-orchestra/issues/1879)
- Selfservice limits not honored after VM creation [\#1695](https://github.com/vatesfr/xen-orchestra/issues/1695)

## **5.6.0** (2017-01-27)

Reporting, LVM File level restore.

### Enhancements

- Do not stop patches install if already applied [\#1904](https://github.com/vatesfr/xen-orchestra/issues/1904)
- Improve scheduling UI [\#1893](https://github.com/vatesfr/xen-orchestra/issues/1893)
- Smart backup and tag [\#1885](https://github.com/vatesfr/xen-orchestra/issues/1885)
- Missing embedded API documentation [\#1882](https://github.com/vatesfr/xen-orchestra/issues/1882)
- Add local DVD in CD selector [\#1880](https://github.com/vatesfr/xen-orchestra/issues/1880)
- File level restore for LVM [\#1878](https://github.com/vatesfr/xen-orchestra/issues/1878)
- Restore multiple files from file level restore [\#1877](https://github.com/vatesfr/xen-orchestra/issues/1877)
- Add a VM tab for host & pool views [\#1864](https://github.com/vatesfr/xen-orchestra/issues/1864)
- Icon to indicate if a snapshot is quiesce [\#1858](https://github.com/vatesfr/xen-orchestra/issues/1858)
- UI for disconnect hosts comp [\#1833](https://github.com/vatesfr/xen-orchestra/issues/1833)
- Eject all xs-guest.iso in a pool [\#1798](https://github.com/vatesfr/xen-orchestra/issues/1798)
- Display installed supplemental pack on host [\#1506](https://github.com/vatesfr/xen-orchestra/issues/1506)
- Install supplemental pack on host comp [\#1460](https://github.com/vatesfr/xen-orchestra/issues/1460)
- Pool-wide combined stats [\#1324](https://github.com/vatesfr/xen-orchestra/issues/1324)

### Bug fixes

- IP-address not released when VM removed [\#1906](https://github.com/vatesfr/xen-orchestra/issues/1906)
- Interface broken due to new Bootstrap Alpha [\#1871](https://github.com/vatesfr/xen-orchestra/issues/1871)
- Self service recompute all limits broken [\#1866](https://github.com/vatesfr/xen-orchestra/issues/1866)
- Patch not found error for XS 6.5 [\#1863](https://github.com/vatesfr/xen-orchestra/issues/1863)
- Convert To Template issues [\#1855](https://github.com/vatesfr/xen-orchestra/issues/1855)
- Removing PIF seems to fail [\#1853](https://github.com/vatesfr/xen-orchestra/issues/1853)
- Depth should be >= 1 in backup creation [\#1851](https://github.com/vatesfr/xen-orchestra/issues/1851)
- Wrong link in Dashboard > Health [\#1850](https://github.com/vatesfr/xen-orchestra/issues/1850)
- Incorrect file dates shown in new File Restore feature [\#1840](https://github.com/vatesfr/xen-orchestra/issues/1840)
- IP allocation problem [\#1747](https://github.com/vatesfr/xen-orchestra/issues/1747)
- Selfservice limits not honored after VM creation [\#1695](https://github.com/vatesfr/xen-orchestra/issues/1695)

## **5.5.0** (2016-12-20)

File level restore.

### Enhancements

- Better auto select network when migrate VM [\#1788](https://github.com/vatesfr/xen-orchestra/issues/1788)
- Plugin for passive backup job reporting in Nagios [\#1664](https://github.com/vatesfr/xen-orchestra/issues/1664)
- File level restore for delta backup [\#1590](https://github.com/vatesfr/xen-orchestra/issues/1590)
- Better select filters for ACLs [\#1515](https://github.com/vatesfr/xen-orchestra/issues/1515)
- All pools and "negative" filters [\#1503](https://github.com/vatesfr/xen-orchestra/issues/1503)
- VM copy with disk selection [\#826](https://github.com/vatesfr/xen-orchestra/issues/826)
- Disable metadata exports [\#1818](https://github.com/vatesfr/xen-orchestra/issues/1818)

### Bug fixes

- Tool small selector [\#1832](https://github.com/vatesfr/xen-orchestra/issues/1832)
- Replication does not work from a VM created by a CR or delta backup [\#1811](https://github.com/vatesfr/xen-orchestra/issues/1811)
- Can't add a SSH key in VM creation [\#1805](https://github.com/vatesfr/xen-orchestra/issues/1805)
- Issue when no default SR in a pool [\#1804](https://github.com/vatesfr/xen-orchestra/issues/1804)
- XOA doesn't refresh after an update anymore [\#1801](https://github.com/vatesfr/xen-orchestra/issues/1801)
- Shortcuts not inhibited on inputs on Safari [\#1691](https://github.com/vatesfr/xen-orchestra/issues/1691)

## **5.4.0** (2016-11-23)

### Enhancements

- XML display in alerts [\#1776](https://github.com/vatesfr/xen-orchestra/issues/1776)
- Remove some view for non admin users [\#1773](https://github.com/vatesfr/xen-orchestra/issues/1773)
- Complex matcher should support matching boolean values [\#1768](https://github.com/vatesfr/xen-orchestra/issues/1768)
- Home SR view [\#1764](https://github.com/vatesfr/xen-orchestra/issues/1764)
- Filter on tag click [\#1763](https://github.com/vatesfr/xen-orchestra/issues/1763)
- Testable plugins [\#1749](https://github.com/vatesfr/xen-orchestra/issues/1749)
- Backup/Restore Design fix. [\#1734](https://github.com/vatesfr/xen-orchestra/issues/1734)
- Display the owner of a \(backup\) job [\#1733](https://github.com/vatesfr/xen-orchestra/issues/1733)
- Use paginated table for backup jobs [\#1726](https://github.com/vatesfr/xen-orchestra/issues/1726)
- SR view / Disks: should display snapshot VDIs [\#1723](https://github.com/vatesfr/xen-orchestra/issues/1723)
- Restored VM should have an identifiable name [\#1719](https://github.com/vatesfr/xen-orchestra/issues/1719)
- If host reboot action returns NO_HOSTS_AVAILABLE, ask to force [\#1717](https://github.com/vatesfr/xen-orchestra/issues/1717)
- Hide xo-server timezone in backups [\#1706](https://github.com/vatesfr/xen-orchestra/issues/1706)
- Enable hyperlink for Hostname for Issues [\#1700](https://github.com/vatesfr/xen-orchestra/issues/1700)
- Pool/network - Modify column [\#1696](https://github.com/vatesfr/xen-orchestra/issues/1696)
- UI - Plugins - Display a message if no plugins [\#1670](https://github.com/vatesfr/xen-orchestra/issues/1670)
- Display warning/error for delta backup on XS older than 6.5 [\#1647](https://github.com/vatesfr/xen-orchestra/issues/1647)
- XO without internet access doesn't work [\#1629](https://github.com/vatesfr/xen-orchestra/issues/1629)
- Improve backup restore view [\#1609](https://github.com/vatesfr/xen-orchestra/issues/1609)
- UI Enhancement - Acronym for dummy [\#1604](https://github.com/vatesfr/xen-orchestra/issues/1604)
- Slack XO plugin for backup report [\#1593](https://github.com/vatesfr/xen-orchestra/issues/1593)
- Expose XAPI exceptions in the UI [\#1481](https://github.com/vatesfr/xen-orchestra/issues/1481)
- Running VMs in the host overview, all VMs in the pool overview [\#1432](https://github.com/vatesfr/xen-orchestra/issues/1432)
- Move location of NFS mount point [\#1405](https://github.com/vatesfr/xen-orchestra/issues/1405)
- Home: Pool list - additional informations for pool [\#1226](https://github.com/vatesfr/xen-orchestra/issues/1226)
- Modify VLAN of an existing network [\#1092](https://github.com/vatesfr/xen-orchestra/issues/1092)
- Wrong instructions for CLI upgrade [\#787](https://github.com/vatesfr/xen-orchestra/issues/787)
- Ability to export/import XO config [\#786](https://github.com/vatesfr/xen-orchestra/issues/786)
- Test button for transport-email plugin [\#697](https://github.com/vatesfr/xen-orchestra/issues/697)
- Merge `scheduler` API into `schedule` [\#664](https://github.com/vatesfr/xen-orchestra/issues/664)

### Bug fixes

- Should jobs be accessible to non admins? [\#1759](https://github.com/vatesfr/xen-orchestra/issues/1759)
- Schedules deletion is not working [\#1737](https://github.com/vatesfr/xen-orchestra/issues/1737)
- Editing a job from the jobs overview page does not work [\#1736](https://github.com/vatesfr/xen-orchestra/issues/1736)
- Editing a schedule from jobs overview does not work [\#1728](https://github.com/vatesfr/xen-orchestra/issues/1728)
- ACLs not correctly imported [\#1722](https://github.com/vatesfr/xen-orchestra/issues/1722)
- Some Bootstrap style broken [\#1721](https://github.com/vatesfr/xen-orchestra/issues/1721)
- Not properly sign out on auth token expiration [\#1711](https://github.com/vatesfr/xen-orchestra/issues/1711)
- Hosts/<UUID>/network status is incorrect [\#1702](https://github.com/vatesfr/xen-orchestra/issues/1702)
- Patches application fails "Found : Moved Temporarily" [\#1701](https://github.com/vatesfr/xen-orchestra/issues/1701)
- Password generation for user creation is not working [\#1678](https://github.com/vatesfr/xen-orchestra/issues/1678)
- \#/dashboard/health Remove All Orphaned VDIs [\#1622](https://github.com/vatesfr/xen-orchestra/issues/1622)
- Create a new SR - CIFS/SAMBA Broken [\#1615](https://github.com/vatesfr/xen-orchestra/issues/1615)
- xo-cli --list-objects: truncated output ? 64k buffer limitation ? [\#1356](https://github.com/vatesfr/xen-orchestra/issues/1356)

## **5.3.0** (2016-10-20)

### Enhancements

- Missing favicon [\#1660](https://github.com/vatesfr/xen-orchestra/issues/1660)
- ipPools quota [\#1565](https://github.com/vatesfr/xen-orchestra/issues/1565)
- Dashboard - orphaned VDI [\#1654](https://github.com/vatesfr/xen-orchestra/issues/1654)
- Stats in home/host view when expanded [\#1634](https://github.com/vatesfr/xen-orchestra/issues/1634)
- Bar for used and total RAM on home pool view [\#1625](https://github.com/vatesfr/xen-orchestra/issues/1625)
- Can't translate some text [\#1624](https://github.com/vatesfr/xen-orchestra/issues/1624)
- Dynamic RAM allocation at creation time [\#1603](https://github.com/vatesfr/xen-orchestra/issues/1603)
- Display memory bar in home/host view [\#1616](https://github.com/vatesfr/xen-orchestra/issues/1616)
- Improve keyboard navigation [\#1578](https://github.com/vatesfr/xen-orchestra/issues/1578)
- Strongly suggest to install the guest tools [\#1575](https://github.com/vatesfr/xen-orchestra/issues/1575)
- Missing tooltip [\#1568](https://github.com/vatesfr/xen-orchestra/issues/1568)
- Emphasize already used ips in ipPools [\#1566](https://github.com/vatesfr/xen-orchestra/issues/1566)
- Change "missing feature message" for non-admins [\#1564](https://github.com/vatesfr/xen-orchestra/issues/1564)
- Allow VIF edition [\#1446](https://github.com/vatesfr/xen-orchestra/issues/1446)
- Disable browser autocomplete on credentials on the Update page [\#1304](https://github.com/vatesfr/xen-orchestra/issues/1304)
- keyboard shortcuts [\#1279](https://github.com/vatesfr/xen-orchestra/issues/1279)
- Add network bond creation [\#876](https://github.com/vatesfr/xen-orchestra/issues/876)
- `pool.setDefaultSr\(\)` should not require `pool` param [\#1558](https://github.com/vatesfr/xen-orchestra/issues/1558)
- Select default SR [\#1554](https://github.com/vatesfr/xen-orchestra/issues/1554)
- No error message when I exceed my resource set quota [\#1541](https://github.com/vatesfr/xen-orchestra/issues/1541)
- Hide some buttons for self service VMs [\#1539](https://github.com/vatesfr/xen-orchestra/issues/1539)
- Add Job ID to backup schedules [\#1534](https://github.com/vatesfr/xen-orchestra/issues/1534)
- Correct name for VM selector with templates [\#1530](https://github.com/vatesfr/xen-orchestra/issues/1530)
- Help text when no matches for a filter [\#1517](https://github.com/vatesfr/xen-orchestra/issues/1517)
- Icon or tooltip to allow VDI migration in VM disk view [\#1512](https://github.com/vatesfr/xen-orchestra/issues/1512)
- Create a snapshot before restoring one [\#1445](https://github.com/vatesfr/xen-orchestra/issues/1445)
- Auto power on setting at creation time [\#1444](https://github.com/vatesfr/xen-orchestra/issues/1444)
- local remotes should be avoided if possible [\#1441](https://github.com/vatesfr/xen-orchestra/issues/1441)
- Self service edition unclear [\#1429](https://github.com/vatesfr/xen-orchestra/issues/1429)
- Avoid "\_" char in job tag name [\#1414](https://github.com/vatesfr/xen-orchestra/issues/1414)
- Display message if host reboot needed to apply patches [\#1352](https://github.com/vatesfr/xen-orchestra/issues/1352)
- Color code on host PIF stats can be misleading [\#1265](https://github.com/vatesfr/xen-orchestra/issues/1265)
- Sign in page is not rendered correctly [\#1161](https://github.com/vatesfr/xen-orchestra/issues/1161)
- Template management [\#1091](https://github.com/vatesfr/xen-orchestra/issues/1091)
- On pool view: collapse network list [\#1461](https://github.com/vatesfr/xen-orchestra/issues/1461)
- Alert when trying to reboot/halt the pool master XS [\#1458](https://github.com/vatesfr/xen-orchestra/issues/1458)
- Adding tooltip on Home page [\#1456](https://github.com/vatesfr/xen-orchestra/issues/1456)
- Docker container management functionality missing from v5 [\#1442](https://github.com/vatesfr/xen-orchestra/issues/1442)
- bad error message - delete snapshot [\#1433](https://github.com/vatesfr/xen-orchestra/issues/1433)
- Create tag during VM creation [\#1431](https://github.com/vatesfr/xen-orchestra/issues/1431)

### Bug fixes

- Display issues on plugin array edition [\#1663](https://github.com/vatesfr/xen-orchestra/issues/1663)
- Import of delta backups fails [\#1656](https://github.com/vatesfr/xen-orchestra/issues/1656)
- Host - Missing IP config for PIF [\#1651](https://github.com/vatesfr/xen-orchestra/issues/1651)
- Remote copy is always activating compression [\#1645](https://github.com/vatesfr/xen-orchestra/issues/1645)
- LB plugin UI problems [\#1630](https://github.com/vatesfr/xen-orchestra/issues/1630)
- Keyboard shortcuts should not work when a modal is open [\#1589](https://github.com/vatesfr/xen-orchestra/issues/1589)
- UI small bug in drop-down lists [\#1411](https://github.com/vatesfr/xen-orchestra/issues/1411)
- md5 delta backup error [\#1672](https://github.com/vatesfr/xen-orchestra/issues/1672)
- Can't edit VIF network [\#1640](https://github.com/vatesfr/xen-orchestra/issues/1640)
- Do not expose shortcuts while console is focused [\#1614](https://github.com/vatesfr/xen-orchestra/issues/1614)
- All users can see VM templates [\#1621](https://github.com/vatesfr/xen-orchestra/issues/1621)
- Profile page is broken [\#1612](https://github.com/vatesfr/xen-orchestra/issues/1612)
- SR delete should redirect to home [\#1611](https://github.com/vatesfr/xen-orchestra/issues/1611)
- Delta VHD backup checksum is invalidated by chaining [\#1606](https://github.com/vatesfr/xen-orchestra/issues/1606)
- VM with long description break on 2 lines [\#1580](https://github.com/vatesfr/xen-orchestra/issues/1580)
- Network status on VM edition [\#1573](https://github.com/vatesfr/xen-orchestra/issues/1573)
- VM template deletion fails [\#1571](https://github.com/vatesfr/xen-orchestra/issues/1571)
- Template edition - "no such object" [\#1569](https://github.com/vatesfr/xen-orchestra/issues/1569)
- missing links / element not displayed as links [\#1567](https://github.com/vatesfr/xen-orchestra/issues/1567)
- Backup restore stalled on some SMB shares [\#1412](https://github.com/vatesfr/xen-orchestra/issues/1412)
- Wrong bond display [\#1156](https://github.com/vatesfr/xen-orchestra/issues/1156)
- Multiple reboot selection doesn't work [\#1562](https://github.com/vatesfr/xen-orchestra/issues/1562)
- Server logs should be displayed in reverse chronological order [\#1547](https://github.com/vatesfr/xen-orchestra/issues/1547)
- Cannot create resource sets without limits [\#1537](https://github.com/vatesfr/xen-orchestra/issues/1537)
- UI - Weird display when editing long VM desc [\#1528](https://github.com/vatesfr/xen-orchestra/issues/1528)
- Useless iso selector in host console [\#1527](https://github.com/vatesfr/xen-orchestra/issues/1527)
- Pool and Host dummy welcome message [\#1519](https://github.com/vatesfr/xen-orchestra/issues/1519)
- Bug on Network VM tab [\#1518](https://github.com/vatesfr/xen-orchestra/issues/1518)
- Link to home with filter in query does not work [\#1513](https://github.com/vatesfr/xen-orchestra/issues/1513)
- VHD merge fails with "RangeError: index out of range" on SMB remote [\#1511](https://github.com/vatesfr/xen-orchestra/issues/1511)
- DR: previous VDIs are not removed [\#1510](https://github.com/vatesfr/xen-orchestra/issues/1510)
- DR: previous copies not removed when same number as depth [\#1509](https://github.com/vatesfr/xen-orchestra/issues/1509)
- Empty Saved Search doesn't load when set to default filter [\#1354](https://github.com/vatesfr/xen-orchestra/issues/1354)
- Removing a user/group should delete its ACLs [\#899](https://github.com/vatesfr/xen-orchestra/issues/899)
- OVA Import - XO stuck during import [\#1551](https://github.com/vatesfr/xen-orchestra/issues/1551)
- SMB remote empty domain fails [\#1499](https://github.com/vatesfr/xen-orchestra/issues/1499)
- Can't edit a remote password [\#1498](https://github.com/vatesfr/xen-orchestra/issues/1498)
- Issue in VM create with CoreOS [\#1493](https://github.com/vatesfr/xen-orchestra/issues/1493)
- Overlapping months in backup view [\#1488](https://github.com/vatesfr/xen-orchestra/issues/1488)
- No line break for SSH key in user view [\#1475](https://github.com/vatesfr/xen-orchestra/issues/1475)
- Create VIF UI issues [\#1472](https://github.com/vatesfr/xen-orchestra/issues/1472)

## **5.2.0** (2016-09-09)

### Enhancements

- IP management [\#1350](https://github.com/vatesfr/xen-orchestra/issues/1350), [\#988](https://github.com/vatesfr/xen-orchestra/issues/988), [\#1427](https://github.com/vatesfr/xen-orchestra/issues/1427) and [\#240](https://github.com/vatesfr/xen-orchestra/issues/240)
- Update reverse proxy example [\#1474](https://github.com/vatesfr/xen-orchestra/issues/1474)
- Improve log view [\#1467](https://github.com/vatesfr/xen-orchestra/issues/1467)
- Backup Reports: e-mail subject [\#1463](https://github.com/vatesfr/xen-orchestra/issues/1463)
- Backup Reports: report the error [\#1462](https://github.com/vatesfr/xen-orchestra/issues/1462)
- Vif selector: select management network by default [\#1425](https://github.com/vatesfr/xen-orchestra/issues/1425)
- Display when browser disconnected to server [\#1417](https://github.com/vatesfr/xen-orchestra/issues/1417)
- Tooltip on OS icon in VM view [\#1416](https://github.com/vatesfr/xen-orchestra/issues/1416)
- Display pool master [\#1407](https://github.com/vatesfr/xen-orchestra/issues/1407)
- Missing tooltips in VM creation view [\#1402](https://github.com/vatesfr/xen-orchestra/issues/1402)
- Handle VBD disconnect and connect [\#1397](https://github.com/vatesfr/xen-orchestra/issues/1397)
- Eject host from a pool [\#1395](https://github.com/vatesfr/xen-orchestra/issues/1395)
- Improve pool general view [\#1393](https://github.com/vatesfr/xen-orchestra/issues/1393)
- Improve patching system [\#1392](https://github.com/vatesfr/xen-orchestra/issues/1392)
- Pool name modification [\#1390](https://github.com/vatesfr/xen-orchestra/issues/1390)
- Confirmation dialog before destroying VDIs [\#1388](https://github.com/vatesfr/xen-orchestra/issues/1388)
- Tooltips for meter object [\#1387](https://github.com/vatesfr/xen-orchestra/issues/1387)
- New Host assistant [\#1374](https://github.com/vatesfr/xen-orchestra/issues/1374)
- New VM assistant [\#1373](https://github.com/vatesfr/xen-orchestra/issues/1373)
- New SR assistant [\#1372](https://github.com/vatesfr/xen-orchestra/issues/1372)
- Direct access to VDI listing from dashboard's SR usage breakdown [\#1371](https://github.com/vatesfr/xen-orchestra/issues/1371)
- Can't set a network name at pool level [\#1368](https://github.com/vatesfr/xen-orchestra/issues/1368)
- Change a few mouse over descriptions [\#1363](https://github.com/vatesfr/xen-orchestra/issues/1363)
- Hide network install in VM create if template is HVM [\#1362](https://github.com/vatesfr/xen-orchestra/issues/1362)
- SR space left during VM creation [\#1358](https://github.com/vatesfr/xen-orchestra/issues/1358)
- Add destination SR on migration modal in VM view [\#1357](https://github.com/vatesfr/xen-orchestra/issues/1357)
- Ability to create a new VM from a snapshot [\#1353](https://github.com/vatesfr/xen-orchestra/issues/1353)
- Missing explanation/confirmation on Snapshot Page [\#1349](https://github.com/vatesfr/xen-orchestra/issues/1349)
- Log view: expose API errors in the web UI [\#1344](https://github.com/vatesfr/xen-orchestra/issues/1344)
- Registration on update page [\#1341](https://github.com/vatesfr/xen-orchestra/issues/1341)
- Add export snapshot button [\#1336](https://github.com/vatesfr/xen-orchestra/issues/1336)
- Use saved SSH keys in VM create CloudConfig [\#1319](https://github.com/vatesfr/xen-orchestra/issues/1319)
- Collapse header in console view [\#1268](https://github.com/vatesfr/xen-orchestra/issues/1268)
- Two max concurrent jobs in parallel [\#915](https://github.com/vatesfr/xen-orchestra/issues/915)
- Handle OVA import via the web UI [\#709](https://github.com/vatesfr/xen-orchestra/issues/709)

### Bug fixes

- Bug on VM console when header is hidden [\#1485](https://github.com/vatesfr/xen-orchestra/issues/1485)
- Disks not removed when deleting multiple VMs [\#1484](https://github.com/vatesfr/xen-orchestra/issues/1484)
- Do not display VDI disconnect button when a VM is not running [\#1470](https://github.com/vatesfr/xen-orchestra/issues/1470)
- Do not display VIF disconnect button when a VM is not running [\#1468](https://github.com/vatesfr/xen-orchestra/issues/1468)
- Error on migration if no default SR \(even when not used\) [\#1466](https://github.com/vatesfr/xen-orchestra/issues/1466)
- DR issue while rotating old backup [\#1464](https://github.com/vatesfr/xen-orchestra/issues/1464)
- Giving resource set to end-user ends with error [\#1448](https://github.com/vatesfr/xen-orchestra/issues/1448)
- Error thrown when cancelling out of Delete User confirmation dialog [\#1439](https://github.com/vatesfr/xen-orchestra/issues/1439)
- Wrong month label shown in Backup and Job scheduler [\#1438](https://github.com/vatesfr/xen-orchestra/issues/1438)
- Bug on Self service creation/edition [\#1428](https://github.com/vatesfr/xen-orchestra/issues/1428)
- ISO selection during VM create is not mounted after [\#1415](https://github.com/vatesfr/xen-orchestra/issues/1415)
- Hosts general view: bad link for storage [\#1408](https://github.com/vatesfr/xen-orchestra/issues/1408)
- Backup Schedule - "Month" and "Day of Week" display error [\#1404](https://github.com/vatesfr/xen-orchestra/issues/1404)
- Migrate dialog doesn't present all available VIF's in new UI interface [\#1403](https://github.com/vatesfr/xen-orchestra/issues/1403)
- NFS mount issues [\#1396](https://github.com/vatesfr/xen-orchestra/issues/1396)
- Select component color [\#1391](https://github.com/vatesfr/xen-orchestra/issues/1391)
- SR created with local path shouldn't be shared [\#1389](https://github.com/vatesfr/xen-orchestra/issues/1389)
- Disks (VBD) are attached to VM in RO mode instead of RW even if RO is unchecked [\#1386](https://github.com/vatesfr/xen-orchestra/issues/1386)
- Re-connection issues between server and XS hosts [\#1384](https://github.com/vatesfr/xen-orchestra/issues/1384)
- Meter object style with Chrome 52 [\#1383](https://github.com/vatesfr/xen-orchestra/issues/1383)
- Editing a rolling snapshot job seems to fail [\#1376](https://github.com/vatesfr/xen-orchestra/issues/1376)
- Dashboard SR usage and total inverted [\#1370](https://github.com/vatesfr/xen-orchestra/issues/1370)
- XenServer connection issue with host while using VGPUs [\#1369](https://github.com/vatesfr/xen-orchestra/issues/1369)
- Job created with v4 are not correctly displayed in v5 [\#1366](https://github.com/vatesfr/xen-orchestra/issues/1366)
- CPU accounting in resource set [\#1365](https://github.com/vatesfr/xen-orchestra/issues/1365)
- Tooltip stay displayed when a button change state [\#1360](https://github.com/vatesfr/xen-orchestra/issues/1360)
- Failure on host reboot [\#1351](https://github.com/vatesfr/xen-orchestra/issues/1351)
- Editing Backup Jobs Without Compression, Slider Always Set To On [\#1339](https://github.com/vatesfr/xen-orchestra/issues/1339)
- Month Selection on Backup Screen Wrong [\#1338](https://github.com/vatesfr/xen-orchestra/issues/1338)
- Delta backup fail when removed VDIs [\#1333](https://github.com/vatesfr/xen-orchestra/issues/1333)

## **5.1.0** (2016-07-26)

### Enhancements

- Improve backups timezone UI [\#1314](https://github.com/vatesfr/xen-orchestra/issues/1314)
- HOME view submenus [\#1306](https://github.com/vatesfr/xen-orchestra/issues/1306)
- Ability for a user to save SSH keys [\#1299](https://github.com/vatesfr/xen-orchestra/issues/1299)
- \[ACLs\] Ability to select all hosts/VMs [\#1296](https://github.com/vatesfr/xen-orchestra/issues/1296)
- Improve scheduling UI [\#1295](https://github.com/vatesfr/xen-orchestra/issues/1295)
- Plugins: Predefined configurations [\#1289](https://github.com/vatesfr/xen-orchestra/issues/1289)
- Button to recompute resource sets limits [\#1287](https://github.com/vatesfr/xen-orchestra/issues/1287)
- Credit scheduler CAP and weight configuration [\#1283](https://github.com/vatesfr/xen-orchestra/issues/1283)
- Migration form problem on the /v5/vms/\_\_UUID\_\_ page when doing xenmotion inside a pool [\#1254](https://github.com/vatesfr/xen-orchestra/issues/1254)
- /v5/\#/pools/\_\_UUID\_\_: patch table improvement [\#1246](https://github.com/vatesfr/xen-orchestra/issues/1246)
- /v5/\#/hosts/\_\_UUID\_\_: patch list improvements ? [\#1245](https://github.com/vatesfr/xen-orchestra/issues/1245)
- F\*cking patches, how do they work? [\#1236](https://github.com/vatesfr/xen-orchestra/issues/1236)
- Change Default Filter [\#1235](https://github.com/vatesfr/xen-orchestra/issues/1235)
- Add a property on jobs to know their state [\#1232](https://github.com/vatesfr/xen-orchestra/issues/1232)
- Spanish translation [\#1231](https://github.com/vatesfr/xen-orchestra/issues/1231)
- Home: "Filter" input and keyboard focus [\#1228](https://github.com/vatesfr/xen-orchestra/issues/1228)
- Display xenserver version [\#1225](https://github.com/vatesfr/xen-orchestra/issues/1225)
- Plugin config: presets & defaults [\#1222](https://github.com/vatesfr/xen-orchestra/issues/1222)
- Allow halted VM migration [\#1216](https://github.com/vatesfr/xen-orchestra/issues/1216)
- Missing confirm dialog on critical button [\#1211](https://github.com/vatesfr/xen-orchestra/issues/1211)
- Backup logs are not sortable [\#1196](https://github.com/vatesfr/xen-orchestra/issues/1196)
- Page title with the name of current object [\#1185](https://github.com/vatesfr/xen-orchestra/issues/1185)
- Existing VIF management [\#1176](https://github.com/vatesfr/xen-orchestra/issues/1176)
- Do not display fast clone option is there isn't template disks [\#1172](https://github.com/vatesfr/xen-orchestra/issues/1172)
- UI issue when adding a user [\#1159](https://github.com/vatesfr/xen-orchestra/issues/1159)
- Combined values on stats [\#1158](https://github.com/vatesfr/xen-orchestra/issues/1158)
- Parallel coordinates graph [\#1157](https://github.com/vatesfr/xen-orchestra/issues/1157)
- VM creation on self-service as user [\#1155](https://github.com/vatesfr/xen-orchestra/issues/1155)
- VM copy bulk action on home view [\#1154](https://github.com/vatesfr/xen-orchestra/issues/1154)
- Better VDI map [\#1151](https://github.com/vatesfr/xen-orchestra/issues/1151)
- Missing tooltips on buttons [\#1150](https://github.com/vatesfr/xen-orchestra/issues/1150)
- Patching from pool view [\#1149](https://github.com/vatesfr/xen-orchestra/issues/1149)
- Missing patches in dashboard [\#1148](https://github.com/vatesfr/xen-orchestra/issues/1148)
- Improve tasks view [\#1147](https://github.com/vatesfr/xen-orchestra/issues/1147)
- Home bulk VM migration [\#1146](https://github.com/vatesfr/xen-orchestra/issues/1146)
- LDAP plugin clear password field [\#1145](https://github.com/vatesfr/xen-orchestra/issues/1145)
- Cron default behavior [\#1144](https://github.com/vatesfr/xen-orchestra/issues/1144)
- Modal for migrate on home [\#1143](https://github.com/vatesfr/xen-orchestra/issues/1143)
- /v5/\#/srs/\_\_UUID\_\_: UI improvements [\#1142](https://github.com/vatesfr/xen-orchestra/issues/1142)
- /v5/\#/pools/: some name should be links [\#1141](https://github.com/vatesfr/xen-orchestra/issues/1141)
- create the page /v5/\#/pools/ [\#1140](https://github.com/vatesfr/xen-orchestra/issues/1140)
- Dashboard: add links to different part of XOA [\#1139](https://github.com/vatesfr/xen-orchestra/issues/1139)
- /v5/\#/dashboard/overview: add link on the "Top 5 SR Usage" graph [\#1135](https://github.com/vatesfr/xen-orchestra/issues/1135)
- /v5/\#/backup/overview: display the error when there is one returned by xenserver on failed job. [\#1134](https://github.com/vatesfr/xen-orchestra/issues/1134)
- /v5/: add an option to set the number of element displayed in tables [\#1133](https://github.com/vatesfr/xen-orchestra/issues/1133)
- Updater refresh page after update [\#1131](https://github.com/vatesfr/xen-orchestra/issues/1131)
- /v5/\#/settings/plugins [\#1130](https://github.com/vatesfr/xen-orchestra/issues/1130)
- /v5/\#/new/sr: layout issue [\#1129](https://github.com/vatesfr/xen-orchestra/issues/1129)
- v5 /v5/\#/vms/new: layout issue [\#1128](https://github.com/vatesfr/xen-orchestra/issues/1128)
- v5 user page missing style [\#1127](https://github.com/vatesfr/xen-orchestra/issues/1127)
- Remote helper/tester [\#1075](https://github.com/vatesfr/xen-orchestra/issues/1075)
- Generate uiSchema from custom schema properties [\#951](https://github.com/vatesfr/xen-orchestra/issues/951)
- Customizing VM names generation during batch creation [\#949](https://github.com/vatesfr/xen-orchestra/issues/949)

### Bug fixes

- Plugins: Don't use `default` attributes in presets list [\#1288](https://github.com/vatesfr/xen-orchestra/issues/1288)
- CPU weight must be an integer [\#1286](https://github.com/vatesfr/xen-orchestra/issues/1286)
- Overview of self service is always empty [\#1282](https://github.com/vatesfr/xen-orchestra/issues/1282)
- SR attach/creation issue [\#1281](https://github.com/vatesfr/xen-orchestra/issues/1281)
- Self service resources not modified after a VM deletion [\#1276](https://github.com/vatesfr/xen-orchestra/issues/1276)
- Scheduled jobs seems use GMT since 5.0 [\#1258](https://github.com/vatesfr/xen-orchestra/issues/1258)
- Can't create a VM with disks on 2 different SRs [\#1257](https://github.com/vatesfr/xen-orchestra/issues/1257)
- Graph display bug [\#1247](https://github.com/vatesfr/xen-orchestra/issues/1247)
- /v5/#/hosts/**UUID**: Patch list not limited to the current pool [\#1244](https://github.com/vatesfr/xen-orchestra/issues/1244)
- Replication issues [\#1233](https://github.com/vatesfr/xen-orchestra/issues/1233)
- VM creation install method disabled fields [\#1198](https://github.com/vatesfr/xen-orchestra/issues/1198)
- Update icon shouldn't be displayed when menu is collapsed [\#1188](https://github.com/vatesfr/xen-orchestra/issues/1188)
- /v5/ : Load average graph axis issue [\#1167](https://github.com/vatesfr/xen-orchestra/issues/1167)
- Some remote can't be opened [\#1164](https://github.com/vatesfr/xen-orchestra/issues/1164)
- Bulk action for hosts in home and pool view [\#1153](https://github.com/vatesfr/xen-orchestra/issues/1153)
- New Vif [\#1138](https://github.com/vatesfr/xen-orchestra/issues/1138)
- Missing SRs [\#1123](https://github.com/vatesfr/xen-orchestra/issues/1123)
- Continuous replication email alert does not obey per job setting [\#1121](https://github.com/vatesfr/xen-orchestra/issues/1121)
- Safari XO5 issue [\#1120](https://github.com/vatesfr/xen-orchestra/issues/1120)
- ACLs should be available in Enterprise Edition [\#1118](https://github.com/vatesfr/xen-orchestra/issues/1118)
- SR edit name or description doesn't work [\#1116](https://github.com/vatesfr/xen-orchestra/issues/1116)
- Bad RRD parsing for VIFs [\#969](https://github.com/vatesfr/xen-orchestra/issues/969)

## **5.0.0** (2016-06-24)

### Enhancements

- Handle failed quiesce in snapshots [\#1088](https://github.com/vatesfr/xen-orchestra/issues/1088)
- Sparklines stats [\#1061](https://github.com/vatesfr/xen-orchestra/issues/1061)
- Task view [\#1060](https://github.com/vatesfr/xen-orchestra/issues/1060)
- Improved import system [\#1048](https://github.com/vatesfr/xen-orchestra/issues/1048)
- Backup restore view improvements [\#1021](https://github.com/vatesfr/xen-orchestra/issues/1021)
- Restore VM - Wrong VLAN on the VMs interface [\#1016](https://github.com/vatesfr/xen-orchestra/issues/1016)
- Fast Disk Cloning [\#960](https://github.com/vatesfr/xen-orchestra/issues/960)
- Disaster recovery job should target SRs, not pools [\#955](https://github.com/vatesfr/xen-orchestra/issues/955)
- Improve Header/Content interaction in a page [\#926](https://github.com/vatesfr/xen-orchestra/issues/926)
- New default view [\#912](https://github.com/vatesfr/xen-orchestra/issues/912)
- Xen Patching - Restart Pending [\#883](https://github.com/vatesfr/xen-orchestra/issues/883)
- Hide About page for user that are not admin [\#877](https://github.com/vatesfr/xen-orchestra/issues/877)
- ACL: Ability to view/sort/group by User/Group, Objects or Role [\#875](https://github.com/vatesfr/xen-orchestra/issues/875)
- ACL: Ability to select multiple users & group when creating a rule [\#874](https://github.com/vatesfr/xen-orchestra/issues/874)
- Translation [\#839](https://github.com/vatesfr/xen-orchestra/issues/839)
- XO offer useless network interfaces for XenMotion [\#833](https://github.com/vatesfr/xen-orchestra/issues/833)
- Show HVM, PVM, PVHVM modes in guest details [\#806](https://github.com/vatesfr/xen-orchestra/issues/806)
- Tree view: display cpu available/total for each host [\#696](https://github.com/vatesfr/xen-orchestra/issues/696)
- Greenkeeper integration [\#667](https://github.com/vatesfr/xen-orchestra/issues/667)
- Clarify vCPUs and RAM editor [\#658](https://github.com/vatesfr/xen-orchestra/issues/658)
- Backup LZ4 compression [\#647](https://github.com/vatesfr/xen-orchestra/issues/647)
- Support enum in plugins configuration [\#638](https://github.com/vatesfr/xen-orchestra/issues/638)
- Add configuration option to disable xoa-updater [\#535](https://github.com/vatesfr/xen-orchestra/issues/535)
- Use cursors to add more context to actions [\#523](https://github.com/vatesfr/xen-orchestra/issues/523)
- Review UI for flat view [\#354](https://github.com/vatesfr/xen-orchestra/issues/354)
- Review UI for the tree view [\#353](https://github.com/vatesfr/xen-orchestra/issues/353)
- Tag filtering [\#233](https://github.com/vatesfr/xen-orchestra/issues/233)
- GUI review [\#230](https://github.com/vatesfr/xen-orchestra/issues/230)
- Review UI for VM creation [\#214](https://github.com/vatesfr/xen-orchestra/issues/214)
- Ability to collapse pools/hosts in main view [\#173](https://github.com/vatesfr/xen-orchestra/issues/173)
- Issue importing .xva VM via xo-web [\#1022](https://github.com/vatesfr/xen-orchestra/issues/1022)
- Enhancement Proposal - Cancel In Progress Backups [\#1003](https://github.com/vatesfr/xen-orchestra/issues/1003)
- Can't create VM with CloudConfigDrive [\#917](https://github.com/vatesfr/xen-orchestra/issues/917)
- Auth: LDAP User causes problems [\#893](https://github.com/vatesfr/xen-orchestra/issues/893)
- No tags in Continuous Replication [\#838](https://github.com/vatesfr/xen-orchestra/issues/838)
- Delta backup Depth not working [\#802](https://github.com/vatesfr/xen-orchestra/issues/802)
- Update Section - Running version info missing - gui enhancement [\#795](https://github.com/vatesfr/xen-orchestra/issues/795)
- On reboot, vnc console wrongly scaled [\#722](https://github.com/vatesfr/xen-orchestra/issues/722)
- Make the object name \(title\) "sticky" at the top of the page [\#705](https://github.com/vatesfr/xen-orchestra/issues/705)
- pool view: display Local SR from hosts in the current pool [\#692](https://github.com/vatesfr/xen-orchestra/issues/692)
- tree view: display all IPs [\#689](https://github.com/vatesfr/xen-orchestra/issues/689)
- XO5 parallel distribution [\#462](https://github.com/vatesfr/xen-orchestra/issues/462)
- Load balancing with XO [\#423](https://github.com/vatesfr/xen-orchestra/issues/423)

### Bug fixes

- vCPUs number when no tools installed [\#1089](https://github.com/vatesfr/xen-orchestra/issues/1089)
- Config Drive textbox disappears when content is deleted [\#1012](https://github.com/vatesfr/xen-orchestra/issues/1012)
- storage status not changed in host view page after disconnect/connect [\#1009](https://github.com/vatesfr/xen-orchestra/issues/1009)
- Cannot Delete Logs From Backup Overview [\#1004](https://github.com/vatesfr/xen-orchestra/issues/1004)
- \[v5.x\] Plugins configuration: optional non-used objects are sent [\#1000](https://github.com/vatesfr/xen-orchestra/issues/1000)
- "@" char in remote password break the remote view [\#997](https://github.com/vatesfr/xen-orchestra/issues/997)
- Handle MEMORY_CONSTRAINT_VIOLATION correctly [\#970](https://github.com/vatesfr/xen-orchestra/issues/970)
- VM creation error on XenServer Dundee [\#964](https://github.com/vatesfr/xen-orchestra/issues/964)
- Copy VMs doesn't display all SRs [\#945](https://github.com/vatesfr/xen-orchestra/issues/945)
- Autopower_on wrong value [\#937](https://github.com/vatesfr/xen-orchestra/issues/937)
- Correctly handle unknown users in group view [\#900](https://github.com/vatesfr/xen-orchestra/issues/900)
- Importing into Dundee [\#887](https://github.com/vatesfr/xen-orchestra/issues/887)
- update status - gui resize issue [\#803](https://github.com/vatesfr/xen-orchestra/issues/803)
- Backup Remote Stores Problem [\#751](https://github.com/vatesfr/xen-orchestra/issues/751)
- VM view is broken when changing a disk SR twice [\#670](https://github.com/vatesfr/xen-orchestra/issues/670)
- console mouse sync [\#280](https://github.com/vatesfr/xen-orchestra/issues/280)
