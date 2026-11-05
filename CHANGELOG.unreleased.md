> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [RPU/RPR] On a pool backed by TWINSTOR, wait for the replicated storage to be back in sync before rebooting each host, instead of rebooting while a single host holds the only up-to-date copy of the data. The first wait happens before HA is disabled, so a pool whose storage is not redundant holds there rather than with HA off (PR [#10248](https://github.com/vatesfr/xen-orchestra/pull/10248))
- [Host] On a pool backed by TWINSTOR, refuse a host reboot, smart reboot or shutdown while the replicated storage is catching up, with the reason and a confirmation to go ahead anyway. Emergency shutdowns are never refused (PR [#10248](https://github.com/vatesfr/xen-orchestra/pull/10248))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [RPU/RPR] Aborting the task now stops the run instead of being ignored, including while it is still setting up: the remaining hosts are no longer rebooted, and VMs stay where the evacuations put them (PR [#10248](https://github.com/vatesfr/xen-orchestra/pull/10248))

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
- @xen-orchestra/qa-test patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web patch
- @xen-orchestra/web-core minor
- xo-server minor
- xo-web minor

<!--packages-end-->
