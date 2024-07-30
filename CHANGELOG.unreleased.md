> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM/Advanced] Display an accurate secure boot status and allow user to propagate certificates from pool to VM [#7495](https://github.com/vatesfr/xen-orchestra/issues/7495) (PR [#7751](https://github.com/vatesfr/xen-orchestra/pull/7751))
- [Host/General] Display additional hardware data for 2CRSi server [#7816](https://github.com/vatesfr/xen-orchestra/issues/7816) (PR [#7838](https://github.com/vatesfr/xen-orchestra/pull/7838))
- [VM/Stats] Display a warning when guest tools are not detected (PR [#7831](https://github.com/vatesfr/xen-orchestra/pull/7831))

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

- @xen-orchestra/xapi minor
- xo-server minor
- xo-server-audit minor
- xo-web minor

<!--packages-end-->
