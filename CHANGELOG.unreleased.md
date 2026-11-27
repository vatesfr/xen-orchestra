> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [i18n] Update Czech, Danish, Dutch, German, Korean, Portuguese, Portuguese (Brasil), Slovak, Spanish, Swedish and Turkish translations (PR [#10680](https://github.com/vatesfr/xen-orchestra/pull/10680))
- [VDI] Disks of running VMs can be resized when XAPI supports online resize (PR [#10845](https://github.com/vatesfr/xen-orchestra/pull/10845))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [XO5/Backup] The backup job list no longer crashes on metadata jobs created in XO 6 with all or dynamically selected pools, and shows the modes of jobs targeting all or dynamically selected repositories

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
- @xen-orchestra/rest-api patch
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi minor
- xo-server patch
- xo-web patch

<!--packages-end-->
