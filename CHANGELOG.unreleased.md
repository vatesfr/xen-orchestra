> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

- [Plugins/transport-email] Update nodemailer

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

- **XO 6:**
  - [Input search] update design of input search (PR [#9156](https://github.com/vatesfr/xen-orchestra/pull/9156))
  - [Site/Hosts] Implement hosts view and side panel information (PR [#9128](https://github.com/vatesfr/xen-orchestra/pull/9128))
  - [Backups] Update wordings for backup jobs' modes to match XO documentation (PR [#9199](https://github.com/vatesfr/xen-orchestra/pull/9199))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backups] use the oldest record for Long Term Retention instead of newest (PR [#9180](https://github.com/vatesfr/xen-orchestra/pull/9180))
- [Backups] fix infinite chain of snapshot and replication [Forum#11540](https://xcp-ng.org/forum/topic/11540) [Forum#11539](https://xcp-ng.org/forum/topic/11539) (PR [#9202](https://github.com/vatesfr/xen-orchestra/pull/9202))
- [V2V] fix missing libssl.so.3 in path on debian 11 (PR [#9208](https://github.com/vatesfr/xen-orchestra/pull/9208))

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
- xo-server-transport-email patch
- xo-server-usage-report minor
- xo-web minor

<!--packages-end-->
