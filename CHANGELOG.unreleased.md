> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”


- [HUB Recipe] Support custom cluster CIDR and Xo CCM (Cloud Controller Manager) in Pyrgos recipe
- [Disk] Add warning before disconnecting a VBD (PR [#9211](https://github.com/vatesfr/xen-orchestra/pull/9211))

- **XO 6:**
  - [New/VM] Display unsupported features information message (PR [#9203](https://github.com/vatesfr/xen-orchestra/pull/9203))
  - [i18n] Update Czech, German, French, Italian, Dutch, Portuguese (Brazil), and Ukrainian translations, and add Danish translation (PR [#9165](https://github.com/vatesfr/xen-orchestra/pull/9165))

### Bug fixes
- [V2V] fix transfer failing at 99% for unaligned disk (PR [#9233](https://github.com/vatesfr/xen-orchestra/pull/9233))

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

- @vates/nbd-client patch
- vhd-lib patch
- xo-web minor

<!--packages-end-->
