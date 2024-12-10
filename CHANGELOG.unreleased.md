> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

- [Host/Patches] Users with non-admin permissions on hosts can no longer update them (PR [#8176](https://github.com/vatesfr/xen-orchestra/pull/8176))

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Host/Patches] Rolling Pool Reboot and Update can now be planned as a Job (PR [#8185](https://github.com/vatesfr/xen-orchestra/pull/8185))
- [REST/VM] When creating a VM, it is possible to create more VDIs or delete/update template's VDIs (PR [#8167](https://github.com/vatesfr/xen-orchestra/pull/8167))
- [Backup] VMs with this tag `xo:no-health-check` or `xo:no-health-check=REASON` will not be tested by health check (PR [#8189](https://github.com/vatesfr/xen-orchestra/pull/8189))
- [Pool, Host/Patches] List missing patches for `>= 8.4` XenServer hosts [Forum#9550](https://xcp-ng.org/forum/topic/9550/xenserver-8-patching/20) (PR [#8183](https://github.com/vatesfr/xen-orchestra/pull/8183))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM] Fix `VDI_NOT_IN_MAP` error during migration (PR [#8179](https://github.com/vatesfr/xen-orchestra/pull/8179))
- [Backups/CBT] Improve enabling/disabling CBT on slower storages (PR [#8184](https://github.com/vatesfr/xen-orchestra/pull/8184))

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

- @xen-orchestra/backups minor
- @xen-orchestra/web patch
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi minor
- xen-api minor
- xo-server minor
- xo-web minor

<!--packages-end-->
