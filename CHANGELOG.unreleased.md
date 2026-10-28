> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Backup/Restore] Live restore: a disk can now be live mounted read/write, with a cache on an SR of the pool running XO (or the proxy). Each block is read from the BR only once and the VM can boot from it, but what it writes is lost when the mount is released. The live mounted SR and VDI are now named after the backed up VM, disk and backup date (PR [#10434](https://github.com/vatesfr/xen-orchestra/pull/10434))
- [V2V] With `stopSource`, the source VM is shut down cleanly through the VMware tools, and only powered off when its tools do not run or it does not shut down within 10 minutes (PR [#10637](https://github.com/vatesfr/xen-orchestra/pull/10637))
- [Plugins] Add plugin list and detail pages in admin menu, to configure, load, unload and test the plugins (PR [#10593](https://github.com/vatesfr/xen-orchestra/pull/10593))
- [XO6] Display dates and times as `YYYY-MM-DD HH:mm:ss` in all UI views (PR [#10547](https://github.com/vatesfr/xen-orchestra/pull/10547))
- [XO6/VM] Warn that deleting a VM also deletes its snapshots and disks (PR [#10554](https://github.com/vatesfr/xen-orchestra/pull/10554))
- [Backup jobs] Add backup job list in admin menu (PR [#10630](https://github.com/vatesfr/xen-orchestra/pull/10630))
- [Backup jobs] Add backup job side panel in admin menu (PR [#10631](https://github.com/vatesfr/xen-orchestra/pull/10631))
- [Backup jobs] The backup links of the site dashboard and the VM Backups tab now use the backup jobs of the admin menu (PR [#10636](https://github.com/vatesfr/xen-orchestra/pull/10636))
- [Pool/Dashboard] In the CPU and RAM usage cards, show a "No data to calculate" message when there is no host or VM to rank (PR [#10386](https://github.com/vatesfr/xen-orchestra/pull/10386))
- [i18n] Update Chinese (Simplified Han script), Czech, Danish, Dutch, German, Italian, Portuguese, Portuguese (Brasil), Russian, Slovak, Spanish, Swedish and Ukrainian translations (PR [#10464](https://github.com/vatesfr/xen-orchestra/pull/10464))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- Fix `cannot read properties of undefined (reading code)` (PR [#10668](https://github.com/vatesfr/xen-orchestra/pull/10668))
- [SDN Controller] A Global Private Network that fails to be set up, or whose preferred star-center host was removed, no longer blocks the other private networks (PR [#10629](https://github.com/vatesfr/xen-orchestra/pull/10629))
- [V2V] Fix the migration of a running VM whose change tracking (CBT) is not enabled failing on ESXi 7 and 8 once the source is stopped: the change tracking is now enabled on the source VM, so that only the used blocks are read, and only the changed ones for the delta. A partial import made before can't be resumed and is transferred again (PR [#10637](https://github.com/vatesfr/xen-orchestra/pull/10637))

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

- @vates/iscsi minor
- @vates/types minor
- @xen-orchestra/backups minor
- @xen-orchestra/mixins minor
- @xen-orchestra/proxy minor
- @xen-orchestra/rest-api patch
- @xen-orchestra/vmware-explorer minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server minor
- xo-server-sdn-controller patch
- xo-web minor

<!--packages-end-->
