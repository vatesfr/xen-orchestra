> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST/VM] When creating a VM, the template's VIFs are created. It is also possible to create more VIFs or delete/update template's VIFs (PR [#8137](https://github.com/vatesfr/xen-orchestra/pull/8137))
- [Host/General] Shows if a BIOS update is available for 2CRSi server (PR [#8146](https://github.com/vatesfr/xen-orchestra/pull/8146))
- **XO 6**:
  - Add 404 page (PR [#8145](https://github.com/vatesfr/xen-orchestra/pull/8145))
- [backups] Handle VTPM content on incremental backup/replication/restore, including differential restore (PR [#8139](https://github.com/vatesfr/xen-orchestra/pull/8139))
- [Host/Advanced] Allow bypassing blocked migration in maintenance mode (PR [#8149](https://github.com/vatesfr/xen-orchestra/pull/8149))
- [Backup] Long-term retention

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

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
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- vhd-lib patch
- xo-server minor
- xo-web minor

<!--packages-end-->
