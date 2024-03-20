> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM Creation] Automatically create a VTPM if the template requests it (Windows templates starting from XCP-ng 8.3) (PR [#7436](https://github.com/vatesfr/xen-orchestra/pull/7436))
- [OTP] Accepts (ignores) whitespaces in the one-time password (some OTP applications add them for nicer display)
- [VM/General] Show current VM tags without the need to search them in advanced creation tag selector [#7351](https://github.com/vatesfr/xen-orchestra/issues/7351) (PR [#7434](https://github.com/vatesfr/xen-orchestra/pull/7434))
- [xo-cli] Supports signing in with one-time password (PR [#7459](https://github.com/vatesfr/xen-orchestra/pull/7459))
- [Plugin/load-balancer] A parameter was added in performance mode to balance VMs on hosts depending on their number of vCPUs, when it does not cause performance issues [#5389](https://github.com/vatesfr/xen-orchestra/issues/5389) (PR [#7333](https://github.com/vatesfr/xen-orchestra/pull/7333))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [ISO SR] During ISO migration, the destination SRs were not ISO SRs [#7392](https://github.com/vatesfr/xen-orchestra/issues/7392) (PR [#7431](https://github.com/vatesfr/xen-orchestra/pull/7431))
- [VM/Migration] Fix VDIs that were not migrated to the destination SR (PR [#7360](https://github.com/vatesfr/xen-orchestra/pull/7360))
- [Home/VM] VMs migration from the home view will no longer execute a [Migration with Storage Motion](https://github.com/vatesfr/xen-orchestra/blob/master/docs/manage_infrastructure.md#vm-migration-with-storage-motion-vmmigrate_send) unless it is necessary [Forum#8279](https://xcp-ng.org/forum/topic/8279/getting-errors-when-migrating-4-out-5-vmguest/)(PR [#7360](https://github.com/vatesfr/xen-orchestra/pull/7360))
- [VM/Migration] SR is no longer required if you select a migration network (PR [#7360](https://github.com/vatesfr/xen-orchestra/pull/7360))
- [Backup] Fix `an error has occurred` when clicking on warning text in logs (PR [#7458](https://github.com/vatesfr/xen-orchestra/pull/7458))
- [JSON-RPC API] Correctly require one-time password if configured for user (PR [#7459](https://github.com/vatesfr/xen-orchestra/pull/7459))

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

- @vates/otp minor
- @xen-orchestra/backups patch
- @xen-orchestra/proxy minor
- @xen-orchestra/self-signed patch
- @xen-orchestra/xapi patch
- xen-api major
- xo-cli minor
- xo-server minor
- xo-server-load-balancer minor
- xo-web minor

<!--packages-end-->
