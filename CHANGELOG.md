# ChangeLog

## **6.0.3** (2026-01-06)

<img id="latest" src="https://badgen.net/badge/channel/latest/yellow" alt="Channel: latest" />

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
