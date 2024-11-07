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

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Remote] Better encoding of special chars in username in remote (PR [#8106](https://github.com/vatesfr/xen-orchestra/pull/8106))
- [Backup] Connect sequentially to hosts when using multiple NBD to alleviate a race condition leading to `VDI_IN_USE` errors (PR [#8086](https://github.com/vatesfr/xen-orchestra/pull/8086))

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
- @xen-orchestra/web patch
- @xen-orchestra/web-core minor
- xo-remote-parser patch
- xo-server minor
- xo-web minor

<!--packages-end-->
