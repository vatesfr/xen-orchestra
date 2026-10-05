> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [XO6/SR] Add VDIs tab to the dedicated Storage Repository page (PR [#10142](https://github.com/vatesfr/xen-orchestra/pull/10142))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Servers] Fix servers stuck in `Connecting` state when using an HTTPS proxy that support HTTP/2 ([Forum#12502](https://xcp-ng.org/forum/topic/12502/xoa-6.9-update)) (PR [#10507](https://github.com/vatesfr/xen-orchestra/pull/10507))
- [Backups] Fix synchronized backups task log showing VM count+1 (PR [#10518](https://github.com/vatesfr/xen-orchestra/pull/10518))
- [V2V] Fix `vectura is not runnable` on XOA and other systems based on Debian 11 (glibc 2.31): the `vectura` binary required glibc 2.34
- [VM/System] Fix video RAM displayed in bytes instead of MiB (PR [#10486](https://github.com/vatesfr/xen-orchestra/pull/10486))
- [XO5/Hosts] Disable restart toolstack button for the hosts that belongs to a HA pools in the home page (PR [#10497](https://github.com/vatesfr/xen-orchestra/pull/10497))
- [Backup/replication] fix to ensure distributed replications are deleted according to retention( PR [#10491] (https://github.com/vatesfr/xen-orchestra/pull/10491))
- [Replication] Fix `Cannot read properties of undefined (reading 'get')` error on continuous replication to multiple SRs (PR [#10519](https://github.com/vatesfr/xen-orchestra/pull/10519))
- [VM/Snapshot] In the side panel, correctly filter VDIs associated with the VM snapshot (PR [#10510](https://github.com/vatesfr/xen-orchestra/pull/10510))


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

- @xen-orchestra/backups patch
- @xen-orchestra/qa-test patch
- @xen-orchestra/vmware-explorer patch
- @xen-orchestra/web minor
- @xen-orchestra/web-core patch
- vectura patch
- xen-api patch
- xo-web patch

<!--packages-end-->
