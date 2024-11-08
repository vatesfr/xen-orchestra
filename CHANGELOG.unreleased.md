> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Dashboard/Health] Do not count PVS cache VDI as orphan VDIs [#7938](https://github.com/vatesfr/xen-orchestra/issues/7938) (PR [#8039](https://github.com/vatesfr/xen-orchestra/pull/8039))
- [OTP] Use numeric mode for easier input on mobile devices
- [Editable/Text] Delete leading and trailing spaces in VM/Pools/Hosts/SRs names and descriptions (PR [#8115](https://github.com/vatesfr/xen-orchestra/pull/8115))

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

- @xen-orchestra/web patch
- @xen-orchestra/web-core minor
- xo-server minor
- xo-web minor

<!--packages-end-->
