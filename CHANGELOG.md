# ChangeLog

## **next**

### Enhancements

- [Plugin/backup-reports] Add VM Description to the backup report. (contribution made by [@truongtx8](https://github.com/truongtx8)) (PR [#8253](https://github.com/vatesfr/xen-orchestra/pull/8253))
- **XO6**:
  - [Dashboard] Adding a mobile layout (PR [#8268](https://github.com/vatesfr/xen-orchestra/pull/8268))
- [REST API] Swagger interface available on `/rest/v0/docs` endpoint. Endpoint documentation will be added step by step (PR [#8316](https://github.com/vatesfr/xen-orchestra/pull/8316))
- [REST API] Implement CRUD for `groups` (PRs [#8276](https://github.com/vatesfr/xen-orchestra/pull/8276), [#8277](https://github.com/vatesfr/xen-orchestra/pull/8277), [#8278](https://github.com/vatesfr/xen-orchestra/pull/8278), [#8334](https://github.com/vatesfr/xen-orchestra/pull/8334), [#8336](https://github.com/vatesfr/xen-orchestra/pull/8336))
- [REST API] Ability to create a user (PR [#8282](https://github.com/vatesfr/xen-orchestra/pull/8282))
- [Hosts] Smart reboot improvements : unexpected suspend failures will automatically fall back (PR [#8333](https://github.com/vatesfr/xen-orchestra/pull/8333))

### Bug fixes

- [SDN-controller] Fix _No PIF found_ error when creating a private network [#8027](https://github.com/vatesfr/xen-orchestra/issues/8027) (PR [#8319](https://github.com/vatesfr/xen-orchestra/pull/8319))
- [V2V] Fix `fail to power off vm vm-XXXXXX, state:queued.` when powering down source VM (PR [#8328](https://github.com/vatesfr/xen-orchestra/pull/8328))
- [V2] Fix `Cannot read properties of undefined (reading 'map')` with empty datastore (PR [#8311](https://github.com/vatesfr/xen-orchestra/pull/8311))
- [Plugin/audit] Do not log call to `host.getBiosInfo` and `host.getMdadmHealth`

### Released packages

- @vates/generator-toolbox 1.0.0
- @vates/task 0.6.1
- @vates/types 1.0.0
- @xen-orchestra/web-core 0.14.0
- @xen-orchestra/web 0.10.0
- xo-server 5.171.0
- xo-server-audit 0.12.3
- xo-server-auth-oidc 0.3.1
- xo-server-backup-reports 1.5.0
- xo-server-sdn-controller 1.1.0
- @xen-orchestra/backups 0.58.2
- @xen-orchestra/mixins 0.16.3
- @xen-orchestra/proxy 0.29.13
- @xen-orchestra/rest-api 0.1.1
- @xen-orchestra/vmware-explorer 0.9.2
- @xen-orchestra/xapi 8.0.1

## **5.103.1** (2025-02-04)

<img id="latest" src="https://badgen.net/badge/channel/latest/yellow" alt="Channel: latest" />

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
- [V2V] Improve compatiblity whith VSphere handling multiple vSAN storages (PR [#8243](https://github.com/vatesfr/xen-orchestra/pull/8243))
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

<img id="stable" src="https://badgen.net/badge/channel/stable/green" alt="Channel: stable" />

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
- [Backups] Fix MESSAGE_METHOD_UNKOWN(VDI.get_cbt_enabled) on XenServer < 7.3 (PR [#8038](https://github.com/vatesfr/xen-orchestra/pull/8038))
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
- [New/SR] Fix 'an error as occured' when creating a new SR (PR [#7931](https://github.com/vatesfr/xen-orchestra/pull/7931))
- [VM/General] Fix 'an error as occured' in general tab view for non-admin users (PR [#7928](https://github.com/vatesfr/xen-orchestra/pull/7928))
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
- [Rolling Pool Update] Fixed RPU failing to install patches on hosts (and still appearing as successfull) (PR [#7640](https://github.com/vatesfr/xen-orchestra/pull/7640))
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

- [New XOSTOR] Display a warning when replication count is higher than number of hosts with disks (PR [#7625](https://github.com/vatesfr/xen-orchestra/pull/7625))
- [XOSTOR] Ability to copy VDI UUID in the resources table (PR [#7629](https://github.com/vatesfr/xen-orchestra/pull/7629))

### Bug fixes

- [Pool] Fix `Headers Timeout Error` when installing patches on XCP-ng
- [Pool/Advanced] Only show current pool's SRs in default SR selector (PR [#7626](https://github.com/vatesfr/xen-orchestra/pull/7626))
- [SR/XOSTOR] Fix `an error has occured` in the Resource List (PR [#7630](https://github.com/vatesfr/xen-orchestra/pull/7630))
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
- [XOSTOR] Move `ignore file sytems` outside of advanced settings (PR [#7429](https://github.com/vatesfr/xen-orchestra/pull/7429))
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
- [Home & REST API] `$container` field of an halted VM now points to a host if a VDI is on a local storage [Forum#71769](https://xcp-ng.org/forum/post/71769)
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
- [Host/Reboot] Fix false positive warning when restarting an host after updates (PR [#7366](https://github.com/vatesfr/xen-orchestra/pull/7366))
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

- [Patches] Support new XenServer Updates system. See [our documentation](https://xen-orchestra.com/docs/updater.html#xenserver-updates). (PR [#7044](https://github.com/vatesfr/xen-orchestra/pull/7044))
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
- [Netbox] New major version. BREAKING: in order for this new version to work, you need to assign the type `virtualization > vminterface` to the custom field `UUID` in your Netbox instance. [See documentation](https://xen-orchestra.com/docs/advanced.html#netbox). [#6038](https://github.com/vatesfr/xen-orchestra/issues/6038) [#6135](https://github.com/vatesfr/xen-orchestra/issues/6135) [#6024](https://github.com/vatesfr/xen-orchestra/issues/6024) [#6036](https://github.com/vatesfr/xen-orchestra/issues/6036) [Forum#6070](https://xcp-ng.org/forum/topic/6070) [Forum#6149](https://xcp-ng.org/forum/topic/6149) [Forum#6332](https://xcp-ng.org/forum/topic/6332) [Forum#6902](https://xcp-ng.org/forum/topic/6902) (PR [#6950](https://github.com/vatesfr/xen-orchestra/pull/6950))
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
- [ESXi Import] was depending on an older unmaintened library that was downgrading the global security level of XO (PR [#6859](https://github.com/vatesfr/xen-orchestra/pull/6859))
- [Backup] Fix memory consumption when deleting _VHD directory_ incremental backups
- [Remote] Fix `remote is disabled` error when editing a disabled remote
- [Settings/Servers] Fix connectiong using an explicit IPv6 address
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

- [Backup] Implementation of mirror backup (Entreprise plan) (PRs [#6858](https://github.com/vatesfr/xen-orchestra/pull/6858), [#6854](https://github.com/vatesfr/xen-orchestra/pull/6854))
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
- [Home/host] When ahost has an inconsistent time with XOA, an alert is displayed (PR [#6833](https://github.com/vatesfr/xen-orchestra/pull/6833))
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
- [Backup/Health check] [Opt-in XenStore API](https://xen-orchestra.com/docs/backups.html#backup-health-check) to execute custom checks inside the VM (PR [#6784](https://github.com/vatesfr/xen-orchestra/pull/6784))

### Enhancements

- [VM/Advanced] Automatically eject removable medias when converting a VM to a template [#6752](https://github.com/vatesfr/xen-orchestra/issues/6752) (PR [#6769](https://github.com/vatesfr/xen-orchestra/pull/6769))
- [Dashboard/Health] Add free space column for storage state table (PR [#6778](https://github.com/vatesfr/xen-orchestra/pull/6778))
- [VM/General] Displays the template name used to create the VM, as well as the email address of the VM creator for admin users (PR [#6771](https://github.com/vatesfr/xen-orchestra/pull/6771))
- [Kubernetes] Give the possibility to create an high availability cluster (PR [#6794](https://github.com/vatesfr/xen-orchestra/pull/6794))

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

- [Backup/Restore] Fix restore via a proxy showing as interupted (PR [#6702](https://github.com/vatesfr/xen-orchestra/pull/6702))
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
- [Plugin/transport-nagios] XO now reports backed up VMs invidually with the VM name label used as _host_ and backup job name used as _service_
- [VM/Advanced] Add warm migration button (PR [#6533](https://github.com/vatesfr/xen-orchestra/pull/6533))

### Bug fixes

- [Dashboard/Health] Fix `Unknown SR` and `Unknown VDI` in Unhealthy VDIs (PR [#6519](https://github.com/vatesfr/xen-orchestra/pull/6519))
- [Delta Backup] Can now recover VHD merge when failed at the begining
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
- [Backup] VMs with USB Pass-through devices are now supported! The advanced _Offline Snapshot Mode_ setting must be enabled. For Full Backup or Disaster Recovery jobs, Rolling Snapshot needs to be anabled as well. (PR [#6239](https://github.com/vatesfr/xen-orchestra/pull/6239))
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
- [S3] remote fom did not save the `https` and `allow unatuhorized`during remote creation (PR [#6219](https://github.com/vatesfr/xen-orchestra/pull/6219))
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
- [Dashboad/Health] List all VDIs that need coalescing (PR [#6120](https://github.com/vatesfr/xen-orchestra/pull/6120))
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
- [Backup] Fix backuping restored VMs
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
