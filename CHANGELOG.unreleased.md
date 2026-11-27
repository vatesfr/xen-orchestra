> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [i18n] Update Czech, Danish, Dutch, German, Korean, Portuguese, Portuguese (Brasil), Slovak, Spanish, Swedish and Turkish translations (PR [#10680](https://github.com/vatesfr/xen-orchestra/pull/10680))
- [VDI] Disks of running VMs can be resized when XAPI supports online resize (PR [#10845](https://github.com/vatesfr/xen-orchestra/pull/10845))
- [XO6/Backup repository] Add a _Reclaim space_ action to backup repositories (PR [#10939](https://github.com/vatesfr/xen-orchestra/pull/10939))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

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
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi minor
- xo-server patch

<!--packages-end-->
