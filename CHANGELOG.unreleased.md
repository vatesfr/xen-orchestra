> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [REST API/VM] Experimental `browser-media` endpoints (administrators only): stream an ISO selected in the browser into a VM CD drive, without uploading it first and without installing anything on the hosts. Available when `iscsi.advertisedAddress` is set (PR [#10426](https://github.com/vatesfr/xen-orchestra/pull/10426))
- [i18n] Update Chinese (Simplified Han script), Czech, Dutch, Finnish, Italian, Norwegian, Persian, Portuguese, Russian, Slovak, Spanish and Turkish translations (PR [#10396](https://github.com/vatesfr/xen-orchestra/pull/10396))

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

- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server minor

- xo-server patch
<!--packages-end-->
