# ChangeLog before 2022

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

- [Dashboard/Health] Fix `error has occured` when a pool has no default SR
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

- [S3] Ability to authorize self signed certificates for S3 remote (PR [#5961](https://github.com/vatesfr/xen-orchestra/pull/5961))

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

- [VM/disks] Fix `an error has occured` when self service user was on VM disk view (PR [#5841](https://github.com/vatesfr/xen-orchestra/pull/5841))
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
- [Backup] Limit number of connections to hosts, which should reduce the occurences of `ECONNRESET`
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
- [SDN Controller] Add/Remove netork traffic rules for a VM's VIFs (PR [#5135](https://github.com/vatesfr/xen-orchestra/pull/5135))
- [Backup/health] Show VM snapshots with missing jobs, schedules or VMs [#5086](https://github.com/vatesfr/xen-orchestra/issues/5086) (PR [#5125](https://github.com/vatesfr/xen-orchestra/pull/5125))
- [New delta backup] Show a warning icon when the advanced full backup interval setting and the backup retention are higher than 50 (PR (https://github.com/vatesfr/xen-orchestra/pull/5144))
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
- [SDN Controller] Fix broken private network creation when specifiyng a preferred center [#5076](https://github.com/vatesfr/xen-orchestra/issues/5076) (PRs [#5079](https://github.com/vatesfr/xen-orchestra/pull/5079) & [#5080](https://github.com/vatesfr/xen-orchestra/pull/5080))
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
- Automatic generation of self signed certificate if `autoCert` is not `false` in `xo-server`'s configuration in the corresponding `http.listen` section (PR [#4954](https://github.com/vatesfr/xen-orchestra/pull/4954))
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

- [Backup Reports] Report not sent if reportWhen failure and at least a VM is successfull [#3181](https://github.com/vatesfr/xen-orchestra/issues/3181) (PR [#3185](https://github.com/vatesfr/xen-orchestra/pull/3185))
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
- [Delta Backup NG logs] Display wether the export is a full or a delta [#2711](https://github.com/vatesfr/xen-orchestra/issues/2711)
- Copy VDIs' UUID from SR/disks view [#3051](https://github.com/vatesfr/xen-orchestra/issues/3051)
- [Backup NG] New option to shutdown VMs before snapshotting them [#3058](https://github.com/vatesfr/xen-orchestra/issues/3058#event-1673756438)
- [Backup NG form] Improve feedback [#2711](https://github.com/vatesfr/xen-orchestra/issues/2711)
- [Backup NG] Different retentions for backup and replication [#2895](https://github.com/vatesfr/xen-orchestra/issues/2895)
- Possibility to use a fast clone when creating a VM from a snapshot [#2937](https://github.com/vatesfr/xen-orchestra/issues/2937)
- Ability to customize cloud config templates [#2984](https://github.com/vatesfr/xen-orchestra/issues/2984)
- Add Backup deprecation message and link to Backup NG migration blog post [#3089](https://github.com/vatesfr/xen-orchestra/issues/3089)
- [Backup NG] Ability to cancel a running backup job [#3047](https://github.com/vatesfr/xen-orchestra/issues/3047)
- [Backup NG form] Ability to enable/disable a schedule [#3062](https://github.com/vatesfr/xen-orchestra/issues/3062)
- New backup/health view with non-existent backup snapshots table [#3090](https://github.com/vatesfr/xen-orchestra/issues/3090)
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
- ACLs shoud be available in Enterprise Edition [\#1118](https://github.com/vatesfr/xen-orchestra/issues/1118)
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
- XO offer useless network interfaces for XenMontion [\#833](https://github.com/vatesfr/xen-orchestra/issues/833)
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

## **4.16.0** (2016-04-29)

Maintenance release

### Enhancements

- TOO_MANY_PENDING_TASKS [\#861](https://github.com/vatesfr/xen-orchestra/issues/861)

### Bug fixes

- Incorrect VM target name with continuous replication [\#904](https://github.com/vatesfr/xen-orchestra/issues/904)
- Error while deleting users [\#901](https://github.com/vatesfr/xen-orchestra/issues/901)
- Use an available path to the SR to create a config drive [\#882](https://github.com/vatesfr/xen-orchestra/issues/882)
- VM autoboot don't set the right pool parameter [\#879](https://github.com/vatesfr/xen-orchestra/issues/879)
- BUG: ACL with NFS ISO Library not working! [\#870](https://github.com/vatesfr/xen-orchestra/issues/870)
- Broken paths in backups in SMB [\#865](https://github.com/vatesfr/xen-orchestra/issues/865)
- Plugins page loads users/groups multiple times [\#829](https://github.com/vatesfr/xen-orchestra/issues/829)
- "Ghost" VM remains after migration [\#769](https://github.com/vatesfr/xen-orchestra/issues/769)

## **4.15.0** (2016-03-21)

Load balancing, SMB delta support, advanced network operations...

### Enhancements

- Add the job name inside the backup email report [\#819](https://github.com/vatesfr/xen-orchestra/issues/819)
- Delta backup with quiesce [\#812](https://github.com/vatesfr/xen-orchestra/issues/812)
- Hosts: No user feedback when error occurs with SR connect / disconnect [\#810](https://github.com/vatesfr/xen-orchestra/issues/810)
- Expose components versions [\#807](https://github.com/vatesfr/xen-orchestra/issues/807)
- Rework networks/PIFs management [\#805](https://github.com/vatesfr/xen-orchestra/issues/805)
- Displaying all SRs and a list of available hosts for creating VM from a pool [\#790](https://github.com/vatesfr/xen-orchestra/issues/790)
- Add "Source network" on "VM migration" screen [\#785](https://github.com/vatesfr/xen-orchestra/issues/785)
- Migration queue [\#783](https://github.com/vatesfr/xen-orchestra/issues/783)
- Match network names for VM migration [\#782](https://github.com/vatesfr/xen-orchestra/issues/782)
- Disk names [\#780](https://github.com/vatesfr/xen-orchestra/issues/780)
- Self service: should the user be able to set the CPU weight? [\#767](https://github.com/vatesfr/xen-orchestra/issues/767)
- host & pool Citrix license status [\#763](https://github.com/vatesfr/xen-orchestra/issues/763)
- pool view: Provide "updates" section [\#762](https://github.com/vatesfr/xen-orchestra/issues/762)
- XOA ISO image: ambiguous root disk label [\#761](https://github.com/vatesfr/xen-orchestra/issues/761)
- Host info: provide system serial number [\#760](https://github.com/vatesfr/xen-orchestra/issues/760)
- CIFS ISO SR Creation [\#731](https://github.com/vatesfr/xen-orchestra/issues/731)
- MAC address not preserved on VM restore [\#707](https://github.com/vatesfr/xen-orchestra/issues/707)
- Failing replication job should send reports [\#659](https://github.com/vatesfr/xen-orchestra/issues/659)
- Display networks in the Pool view [\#226](https://github.com/vatesfr/xen-orchestra/issues/226)

### Bug fixes

- Broken link to backup remote [\#821](https://github.com/vatesfr/xen-orchestra/issues/821)
- Issue with self-signed cert for email plugin [\#817](https://github.com/vatesfr/xen-orchestra/issues/817)
- Plugins view, reset form and errors [\#815](https://github.com/vatesfr/xen-orchestra/issues/815)
- HVM recovery mode is broken [\#794](https://github.com/vatesfr/xen-orchestra/issues/794)
- Disk bug when creating vm from template [\#778](https://github.com/vatesfr/xen-orchestra/issues/778)
- Can't mount NFS shares in remote stores [\#775](https://github.com/vatesfr/xen-orchestra/issues/775)
- VM disk name and description not passed during creation [\#774](https://github.com/vatesfr/xen-orchestra/issues/774)
- NFS mount problem for Windows share [\#771](https://github.com/vatesfr/xen-orchestra/issues/771)
- lodash.pluck not installed [\#757](https://github.com/vatesfr/xen-orchestra/issues/757)
- this.\_getAuthenticationTokensForUser is not a function [\#755](https://github.com/vatesfr/xen-orchestra/issues/755)
- CentOS 6.x 64bit template creates a VM that won't boot [\#733](https://github.com/vatesfr/xen-orchestra/issues/733)
- Lot of xo:perf leading to XO crash [\#575](https://github.com/vatesfr/xen-orchestra/issues/575)
- New collection checklist [\#262](https://github.com/vatesfr/xen-orchestra/issues/262)

## **4.14.0** (2016-02-23)

Self service, custom CloudInit...

### Enhancements

- VM creation self service with quotas [\#285](https://github.com/vatesfr/xen-orchestra/issues/285)
- Cloud config custom user data [\#706](https://github.com/vatesfr/xen-orchestra/issues/706)
- Patches behind a proxy [\#737](https://github.com/vatesfr/xen-orchestra/issues/737)
- Remote store status indicator [\#728](https://github.com/vatesfr/xen-orchestra/issues/728)
- Patch list order [\#724](https://github.com/vatesfr/xen-orchestra/issues/724)
- Enable reporting on additional backup types [\#717](https://github.com/vatesfr/xen-orchestra/issues/717)
- Tooltip name for cancel [\#703](https://github.com/vatesfr/xen-orchestra/issues/703)
- Portable VHD merging [\#646](https://github.com/vatesfr/xen-orchestra/issues/646)

### Bug fixes

- Avoid merge between two delta vdi backups [\#702](https://github.com/vatesfr/xen-orchestra/issues/702)
- Text in table is not cut anymore [\#713](https://github.com/vatesfr/xen-orchestra/issues/713)
- Disk size edition issue with float numbers [\#719](https://github.com/vatesfr/xen-orchestra/issues/719)
- Create vm, summary is not refreshed [\#721](https://github.com/vatesfr/xen-orchestra/issues/721)
- Boot order problem [\#726](https://github.com/vatesfr/xen-orchestra/issues/726)

## **4.13.0** (2016-02-05)

Backup checksum, SMB remotes...

### Enhancements

- Add SMB mount for remote [\#338](https://github.com/vatesfr/xen-orchestra/issues/338)
- Centralize Perm in a lib [\#345](https://github.com/vatesfr/xen-orchestra/issues/345)
- Expose interpool migration details [\#567](https://github.com/vatesfr/xen-orchestra/issues/567)
- Add checksum for delta backup [\#617](https://github.com/vatesfr/xen-orchestra/issues/617)
- Redirect from HTTP to HTTPS [\#626](https://github.com/vatesfr/xen-orchestra/issues/626)
- Expose vCPU weight [\#633](https://github.com/vatesfr/xen-orchestra/issues/633)
- Avoid metadata in delta backup [\#651](https://github.com/vatesfr/xen-orchestra/issues/651)
- Button to clear logs [\#661](https://github.com/vatesfr/xen-orchestra/issues/661)
- Units for RAM and disks [\#666](https://github.com/vatesfr/xen-orchestra/issues/666)
- Remove multiple VDIs at once [\#676](https://github.com/vatesfr/xen-orchestra/issues/676)
- Find orphaned VDI snapshots [\#679](https://github.com/vatesfr/xen-orchestra/issues/679)
- New health view in Dashboard [\#680](https://github.com/vatesfr/xen-orchestra/issues/680)
- Use physical usage for VDI and SR [\#682](https://github.com/vatesfr/xen-orchestra/issues/682)
- TLS configuration [\#685](https://github.com/vatesfr/xen-orchestra/issues/685)
- Better VM info on tree view [\#688](https://github.com/vatesfr/xen-orchestra/issues/688)
- Absolute values in tooltips for tree view [\#690](https://github.com/vatesfr/xen-orchestra/issues/690)
- Absolute values for host memory [\#691](https://github.com/vatesfr/xen-orchestra/issues/691)

### Bug fixes

- Issues on host console screen [\#672](https://github.com/vatesfr/xen-orchestra/issues/672)
- NFS remote mount fails in particular case [\#665](https://github.com/vatesfr/xen-orchestra/issues/665)
- Unresponsive pages [\#662](https://github.com/vatesfr/xen-orchestra/issues/662)
- Live migration fail in the same pool with local SR fails [\#655](https://github.com/vatesfr/xen-orchestra/issues/655)

## **4.12.0** (2016-01-18)

Continuous Replication, Continuous Delta backup...

### Enhancements

- Continuous VM replication [\#582](https://github.com/vatesfr/xen-orchestra/issues/582)
- Continuous Delta Backup [\#576](https://github.com/vatesfr/xen-orchestra/issues/576)
- Scheduler should not run job again if previous instance is not finished [\#642](https://github.com/vatesfr/xen-orchestra/issues/642)
- Boot VM automatically after creation [\#635](https://github.com/vatesfr/xen-orchestra/issues/635)
- Manage existing VIFs in templates [\#630](https://github.com/vatesfr/xen-orchestra/issues/630)
- Support templates with existing install repository [\#627](https://github.com/vatesfr/xen-orchestra/issues/627)
- Remove running VMs [\#616](https://github.com/vatesfr/xen-orchestra/issues/616)
- Prevent a VM to start before delta import is finished [\#613](https://github.com/vatesfr/xen-orchestra/issues/613)
- Spawn multiple VMs at once [\#606](https://github.com/vatesfr/xen-orchestra/issues/606)
- Fixed `suspendVM` in tree view. [\#619](https://github.com/vatesfr/xen-orchestra/pull/619) ([pdonias](https://github.com/pdonias))

### Bug fixes

- User defined MAC address is not fetch in VM install [\#643](https://github.com/vatesfr/xen-orchestra/issues/643)
- CoreOsCloudConfig is not shown with CoreOS [\#639](https://github.com/vatesfr/xen-orchestra/issues/639)
- Plugin activation/deactivation in web UI seems broken [\#637](https://github.com/vatesfr/xen-orchestra/issues/637)
- Issue when creating CloudConfig drive [\#636](https://github.com/vatesfr/xen-orchestra/issues/636)
- CloudConfig hostname shouldn't have space [\#634](https://github.com/vatesfr/xen-orchestra/issues/634)
- Cloned VIFs are not properly deleted on VM creation [\#632](https://github.com/vatesfr/xen-orchestra/issues/632)
- Default PV args missing during VM creation [\#628](https://github.com/vatesfr/xen-orchestra/issues/628)
- VM creation problems from custom templates [\#625](https://github.com/vatesfr/xen-orchestra/issues/625)
- Emergency shutdown race condition [\#622](https://github.com/vatesfr/xen-orchestra/issues/622)
- `vm.delete\(\)` should not delete VDIs attached to other VMs [\#621](https://github.com/vatesfr/xen-orchestra/issues/621)
- VM creation error from template with a disk [\#581](https://github.com/vatesfr/xen-orchestra/issues/581)
- Only delete VDI exports when VM backup is successful [\#644](https://github.com/vatesfr/xen-orchestra/issues/644)
- Change the name of an imported VM during the import process [\#641](https://github.com/vatesfr/xen-orchestra/issues/641)
- Creating a new VIF in view is partially broken [\#652](https://github.com/vatesfr/xen-orchestra/issues/652)
- Grey out the "create button" during VM creation [\#654](https://github.com/vatesfr/xen-orchestra/issues/654)

## **4.11.0** (2015-12-22)

Delta backup, CloudInit...

### Enhancements

- Visible list of SR inside a VM [\#601](https://github.com/vatesfr/xen-orchestra/issues/601)
- VDI move [\#591](https://github.com/vatesfr/xen-orchestra/issues/591)
- Edit pre-existing disk configuration during VM creation [\#589](https://github.com/vatesfr/xen-orchestra/issues/589)
- Allow disk size edition [\#587](https://github.com/vatesfr/xen-orchestra/issues/587)
- Better VDI resize support [\#585](https://github.com/vatesfr/xen-orchestra/issues/585)
- Remove manual VM export metadata in UI [\#580](https://github.com/vatesfr/xen-orchestra/issues/580)
- Support import VM metadata [\#579](https://github.com/vatesfr/xen-orchestra/issues/579)
- Set a default pool SR [\#572](https://github.com/vatesfr/xen-orchestra/issues/572)
- ISOs should be sorted by name [\#565](https://github.com/vatesfr/xen-orchestra/issues/565)
- Button to boot a VM from a disc once [\#564](https://github.com/vatesfr/xen-orchestra/issues/564)
- Ability to boot a PV VM from a disc [\#563](https://github.com/vatesfr/xen-orchestra/issues/563)
- Add an option to manually run backup jobs [\#562](https://github.com/vatesfr/xen-orchestra/issues/562)
- backups to unmounted storage [\#561](https://github.com/vatesfr/xen-orchestra/issues/561)
- Root integer properties cannot be edited in plugins configuration form [\#550](https://github.com/vatesfr/xen-orchestra/issues/550)
- Generic CloudConfig drive [\#549](https://github.com/vatesfr/xen-orchestra/issues/549)
- Auto-discovery of installed xo-server plugins [\#546](https://github.com/vatesfr/xen-orchestra/issues/546)
- Hide info on flat view [\#545](https://github.com/vatesfr/xen-orchestra/issues/545)
- Config plugin boolean properties must have a default value \(undefined prohibited\) [\#543](https://github.com/vatesfr/xen-orchestra/issues/543)
- Present detailed errors on plugin configuration failures [\#530](https://github.com/vatesfr/xen-orchestra/issues/530)
- Do not reset form on failures in plugins configuration [\#529](https://github.com/vatesfr/xen-orchestra/issues/529)
- XMPP alert plugin [\#518](https://github.com/vatesfr/xen-orchestra/issues/518)
- Hide tag adders depending on ACLs [\#516](https://github.com/vatesfr/xen-orchestra/issues/516)
- Choosing a framework for xo-web 5 [\#514](https://github.com/vatesfr/xen-orchestra/issues/514)
- Prevent adding a host in an existing XAPI connection [\#466](https://github.com/vatesfr/xen-orchestra/issues/466)
- Read only connection to Xen servers/pools [\#439](https://github.com/vatesfr/xen-orchestra/issues/439)
- generic notification system [\#391](https://github.com/vatesfr/xen-orchestra/issues/391)
- Data architecture review [\#384](https://github.com/vatesfr/xen-orchestra/issues/384)
- Make filtering easier to understand/add some "default" filters [\#207](https://github.com/vatesfr/xen-orchestra/issues/207)
- Improve performance [\#148](https://github.com/vatesfr/xen-orchestra/issues/148)

### Bug fixes

- VM metadata export should not require a snapshot [\#615](https://github.com/vatesfr/xen-orchestra/issues/615)
- Missing patch for all hosts is continuously refreshed [\#609](https://github.com/vatesfr/xen-orchestra/issues/609)
- Backup import memory issue [\#608](https://github.com/vatesfr/xen-orchestra/issues/608)
- Host list missing patch is buggy [\#604](https://github.com/vatesfr/xen-orchestra/issues/604)
- Servers infos should not been refreshed while a field is being edited [\#595](https://github.com/vatesfr/xen-orchestra/issues/595)
- Servers list should not been re-order while a field is being edited [\#594](https://github.com/vatesfr/xen-orchestra/issues/594)
- Correctly display size in interface \(binary scale\) [\#592](https://github.com/vatesfr/xen-orchestra/issues/592)
- Display failures on VM boot order modification [\#560](https://github.com/vatesfr/xen-orchestra/issues/560)
- `vm.setBootOrder\(\)` should throw errors on failures \(non-HVM VMs\) [\#559](https://github.com/vatesfr/xen-orchestra/issues/559)
- Hide boot order form for non-HVM VMs [\#558](https://github.com/vatesfr/xen-orchestra/issues/558)
- Allow editing PV args even when empty \(but only for PV VMs\) [\#557](https://github.com/vatesfr/xen-orchestra/issues/557)
- Crashes when using legacy event system [\#556](https://github.com/vatesfr/xen-orchestra/issues/556)
- XenServer patches check error for 6.1 [\#555](https://github.com/vatesfr/xen-orchestra/issues/555)
- activation plugin xo-server-transport-email [\#553](https://github.com/vatesfr/xen-orchestra/issues/553)
- Server error with JSON on 32 bits Dom0 [\#552](https://github.com/vatesfr/xen-orchestra/issues/552)
- Cloud Config drive shouldn't be created on default SR [\#548](https://github.com/vatesfr/xen-orchestra/issues/548)
- Deep properties cannot be edited in plugins configuration form [\#521](https://github.com/vatesfr/xen-orchestra/issues/521)
- Aborted VM export should cancel the operation [\#490](https://github.com/vatesfr/xen-orchestra/issues/490)
- VM missing with same UUID after an inter-pool migration [\#284](https://github.com/vatesfr/xen-orchestra/issues/284)

## **4.10.0** (2015-11-27)

Job management, email notifications, CoreOS/Docker, Quiesce snapshots...

### Enhancements

- Job management ([xo-web#487](https://github.com/vatesfr/xen-orchestra/issues/487))
- Patch upload on all connected servers ([xo-web#168](https://github.com/vatesfr/xen-orchestra/issues/168))
- Emergency shutdown ([xo-web#185](https://github.com/vatesfr/xen-orchestra/issues/185))
- CoreOS/docker template install ([xo-web#246](https://github.com/vatesfr/xen-orchestra/issues/246))
- Email for backups ([xo-web#308](https://github.com/vatesfr/xen-orchestra/issues/308))
- Console Clipboard ([xo-web#408](https://github.com/vatesfr/xen-orchestra/issues/408))
- Logs from CLI ([xo-web#486](https://github.com/vatesfr/xen-orchestra/issues/486))
- Save disconnected servers ([xo-web#489](https://github.com/vatesfr/xen-orchestra/issues/489))
- Snapshot with quiesce ([xo-web#491](https://github.com/vatesfr/xen-orchestra/issues/491))
- Start VM in reovery mode ([xo-web#495](https://github.com/vatesfr/xen-orchestra/issues/495))
- Username in logs ([xo-web#498](https://github.com/vatesfr/xen-orchestra/issues/498))
- Delete associated tokens with user ([xo-web#500](https://github.com/vatesfr/xen-orchestra/issues/500))
- Validate plugin configuration ([xo-web#503](https://github.com/vatesfr/xen-orchestra/issues/503))
- Avoid non configured plugins to be loaded ([xo-web#504](https://github.com/vatesfr/xen-orchestra/issues/504))
- Verbose API logs if configured ([xo-web#505](https://github.com/vatesfr/xen-orchestra/issues/505))
- Better backup overview ([xo-web#512](https://github.com/vatesfr/xen-orchestra/issues/512))
- VM auto power on ([xo-web#519](https://github.com/vatesfr/xen-orchestra/issues/519))
- Title property supported in config schema ([xo-web#522](https://github.com/vatesfr/xen-orchestra/issues/522))
- Start VM export only when necessary ([xo-web#534](https://github.com/vatesfr/xen-orchestra/issues/534))
- Input type should be number ([xo-web#538](https://github.com/vatesfr/xen-orchestra/issues/538))

### Bug fixes

- Numbers/int support in plugins config ([xo-web#531](https://github.com/vatesfr/xen-orchestra/issues/531))
- Boolean support in plugins config ([xo-web#528](https://github.com/vatesfr/xen-orchestra/issues/528))
- Keyboard unusable outside console ([xo-web#513](https://github.com/vatesfr/xen-orchestra/issues/513))
- UsernameField for SAML ([xo-web#513](https://github.com/vatesfr/xen-orchestra/issues/513))
- Wrong display of "no plugin found" ([xo-web#508](https://github.com/vatesfr/xen-orchestra/issues/508))
- Bower build error ([xo-web#488](https://github.com/vatesfr/xen-orchestra/issues/488))
- VM cloning should require SR permission ([xo-web#472](https://github.com/vatesfr/xen-orchestra/issues/472))
- Xen tools status ([xo-web#471](https://github.com/vatesfr/xen-orchestra/issues/471))
- Can't delete ghost user ([xo-web#464](https://github.com/vatesfr/xen-orchestra/issues/464))
- Stats with old versions of Node ([xo-web#463](https://github.com/vatesfr/xen-orchestra/issues/463))

## **4.9.0** (2015-11-13)

Automated DR, restore backup, VM copy

### Enhancements

- DR: schedule VM export on other host ([xo-web#447](https://github.com/vatesfr/xen-orchestra/issues/447))
- Scheduler logs ([xo-web#390](https://github.com/vatesfr/xen-orchestra/issues/390) and [xo-web#477](https://github.com/vatesfr/xen-orchestra/issues/477))
- Restore backups ([xo-web#450](https://github.com/vatesfr/xen-orchestra/issues/350))
- Disable backup compression ([xo-web#467](https://github.com/vatesfr/xen-orchestra/issues/467))
- Copy VM to another SR (even remote) ([xo-web#475](https://github.com/vatesfr/xen-orchestra/issues/475))
- VM stats without time sync ([xo-web#460](https://github.com/vatesfr/xen-orchestra/issues/460))
- Stats perfs for high CPU numbers ([xo-web#461](https://github.com/vatesfr/xen-orchestra/issues/461))

### Bug fixes

- Rolling backup bug ([xo-web#484](https://github.com/vatesfr/xen-orchestra/issues/484))
- vCPUs/CPUs inversion in dashboard ([xo-web#481](https://github.com/vatesfr/xen-orchestra/issues/481))
- Machine to template ([xo-web#459](https://github.com/vatesfr/xen-orchestra/issues/459))

### Misc

- Console fix in XenServer ([xo-web#406](https://github.com/vatesfr/xen-orchestra/issues/406))

## **4.8.0** (2015-10-29)

Fully automated patch system, ACLs inheritance, stats performance improved.

### Enhancements

- ACLs inheritance ([xo-web#279](https://github.com/vatesfr/xen-orchestra/issues/279))
- Patch automatically all missing updates ([xo-web#281](https://github.com/vatesfr/xen-orchestra/issues/281))
- Intelligent stats polling ([xo-web#432](https://github.com/vatesfr/xen-orchestra/issues/432))
- Cache latest result of stats request ([xo-web#431](https://github.com/vatesfr/xen-orchestra/issues/431))
- Improve stats polling on multiple objects ([xo-web#433](https://github.com/vatesfr/xen-orchestra/issues/433))
- Patch upload task should display the patch name ([xo-web#449](https://github.com/vatesfr/xen-orchestra/issues/449))
- Backup filename for Windows ([xo-web#448](https://github.com/vatesfr/xen-orchestra/issues/448))
- Specific distro icons ([xo-web#446](https://github.com/vatesfr/xen-orchestra/issues/446))
- PXE boot for HVM ([xo-web#436](https://github.com/vatesfr/xen-orchestra/issues/436))
- Favicon display before sign in ([xo-web#428](https://github.com/vatesfr/xen-orchestra/issues/428))
- Registration renewal ([xo-web#424](https://github.com/vatesfr/xen-orchestra/issues/424))
- Reconnect to the host if pool merge fails ([xo-web#403](https://github.com/vatesfr/xen-orchestra/issues/403))
- Avoid brute force login ([xo-web#339](https://github.com/vatesfr/xen-orchestra/issues/339))
- Missing FreeBSD icon ([xo-web#136](https://github.com/vatesfr/xen-orchestra/issues/136))
- Hide halted objects in the Health view ([xo-web#457](https://github.com/vatesfr/xen-orchestra/issues/457))
- Click on "Remember me" label ([xo-web#438](https://github.com/vatesfr/xen-orchestra/issues/438))

### Bug fixes

- Pool patches in multiple pools not displayed ([xo-web#442](https://github.com/vatesfr/xen-orchestra/issues/442))
- VM Import crashes with Chrome ([xo-web#427](https://github.com/vatesfr/xen-orchestra/issues/427))
- Cannot open a direct link ([xo-web#371](https://github.com/vatesfr/xen-orchestra/issues/371))
- Patch display edge case ([xo-web#309](https://github.com/vatesfr/xen-orchestra/issues/309))
- VM snapshot should require user permission on SR ([xo-web#429](https://github.com/vatesfr/xen-orchestra/issues/429))

## **4.7.0** (2015-10-12)

Plugin config management and browser notifications.

### Enhancements

- Plugin management in the web interface ([xo-web#352](https://github.com/vatesfr/xen-orchestra/issues/352))
- Browser notifications ([xo-web#402](https://github.com/vatesfr/xen-orchestra/issues/402))
- Graph selector ([xo-web#400](https://github.com/vatesfr/xen-orchestra/issues/400))
- Circle packing visualization ([xo-web#374](https://github.com/vatesfr/xen-orchestra/issues/374))
- Password generation ([xo-web#397](https://github.com/vatesfr/xen-orchestra/issues/397))
- Password reveal during user creation ([xo-web#396](https://github.com/vatesfr/xen-orchestra/issues/396))
- Add host to a pool ([xo-web#62](https://github.com/vatesfr/xen-orchestra/issues/62))
- Better modal when removing a host from a pool ([xo-web#405](https://github.com/vatesfr/xen-orchestra/issues/405))
- Drop focus on CD/ISO selector ([xo-web#290](https://github.com/vatesfr/xen-orchestra/issues/290))
- Allow non persistent session ([xo-web#243](https://github.com/vatesfr/xen-orchestra/issues/243))

### Bug fixes

- VM export permission corrected ([xo-web#410](https://github.com/vatesfr/xen-orchestra/issues/410))
- Proper host removal in a pool ([xo-web#402](https://github.com/vatesfr/xen-orchestra/issues/402))
- Sub-optimal tooltip placement ([xo-web#421](https://github.com/vatesfr/xen-orchestra/issues/421))
- VM migrate host incorrect target ([xo-web#419](https://github.com/vatesfr/xen-orchestra/issues/419))
- Alone host can't leave its pool ([xo-web#414](https://github.com/vatesfr/xen-orchestra/issues/414))

## **4.6.0** (2015-09-25)

Tags management and new visualization.

### Enhancements

- Multigraph for correlation ([xo-web#358](https://github.com/vatesfr/xen-orchestra/issues/358))
- Tags management ([xo-web#367](https://github.com/vatesfr/xen-orchestra/issues/367))
- Google Provider for authentication ([xo-web#363](https://github.com/vatesfr/xen-orchestra/issues/363))
- Password change for users ([xo-web#362](https://github.com/vatesfr/xen-orchestra/issues/362))
- Better live migration process ([xo-web#237](https://github.com/vatesfr/xen-orchestra/issues/237))
- VDI search filter in SR view ([xo-web#222](https://github.com/vatesfr/xen-orchestra/issues/222))
- PV args during VM creation ([xo-web#112](https://github.com/vatesfr/xen-orchestra/issues/330))
- PV args management ([xo-web#394](https://github.com/vatesfr/xen-orchestra/issues/394))
- Confirmation dialog on important actions ([xo-web#350](https://github.com/vatesfr/xen-orchestra/issues/350))
- New favicon ([xo-web#369](https://github.com/vatesfr/xen-orchestra/issues/369))
- Filename of VM for exports ([xo-web#370](https://github.com/vatesfr/xen-orchestra/issues/370))
- ACLs rights edited on the fly ([xo-web#323](https://github.com/vatesfr/xen-orchestra/issues/323))
- Heatmap values now human readable ([xo-web#342](https://github.com/vatesfr/xen-orchestra/issues/342))

### Bug fixes

- Export backup fails if no tags specified ([xo-web#383](https://github.com/vatesfr/xen-orchestra/issues/383))
- Wrong login give an obscure error message ([xo-web#373](https://github.com/vatesfr/xen-orchestra/issues/373))
- Update view is broken during updates ([xo-web#356](https://github.com/vatesfr/xen-orchestra/issues/356))
- Settings/dashboard menu incorrect display ([xo-web#357](https://github.com/vatesfr/xen-orchestra/issues/357))
- Console View Not refreshing if the VM restart ([xo-web#107](https://github.com/vatesfr/xen-orchestra/issues/107))

## **4.5.1** (2015-09-16)

An issue in `xo-web` with the VM view.

### Bug fix

- Attach disk/new disk/create interface is broken ([xo-web#378](https://github.com/vatesfr/xen-orchestra/issues/378))

## **4.5.0** (2015-09-11)

A new dataviz (parallel coord), a new provider (GitHub) and faster consoles.

### Enhancements

- Parallel coordinates view ([xo-web#333](https://github.com/vatesfr/xen-orchestra/issues/333))
- Faster consoles ([xo-web#337](https://github.com/vatesfr/xen-orchestra/issues/337))
- Disable/hide button ([xo-web#268](https://github.com/vatesfr/xen-orchestra/issues/268))
- More details on missing-guest-tools ([xo-web#304](https://github.com/vatesfr/xen-orchestra/issues/304))
- Scheduler meta data export ([xo-web#315](https://github.com/vatesfr/xen-orchestra/issues/315))
- Better heatmap ([xo-web#330](https://github.com/vatesfr/xen-orchestra/issues/330))
- Faster dashboard ([xo-web#331](https://github.com/vatesfr/xen-orchestra/issues/331))
- Faster sunburst ([xo-web#332](https://github.com/vatesfr/xen-orchestra/issues/332))
- GitHub provider for auth ([xo-web#334](https://github.com/vatesfr/xen-orchestra/issues/334))
- Filter networks for users ([xo-web#347](https://github.com/vatesfr/xen-orchestra/issues/347))
- Add networks in ACLs ([xo-web#348](https://github.com/vatesfr/xen-orchestra/issues/348))
- Better looking login page ([xo-web#341](https://github.com/vatesfr/xen-orchestra/issues/341))
- Real time dataviz (dashboard) ([xo-web#349](https://github.com/vatesfr/xen-orchestra/issues/349))

### Bug fixes

- Typo in dashboard ([xo-web#355](https://github.com/vatesfr/xen-orchestra/issues/355))
- Global RAM usage fix ([xo-web#356](https://github.com/vatesfr/xen-orchestra/issues/356))
- Re-allowing XO behind a reverse proxy ([xo-web#361](https://github.com/vatesfr/xen-orchestra/issues/361))

## **4.4.0** (2015-08-28)

SSO and Dataviz are the main features for this release.

### Enhancements

- Dataviz storage usage ([xo-web#311](https://github.com/vatesfr/xen-orchestra/issues/311))
- Heatmap in health view ([xo-web#329](https://github.com/vatesfr/xen-orchestra/issues/329))
- SSO for SAML and other providers ([xo-web#327](https://github.com/vatesfr/xen-orchestra/issues/327))
- Better UI for ACL objects attribution ([xo-web#320](https://github.com/vatesfr/xen-orchestra/issues/320))
- Refresh the browser after an update ([xo-web#318](https://github.com/vatesfr/xen-orchestra/issues/318))
- Clean CSS and Flexbox usage ([xo-web#239](https://github.com/vatesfr/xen-orchestra/issues/239))

### Bug fixes

- Admin only accessible views ([xo-web#328](https://github.com/vatesfr/xen-orchestra/issues/328))
- Hide "base copy" VDIs ([xo-web#324](https://github.com/vatesfr/xen-orchestra/issues/324))
- ACLs on VIFs for non-admins ([xo-web#322](https://github.com/vatesfr/xen-orchestra/issues/322))
- Updater display problems ([xo-web#313](https://github.com/vatesfr/xen-orchestra/issues/313))

## **4.3.0** (2015-07-22)

Scheduler for rolling backups

### Enhancements

- Rolling backup scheduler ([xo-web#278](https://github.com/vatesfr/xen-orchestra/issues/278))
- Clean snapshots of removed VMs ([xo-web#301](https://github.com/vatesfr/xen-orchestra/issues/301))

### Bug fixes

- VM export ([xo-web#307](https://github.com/vatesfr/xen-orchestra/issues/307))
- Remove VM VDIs ([xo-web#303](https://github.com/vatesfr/xen-orchestra/issues/303))
- Pagination fails ([xo-web#302](https://github.com/vatesfr/xen-orchestra/issues/302))

## **4.2.0** (2015-06-29)

Huge performance boost, scheduler for rolling snapshots and backward compatibility for XS 5.x series

### Enhancements

- Rolling snapshots scheduler ([xo-web#176](https://github.com/vatesfr/xen-orchestra/issues/176))
- Huge perf boost ([xen-api#1](https://github.com/julien-f/js-xen-api/issues/1))
- Backward compatibility ([xo-web#296](https://github.com/vatesfr/xen-orchestra/issues/296))

### Bug fixes

- VDI attached on a VM missing in SR view ([xo-web#294](https://github.com/vatesfr/xen-orchestra/issues/294))
- Better VM creation process ([xo-web#292](https://github.com/vatesfr/xen-orchestra/issues/292))

## **4.1.0** (2015-06-10)

Add the drag'n drop support from VM live migration, better ACLs groups UI.

### Enhancements

- Drag'n drop VM in tree view for live migration ([xo-web#277](https://github.com/vatesfr/xen-orchestra/issues/277))
- Better group view with objects ACLs ([xo-web#276](https://github.com/vatesfr/xen-orchestra/issues/276))
- Hide non-visible objects ([xo-web#272](https://github.com/vatesfr/xen-orchestra/issues/272))

### Bug fixes

- Convert to template displayed when the VM is not halted ([xo-web#286](https://github.com/vatesfr/xen-orchestra/issues/286))
- Lost some data when refresh some views ([xo-web#271](https://github.com/vatesfr/xen-orchestra/issues/271))
- Suspend button don't trigger any permission message ([xo-web#270](https://github.com/vatesfr/xen-orchestra/issues/270))
- Create network interfaces shouldn't call xoApi directly ([xo-web#269](https://github.com/vatesfr/xen-orchestra/issues/269))
- Don't plug automatically a disk or a VIF if the VM is not running ([xo-web#287](https://github.com/vatesfr/xen-orchestra/issues/287))

## **4.0.2** (2015-06-01)

An issue in `xo-server` with the password of default admin account and also a UI fix.

### Bug fixes

- Cannot modify admin account ([xo-web#265](https://github.com/vatesfr/xen-orchestra/issues/265))
- Password field seems to keep empty/reset itself after 1-2 seconds ([xo-web#264](https://github.com/vatesfr/xen-orchestra/issues/264))

## **4.0.1** (2015-05-30)

An issue with the updater in HTTPS was left in the _4.0.0_. This patch release fixed
it.

### Bug fixes

- allow updater to work in HTTPS ([xo-web#266](https://github.com/vatesfr/xen-orchestra/issues/266))

## **4.0.0** (2015-05-29)

[Blog post of this release](https://xen-orchestra.com/blog/xen-orchestra-4-0).

### Enhancements

- advanced ACLs ([xo-web#209](https://github.com/vatesfr/xen-orchestra/issues/209))
- xenserver update management ([xo-web#174](https://github.com/vatesfr/xen-orchestra/issues/174) & [xo-web#259](https://github.com/vatesfr/xen-orchestra/issues/259))
- docker control ([xo-web#211](https://github.com/vatesfr/xen-orchestra/issues/211))
- better responsive design ([xo-web#252](https://github.com/vatesfr/xen-orchestra/issues/252))
- host stats ([xo-web#255](https://github.com/vatesfr/xen-orchestra/issues/255))
- pagination ([xo-web#221](https://github.com/vatesfr/xen-orchestra/issues/221))
- web updater
- better VM creation process([xo-web#256](https://github.com/vatesfr/xen-orchestra/issues/256))
- VM boot order([xo-web#251](https://github.com/vatesfr/xen-orchestra/issues/251))
- new mapped collection([xo-server#47](https://github.com/vatesfr/xo-server/issues/47))
- resource location in ACL view ([xo-web#245](https://github.com/vatesfr/xen-orchestra/issues/245))

### Bug fixes

- wrong calculation of RAM amounts ([xo-web#51](https://github.com/vatesfr/xen-orchestra/issues/51))
- checkbox not aligned ([xo-web#253](https://github.com/vatesfr/xen-orchestra/issues/253))
- VM stats behavior more robust ([xo-web#250](https://github.com/vatesfr/xen-orchestra/issues/250))
- XO not on the root of domain ([xo-web#254](https://github.com/vatesfr/xen-orchestra/issues/254))

## **3.9.1** (2015-04-21)

A few bugs hve made their way into _3.9.0_, this minor release fixes
them.

### Bug fixes

- correctly keep the VM guest metrics up to date ([xo-web#172](https://github.com/vatesfr/xen-orchestra/issues/172))
- fix edition of a VM snapshot ([b04111c](https://github.com/vatesfr/xo-server/commit/b04111c79ba8937778b84cb861bb7c2431162c11))
- do not fetch stats if the VM state is transitioning ([a5c9880](https://github.com/vatesfr/xen-orchestra/commit/a5c98803182792d2fe5ceb840ae1e23a8b767923))
- fix broken Angular due to new version of Babel which breaks ngAnnotate ([0a9c868](https://github.com/vatesfr/xen-orchestra/commit/0a9c868678d239e5b3e54b4d2bc3bd14b5400120))
- feedback when connecting/disconnecting a server ([027d1e8](https://github.com/vatesfr/xen-orchestra/commit/027d1e8cb1f2431e67042e1eec51690b2bc54ad7))
- clearer error message if a server is unreachable ([06ca007](https://github.com/vatesfr/xo-server/commit/06ca0079b321e757aaa4112caa6f92a43193e35d))

## **3.9.0** (2015-04-20)

[Blog post of this release](https://xen-orchestra.com/blog/xen-orchestra-3-9).

### Enhancements

- ability to manually connect/disconnect a server ([xo-web#88](https://github.com/vatesfr/xen-orchestra/issues/88) & [xo-web#234](https://github.com/vatesfr/xen-orchestra/issues/234))
- display the connection status of a server ([xo-web#103](https://github.com/vatesfr/xen-orchestra/issues/103))
- better feedback when connecting to a server ([xo-web#210](https://github.com/vatesfr/xen-orchestra/issues/210))
- ability to add a local LVM SR ([xo-web#219](https://github.com/vatesfr/xen-orchestra/issues/219))
- display virtual GPUs in VM view ([xo-web#223](https://github.com/vatesfr/xen-orchestra/issues/223))
- ability to automatically start a VM with its host ([xo-web#224](https://github.com/vatesfr/xen-orchestra/issues/224))
- ability to create networks ([xo-web#225](https://github.com/vatesfr/xen-orchestra/issues/225))
- live charts for a VM CPU/disk/network & RAM ([xo-web#228](https://github.com/vatesfr/xen-orchestra/issues/228) & [xo-server#51](https://github.com/vatesfr/xo-server/issues/51))
- remove VM import progress notifications (redundant with the tasks list) ([xo-web#235](https://github.com/vatesfr/xen-orchestra/issues/235))
- XO-Server sources are compiled to JS prior distribution: less bugs & faster startups ([xo-server#50](https://github.com/vatesfr/xo-server/issues/50))
- use XAPI `event.from()` instead of `event.next()` which leads to faster connection ([xo-server#52](https://github.com/vatesfr/xo-server/issues/52))

### Bug fixes

- removed servers are properly disconnected ([xo-web#61](https://github.com/vatesfr/xen-orchestra/issues/61))
- fix VM creation with multiple interfaces ([xo-wb#229](https://github.com/vatesfr/xo-wb/issues/229))
- disconnected servers are properly removed from the interface ([xo-web#234](https://github.com/vatesfr/xen-orchestra/issues/234))

## **3.8.0** (2015-03-27)

[Blog post of this release](https://xen-orchestra.com/blog/xen-orchestra-3-8).

### Enhancements

- initial plugin system ([xo-server#37](https://github.com/vatesfr/xo-server/issues/37))
- new authentication system based on providers ([xo-server#39](https://github.com/vatesfr/xo-server/issues/39))
- LDAP authentication plugin for XO-Server ([xo-server#40](https://github.com/vatesfr/xo-server/issues/40))
- disk creation on the VM page ([xo-web#215](https://github.com/vatesfr/xen-orchestra/issues/215))
- network creation on the VM page ([xo-web#216](https://github.com/vatesfr/xen-orchestra/issues/216))
- charts on the host and SR pages ([xo-web#217](https://github.com/vatesfr/xen-orchestra/issues/217))

### Bug fixes

- fix _Invalid parameter(s)_ message on the settings page ([xo-server#49](https://github.com/vatesfr/xo-server/issues/49))
- fix mouse clicks in console ([xo-web#205](https://github.com/vatesfr/xen-orchestra/issues/205))
- fix user editing on the settings page ([xo-web#206](https://github.com/vatesfr/xen-orchestra/issues/206))

## **3.7.0** (2015-03-06)

_Highlights in this release are the [initial ACLs implementation](https://xen-orchestra.com/blog/xen-orchestra-3-7-is-out-acls-in-early-access), [live migration for VDIs](https://xen-orchestra.com/blog/moving-vdi-in-live) and the ability to [create a new storage repository](https://xen-orchestra.com/blog/create-a-storage-repository-with-xen-orchestra/)._

### Enhancements

- ability to live migrate a VM between hosts with different CPUs ([xo-web#126](https://github.com/vatesfr/xen-orchestra/issues/126))
- ability to live migrate a VDI ([xo-web#177](https://github.com/vatesfr/xen-orchestra/issues/177))
- display a notification on VM creation ([xo-web#178](https://github.com/vatesfr/xen-orchestra/issues/178))
- ability to create/attach a iSCSI/NFS/ISO SR ([xo-web#179](https://github.com/vatesfr/xen-orchestra/issues/179))
- display SR available space on VM creation ([xo-web#180](https://github.com/vatesfr/xen-orchestra/issues/180))
- ability to enable and disable host on the tree view ([xo-web#181](https://github.com/vatesfr/xen-orchestra/issues/181) & [xo-web#182](https://github.com/vatesfr/xen-orchestra/issues/182))
- ability to suspend/resume a VM ([xo-web#186](https://github.com/vatesfr/xen-orchestra/issues/186))
- display Linux icon for SUSE Linux Enterprise Server distribution ([xo-web#187](https://github.com/vatesfr/xen-orchestra/issues/187))
- correctly handle incorrectly formated token in cookies ([xo-web#192](https://github.com/vatesfr/xen-orchestra/issues/192))
- display host manufacturer in host view ([xo-web#195](https://github.com/vatesfr/xen-orchestra/issues/195))
- only display task concerning authorized objects ([xo-web#197](https://github.com/vatesfr/xen-orchestra/issues/197))
- better welcome message ([xo-web#199](https://github.com/vatesfr/xen-orchestra/issues/199))
- initial ACLs ([xo-web#202](https://github.com/vatesfr/xen-orchestra/issues/202))
- display an action panel to rescan, remove, attach and forget a SR ([xo-web#203](https://github.com/vatesfr/xen-orchestra/issues/203))
- display current active tasks in navbar ([xo-web#204](https://github.com/vatesfr/xen-orchestra/issues/204))

### Bug fixes

- implements a proxy which fixes consoles over HTTPs ([xo#14](https://github.com/vatesfr/xo/issues/14))
- fix tasks listing in host view ([xo-server#43](https://github.com/vatesfr/xo-server/issues/43))
- fix console view on IE ([xo-web#184](https://github.com/vatesfr/xen-orchestra/issues/184))
- fix out of sync objects in XO-Web ([xo-web#142](https://github.com/vatesfr/xen-orchestra/issues/142))
- fix incorrect connection status displayed in login view ([xo-web#193](https://github.com/vatesfr/xen-orchestra/issues/193))
- fix _flickering_ tree view ([xo-web#194](https://github.com/vatesfr/xen-orchestra/issues/194))
- single host pools should not have a dropdown menu in tree view ([xo-web#198](https://github.com/vatesfr/xen-orchestra/issues/198))

## **3.6.0** (2014-11-28)

### Enhancements

- upload and apply patches to hosts/pools ([xo-web#150](https://github.com/vatesfr/xen-orchestra/issues/150))
- import VMs ([xo-web#151](https://github.com/vatesfr/xen-orchestra/issues/151))
- export VMs ([xo-web#152](https://github.com/vatesfr/xen-orchestra/issues/152))
- migrate VMs to another pool ([xo-web#153](https://github.com/vatesfr/xen-orchestra/issues/153))
- display pool even for single host ([xo-web#155](https://github.com/vatesfr/xen-orchestra/issues/155))
- start halted hosts with wake-on-LAN ([xo-web#154](https://github.com/vatesfr/xen-orchestra/issues/154))
- list of uploaded/applied patches ([xo-web#156](https://github.com/vatesfr/xen-orchestra/issues/156))
- use Angular 1.3 from npm ([xo-web#157](https://github.com/vatesfr/xen-orchestra/issues/157) & [xo-web#160](https://github.com/vatesfr/xen-orchestra/issues/160))
- more feedbacks on actions ([xo-web#165](https://github.com/vatesfr/xen-orchestra/issues/165))
- only buttons compatible with VM states are displayed ([xo-web#166](https://github.com/vatesfr/xen-orchestra/issues/166))
- export VM snapshot ([xo-web#167](https://github.com/vatesfr/xen-orchestra/issues/167))
- plug/unplug a SR to a host ([xo-web#169](https://github.com/vatesfr/xen-orchestra/issues/169))
- plug a SR to all available hosts ([xo-web#170](https://github.com/vatesfr/xen-orchestra/issues/170))
- disks editing on SR page ([xo-web#171](https://github.com/vatesfr/xen-orchestra/issues/171))
- export of running VMs ([xo-server#36](https://github.com/vatesfr/xo-server/issues/36))

### Bug fixes

- disks editing on VM page should work ([xo-web#86](https://github.com/vatesfr/xen-orchestra/issues/86))
- dropdown menus should close after selecting an item ([xo-web#140](https://github.com/vatesfr/xen-orchestra/issues/140))
- user creation should require a password ([xo-web#143](https://github.com/vatesfr/xen-orchestra/issues/143))
- server connection should require a user and a password ([xo-web#144](https://github.com/vatesfr/xen-orchestra/issues/144))
- snapshot deletion should work ([xo-server#147](https://github.com/vatesfr/xo-server/issues/147))
- VM console should work in Chrome ([xo-web#149](https://github.com/vatesfr/xen-orchestra/issues/149))
- tooltips should work ([xo-web#163](https://github.com/vatesfr/xen-orchestra/issues/163))
- disk plugged status should be automatically refreshed ([xo-web#164](https://github.com/vatesfr/xen-orchestra/issues/164))
- deleting users without tokens should not trigger an error ([xo-server#34](https://github.com/vatesfr/xo-server/issues/34))
- live pool master change should work ([xo-server#20](https://github.com/vatesfr/xo-server/issues/20))

## **3.5.1** (2014-08-19)

### Bug fixes

- pool view works again ([#139](https://github.com/vatesfr/xen-orchestra/issues/139))

## **3.5.0** (2014-08-14)

_[XO-Web](https://www.npmjs.org/package/xo-web) and [XO-Server](https://www.npmjs.org/package/xo-server) are now available as npm packages!_

### Enhancements

- XO-Server published on npm ([#26](https://github.com/vatesfr/xo-server/issues/26))
- XO-Server config is now in `/etc/xo-server/config.yaml` ([#33](https://github.com/vatesfr/xo-server/issues/33))
- paths in XO-Server's config are now relative to the config file ([#19](https://github.com/vatesfr/xo-server/issues/19))
- use the Linux icon for Fedora ([#131](https://github.com/vatesfr/xen-orchestra/issues/131))
- start/stop/reboot buttons on console page ([#121](https://github.com/vatesfr/xen-orchestra/issues/121))
- settings page now only accessible to admin ([#77](https://github.com/vatesfr/xen-orchestra/issues/77))
- redirection to the home page when a VM is deleted from its own page ([#56](https://github.com/vatesfr/xen-orchestra/issues/56))
- XO-Web published on npm ([#123](https://github.com/vatesfr/xen-orchestra/issues/123))
- build process now use Browserify (([#125](https://github.com/vatesfr/xen-orchestra/issues/125), [#135](https://github.com/vatesfr/xen-orchestra/issues/135)))
- view are now written in Jade instead of HTML ([#124](https://github.com/vatesfr/xen-orchestra/issues/124))
- CSS autoprefixer to improve compatibility ([#132](https://github.com/vatesfr/xen-orchestra/issues/132), [#137](https://github.com/vatesfr/xen-orchestra/issues/137))

### Bug fixes

- force shutdown does not attempt a clean shutdown first anymore ([#29](https://github.com/vatesfr/xo-server/issues/29))
- shutdown hosts are now correctly reported as such ([#31](https://github.com/vatesfr/xen-orchestra/issues/31))
- incorrect VM metrics ([#54](https://github.com/vatesfr/xen-orchestra/issues/54), [#68](https://github.com/vatesfr/xen-orchestra/issues/68), [#108](https://github.com/vatesfr/xen-orchestra/issues/108))
- an user cannot delete itself ([#104](https://github.com/vatesfr/xen-orchestra/issues/104))
- in VM creation, required fields are now marked as such ([#113](https://github.com/vatesfr/xen-orchestra/issues/113), [#114](https://github.com/vatesfr/xen-orchestra/issues/114))

## **3.4.0** (2014-05-22)

_Highlight in this release is the new events system between XO-Web
and XO-Server which results in less bandwidth consumption as well as
better performance and reactivity._

### Enhancements

- events system between XO-Web and XO-Server ([#52](https://github.com/vatesfr/xen-orchestra/issues/52))
- ability to clone/copy a VM ([#116](https://github.com/vatesfr/xen-orchestra/issues/116))
- mandatory log in page ([#120](https://github.com/vatesfr/xen-orchestra/issues/120))

### Bug fixes

- failure in VM creation ([#111](https://github.com/vatesfr/xen-orchestra/issues/111))

## **3.3.1** (2014-03-28)

### Enhancements

- console view is now prettier ([#92](https://github.com/vatesfr/xen-orchestra/issues/92))

### Bug fixes

- VM creation fails to incorrect dependencies ([xo-server/#24](https://github.com/vatesfr/xo-server/issues/24))
- VDIs list in SR view is blinking ([#109](https://github.com/vatesfr/xen-orchestra/issues/109))

## **3.3.0** (2014-03-07)

### Enhancements

- [Grunt](http://gruntjs.com/) has been replaced by [gulp.js](http://gulpjs.com/) ([#91](https://github.com/vatesfr/xen-orchestra/issues/91))
- a host can be detached from a pool ([#98](https://github.com/vatesfr/xen-orchestra/issues/98))
- snapshots management in VM view ([#99](https://github.com/vatesfr/xen-orchestra/issues/99))
- log deletion in VM view ([#100](https://github.com/vatesfr/xen-orchestra/issues/100))

### Bug fixes

- _Snapshot_ not working in VM view ([#95](https://github.com/vatesfr/xen-orchestra/issues/95))
- Host _Reboot_/_Restart toolstack_/_Shutdown_ not working in main view ([#97](https://github.com/vatesfr/xen-orchestra/issues/97))
- Bower cannot install `angular` automatically due to a version conflict ([#101](https://github.com/vatesfr/xen-orchestra/issues/101))
- Bower installs an incorrect version of `angular-animate` ([#102](https://github.com/vatesfr/xen-orchestra/issues/102))

## **3.2.0** (2014-02-21)

### Enhancements

- dependencies' versions should be fixed to ease deployment ([#93](https://github.com/vatesfr/xen-orchestra/issues/93))
- badges added to the README to see whether dependencies are up to date ([#90](https://github.com/vatesfr/xen-orchestra/issues/90))
- an error notification has been added when the connection to XO-Server failed ([#89](https://github.com/vatesfr/xen-orchestra/issues/89))
- in host view, there is now a link to the host console ([#87](https://github.com/vatesfr/xen-orchestra/issues/87))
- in VM view, deleting a disk requires a confirmation ([#85](https://github.com/vatesfr/xen-orchestra/issues/85))
- the VM and console icons are now different ([#80](https://github.com/vatesfr/xen-orchestra/issues/80))

### Bug fixes

- consoles now work in Google Chrome \o/ ([#46](https://github.com/vatesfr/xen-orchestra/issues/46))
- in host view, many buttons were not working ([#79](https://github.com/vatesfr/xen-orchestra/issues/79))
- in main view, incorrect icons were fixes ([#81](https://github.com/vatesfr/xen-orchestra/issues/81))
- MAC addresses should not be ignored during VM creation ([#94](https://github.com/vatesfr/xen-orchestra/issues/94))

## **3.1.0** (2014-02-14)

### Enhancements

- in VM view, interfaces' network should be displayed ([#64](https://github.com/vatesfr/xen-orchestra/issues/64))
- middle-click or `Ctrl`+click should open new windows (even on pseudo-links) ([#66](https://github.com/vatesfr/xen-orchestra/issues/66))
- lists should use natural sorting (e.g. _VM 2_ before _VM 10_) ([#69](https://github.com/vatesfr/xen-orchestra/issues/69))

### Bug fixes

- consoles are not implemented for hosts ([#57](https://github.com/vatesfr/xen-orchestra/issues/57))
- it makes no sense to remove a stand-alone host from a pool (58)
- in VM view, the migrate button is not working ([#59](https://github.com/vatesfr/xen-orchestra/issues/59))
- pool and host names overflow their box in the main view ([#63](https://github.com/vatesfr/xen-orchestra/issues/63))
- in host view, interfaces incorrectly named _networks_ and VLAN not shown ([#70](https://github.com/vatesfr/xen-orchestra/issues/70))
- VM suspended state is not properly handled ([#71](https://github.com/vatesfr/xen-orchestra/issues/71))
- unauthenticated users should not be able to access to consoles ([#73](https://github.com/vatesfr/xen-orchestra/issues/73))
- incorrect scroll (under the navbar) when the view changes ([#74](https://github.com/vatesfr/xen-orchestra/issues/74))
