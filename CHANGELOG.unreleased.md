> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

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
- [Plugins/Usage Report] Add RAM and CPU allocation columns to reports to help identify over/under-provisioned VMs (PR [#9224](https://github.com/vatesfr/xen-orchestra/pull/9224))
- [Backup archives] Add `vm.tags` to `backups archives` (PR [#9190](https://github.com/vatesfr/xen-orchestra/pull/9190))
- [Menu] Add link from XO 5 to XO 6 (PR [#9187](https://github.com/vatesfr/xen-orchestra/pull/9187))
- [REST API] Expose VM dashboard endpoint `GET /rest/v0/vms/:vm-id/dashboard` (PR [#9143](https://github.com/vatesfr/xen-orchestra/pull/9143))
- [Plugins/load balancer] Add 'Affinity tag' option in plugin configuration (PR [#9116](https://github.com/vatesfr/xen-orchestra/pull/9116))
- [REST API] **Breaking changes** Async actions now return `application/json` (PR [#9209](https://github.com/vatesfr/xen-orchestra/pull/9209))
- [HUB Recipe] Support custom cluster CIDR and Xo CCM (Cloud Controller Manager) in Pyrgos recipe

- **XO 6:**
  - [XO routes] fetch xo gui routes (PR [#9138](https://github.com/vatesfr/xen-orchestra/pull/9138))
  - [Input search] update design of input search (PR [#9156](https://github.com/vatesfr/xen-orchestra/pull/9156))
  - [Site/Hosts] Implement hosts view and side panel information (PR [#9128](https://github.com/vatesfr/xen-orchestra/pull/9128))
  - [Backups] Update wordings for backup jobs' modes to match XO documentation (PR [#9199](https://github.com/vatesfr/xen-orchestra/pull/9199))
  - [Pool] Add Storage Repositories page to display all SRs in the pool (PR [#9134](https://github.com/vatesfr/xen-orchestra/pull/9134))
  - [Host] Add Storage Repositories page to display all SRs in the host (PR [#9137](https://github.com/vatesfr/xen-orchestra/pull/9137))
  - [Site/VMs] Implement VMs view and side panel information (PR [#9145](https://github.com/vatesfr/xen-orchestra/pull/9145))
  - [Settings page] Create settings page accessible from user menu (PR [#9175](https://github.com/vatesfr/xen-orchestra/pull/9175))
  - [Pool/VMs] Implement VMs view and side panel information (PR [#9196](https://github.com/vatesfr/xen-orchestra/pull/9196))
  - [Host/VMs] Implement VMs view and side panel information (PR [#9193](https://github.com/vatesfr/xen-orchestra/pull/9193))
  - [New/VM] Display unsupported features information message (PR [#9203](https://github.com/vatesfr/xen-orchestra/pull/9203))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VIF] Fix VIFs with device > 7 being destroyed when changing network - now uses non-destructive VIF.move API (XenServer 7.1+) that preserves VIF UUID and avoids network downtime (PR [#9221](https://github.com/vatesfr/xen-orchestra/pull/9221))
- [Backups] use the oldest record for Long Term Retention instead of newest (PR [#9180](https://github.com/vatesfr/xen-orchestra/pull/9180))
- [Backups] fix infinite chain of snapshot and replication [Forum#11540](https://xcp-ng.org/forum/topic/11540) [Forum#11539](https://xcp-ng.org/forum/topic/11539) (PR [#9202](https://github.com/vatesfr/xen-orchestra/pull/9202))
- [V2V] fix missing libssl.so.3 in path on debian 11 (PR [#9208](https://github.com/vatesfr/xen-orchestra/pull/9208))
- [Backups/File level restore] ignore swap partition (PR [#9182](https://github.com/vatesfr/xen-orchestra/pull/9182))
- [Backups/File level restore] Better handling of LVM on GPT partition (PR [#9182](https://github.com/vatesfr/xen-orchestra/pull/9182))
- [REST API] Fix `/rest/v0/backup-jobs` return non backup-jobs (PR [#9210](https://github.com/vatesfr/xen-orchestra/pull/9210))

- **XO 6:**
  - [Host/Vm] fix issues on dashboards, and translation on charts (PR [#9204](https://github.com/vatesfr/xen-orchestra/pull/9204))

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
- @xen-orchestra/rest-api minor
- @xen-orchestra/vmware-explorer patch
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi patch
- xo-collection minor
- xo-server minor
- xo-server-load-balancer minor
- xo-server-transport-email patch
- xo-server-usage-report minor
- xo-vmdk-to-vhd patch
- xo-web minor

<!--packages-end-->
