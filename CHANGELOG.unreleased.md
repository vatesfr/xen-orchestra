> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **XO 6**:
  - [VM,Host/Console] Display _Console Clipboard_ and _Console Actions_ (PR [#8125](https://github.com/vatesfr/xen-orchestra/pull/8125))
  - [i18n] Add Czech translation (contribution made by [@p-bo](https://github.com/p-bo)) (PR [#8099](https://github.com/vatesfr/xen-orchestra/pull/8099))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM/New] Cloudbase-Init is now correctly supported (PR [#8154](https://github.com/vatesfr/xen-orchestra/pull/8154))

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

- @vates/fatfs minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server minor

<!--packages-end-->
