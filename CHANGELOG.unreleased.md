> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [XO6/Treeview] Fix hosts alignment in Treeview when hosts have different numbers of VMs (PR [#10153](https://github.com/vatesfr/xen-orchestra/pull/10153))
- [REST API] Possibility of sending `shutdownPinnedVms` in the body of the `/pools/:id/actions/rolling_update` and `rolling_reboot` endpoints (PR [#10125](https://github.com/vatesfr/xen-orchestra/pull/10125))
- [Rolling Pool Update/Reboot] New `shutdownPinnedVms` option: VMs that cannot be migrated because they use a host-bound device (PCI passthrough, vGPU, SR-IOV VIF) are cleanly shut down before their host reboots and started again on it afterwards, instead of aborting the whole run. When such VMs block the run, XO now lists them and asks for confirmation instead of failing with a raw `CANNOT_EVACUATE_HOST` error (PR [#10125](https://github.com/vatesfr/xen-orchestra/pull/10125))
- [i18n] Update Czech, Dutch, German, Korean, Portuguese and Slovak translations (PR [#10033](https://github.com/vatesfr/xen-orchestra/pull/10033))
- [XO6/copyAll button] Add copy all button for IP list and bond device (PR [#10081](https://github.com/vatesfr/xen-orchestra/pull/10081))
- [OpenMetrics] Add `content_type` to SR capacity metrics and the full `sr_uuid` to host disk metrics for easier Grafana correlation (PR [#10149](https://github.com/vatesfr/xen-orchestra/pull/10149))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Backups] Fix qcow2 transfer without NBD (PR [#10164](https://github.com/vatesfr/xen-orchestra/pull/10164))
- [Backups] Force a full backup if any suspect is detected on qcow2 without nbd (PR [#10164](https://github.com/vatesfr/xen-orchestra/pull/10164))
- [Backups] Force a full replication if any suspect is detected on qcow2 without nbd (PR [#10164](https://github.com/vatesfr/xen-orchestra/pull/10164))
- [Backups] Fix aggregated backup failing instead of falling back to a full backup (PR [#10164](https://github.com/vatesfr/xen-orchestra/pull/10164))
- [XO6] Fix the VM's VDI tab, which always displays an empty list on initial load (PR [#10156](https://github.com/vatesfr/xen-orchestra/pull/10156))
- [XO6] Fix the VM's VDI tab, which sometimes displays an error (PR [#10156](https://github.com/vatesfr/xen-orchestra/pull/10156))
- [XO6] Reduce the number of HTTP requests when navigating between pages (PR [#10156](https://github.com/vatesfr/xen-orchestra/pull/10156))
- [Backups] Don't hide errors during transfers (PR [#10183](https://github.com/vatesfr/xen-orchestra/pull/10183))
- [Smart reboot] Fix `suspendBlocked` error when no issue to suspend resident VMs (PR [#10180](https://github.com/vatesfr/xen-orchestra/pull/10180))

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
- @xen-orchestra/backup-archive patch
- @xen-orchestra/backups patch
- @xen-orchestra/disk-transform patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi patch
- xo-server minor
- xo-server-openmetrics minor
- xo-web minor

<!--packages-end-->
