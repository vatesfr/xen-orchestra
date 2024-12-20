> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Dashboard/Health] Add `BOND_STATUS_CHANGED` and `MULTIPATH_PERIODIC_ALERT` in alarms list (PR [#8199](https://github.com/vatesfr/xen-orchestra/pull/8199))
- [Signin] Start transitioning towards XO 6 Design System (PR [#8209](https://github.com/vatesfr/xen-orchestra/pull/8209))
- [Host/Advanced] In host's advanced tab, display MDADM health information (PR [#8190](https://github.com/vatesfr/xen-orchestra/pull/8190))

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

- xo-server minor
- xo-web minor

<!--packages-end-->
