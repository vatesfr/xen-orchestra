> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Host/Advanced] Display system disks health based on the _smartctl_ plugin. [#4458](https://github.com/vatesfr/xen-orchestra/issues/4458) (PR [#7060](https://github.com/vatesfr/xen-orchestra/pull/7060))
- [Authentication] Failed attempts are now logged as XO tasks (PR [#7061](https://github.com/vatesfr/xen-orchestra/pull/7061))
- [Backup] Prevent VMs from being migrated while they are backed up (PR [#7024](https://github.com/vatesfr/xen-orchestra/pull/7024))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup/Mirror] Fix backup report not being sent (PR [#7049](https://github.com/vatesfr/xen-orchestra/pull/7049))
- [New VM] Only add MBR to cloud-init drive on Windows VMs to avoid booting issues (e.g. with Talos) (PR [#7050](https://github.com/vatesfr/xen-orchestra/pull/7050))
- [VDI Import] Add the SR name to the corresponding XAPI task (PR [#6979](https://github.com/vatesfr/xen-orchestra/pull/6979))

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
- @xen-orchestra/mixins minor
- @xen-orchestra/xapi minor
- vhd-lib patch
- xo-server-backup-reports patch
- xo-server minor
- xo-web minor

<!--packages-end-->
