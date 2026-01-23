> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

- [Backups] Update node-tar dependency to handle CVE-2026-23745 (PR [#9406](https://github.com/vatesfr/xen-orchestra/pull/9406))

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [OpenMetrics] Expose SR capacity metrics: `xcp_sr_virtual_size_bytes`, `xcp_sr_physical_size_bytes`, `xcp_sr_physical_usage_bytes` (PR [#9360](https://github.com/vatesfr/xen-orchestra/pull/9360))
- [REST API] Update `/dashboard` endpoint to also return disconnected servers, disabled hosts, the status of all VMs, and compute `jobs` from the last seven days (PR [#9207](https://github.com/vatesfr/xen-orchestra/pull/9207))
- [vhd-cli] Prevent using invalid options (PR [#9386](https://github.com/vatesfr/xen-orchestra/pull/9386))
- [REST API] Add endpoints to reconfigure management interface for hosts and pools (PR [#9369](https://github.com/vatesfr/xen-orchestra/pull/9369))
- [VM] Add "Change state" button on VM view (PR [#9317](https://github.com/vatesfr/xen-orchestra/pull/9317))
- [REST API] Add `POST /vbds` endpoint to create a VBD (attach a VDI to a VM) (PR [#9391](https://github.com/vatesfr/xen-orchestra/pull/9391))
- [TreeView] Scroll to current item in list view (PR [#9268](https://github.com/vatesfr/xen-orchestra/pull/9268))
- [REST API] Add `createVtpm` parameter to VM creation endpoint (PR [#9412](https://github.com/vatesfr/xen-orchestra/pull/9412))
- [REST API] Add `secureBoot` parameter to VM creation endpoint (PR [#9417](https://github.com/vatesfr/xen-orchestra/pull/9417))
- [Backup] show the backup archive that will be kept for Long Term Retention (PR [#9364](https://github.com/vatesfr/xen-orchestra/pull/9364))
- [REST API] Add `DELETE /vbds/{id}` endpoint to remove a VBD (PR [#9394](https://github.com/vatesfr/xen-orchestra/pull/9394))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [REST API] Fix `/vms/:id/dashboard` _cannot read properties of undefined (reading 'id')_ (PR [#9380](https://github.com/vatesfr/xen-orchestra/pull/9380))
- [REST API] `vms/:id/dashboard` return now an empty object for the `replication` key instead of undefined (in case of no replication) (PR [#9380](https://github.com/vatesfr/xen-orchestra/pull/9380))
- [REST API] `vms/:id/dashboard` rename `not-in-job` into `not-in-active-job` for the `vmProtection` key to avoid confusion (PR [#9380](https://github.com/vatesfr/xen-orchestra/pull/9380))
- [REST API] Don't return VDI-snapshot for `/vms/:id/vdis` endpoints (PR [#9381](https://github.com/vatesfr/xen-orchestra/pull/9381))
- [Plugins/Backup-reports] Prevent succesful backups from occasionally being reported as interrupted [Forum#11721](https://xcp-ng.org/forum/topic/11721) (PR [#9400](https://github.com/vatesfr/xen-orchestra/pull/9400))
- [REST API] `/dashboard` return now `{isEmpty: true}` instead of undefined in case there is no data to compute (PR [#9395](https://github.com/vatesfr/xen-orchestra/pull/9395))
- [Backup] Fix `read xxx bytes, maximum size allowed is yyy` for full backup on S3 (PR [#9396](https://github.com/vatesfr/xen-orchestra/pull/9396))
- [OpenMetrics] Add missing `sr_name` label to VM disk metrics (PR [#9353](https://github.com/vatesfr/xen-orchestra/pull/9353))
- [Backup] Fix disk export stuck at 99% (PR [#9407](https://github.com/vatesfr/xen-orchestra/pull/9407))
- [REST API] Fix `/vms/:id/actions/start` ignored request body (to start a virtual machine on a specific host) (PR [#9416](https://github.com/vatesfr/xen-orchestra/pull/9416))
- [Backup] Fix reverted VM making the next backup run fails with `VM must be a snapshot` error (PR [#9397](https://github.com/vatesfr/xen-orchestra/pull/9397))

- **XO 6:**
  - [Sidebar] Removal borders top and right of sidebar in mobile (PR [#9366](https://github.com/vatesfr/xen-orchestra/pull/9366))

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
- @xen-orchestra/qcow2 patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi patch
- vhd-cli minor
- vhd-lib patch
- xo-server minor
- xo-server-openmetrics minor
- xo-web minor

<!--packages-end-->
