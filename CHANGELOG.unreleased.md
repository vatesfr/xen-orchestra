> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

- [Backup/Live mount] A connection to the iSCSI target that has not logged in yet, such as a port scan or a failed CHAP login, no longer interrupts the mounted disk (PR [#10465](https://github.com/vatesfr/xen-orchestra/pull/10465))
- [Backup/Live mount] The mounted disk is reported as write-protected, so the guest sees it read-only instead of getting I/O errors on write, and the iSCSI target bounds the size of what a client can make it buffer

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

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

- @vates/iscsi minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor

<!--packages-end-->
