> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [OTP] Key can be copied to clipboard because some clients cannot use the QR code

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [New/SR] Fix 'an error as occured' when creating a new SR (PR [#7931](https://github.com/vatesfr/xen-orchestra/pull/7931))
- [VM/General] Fix 'an error as occured' in general tab view for non-admin users (PR [#7928](https://github.com/vatesfr/xen-orchestra/pull/7928))

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

- @xen-orchestra/web-core patch
- xo-web patch

<!--packages-end-->
