> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Netbox] Fix VMs' `site` property being unnecessarily updated on some versions of Netbox (PR [#7145](https://github.com/vatesfr/xen-orchestra/pull/7145))
- [Netbox] Fix "400 Bad Request" error (PR [#7153](https://github.com/vatesfr/xen-orchestra/pull/7153))
- [Backup/Restore] Fix timeout after 5 minutes [#7052](https://github.com/vatesfr/xen-orchestra/issues/7052)
- [Dashboard/Health] Empty VDIs are no longer considered orphans (PR [#7102](https://github.com/vatesfr/xen-orchestra/pull/7102))
- [S3] Handle S3 without *Object Lock* implementation (PR [#7157](https://github.com/vatesfr/xen-orchestra/pull/7157))

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

- @xen-orchestra/fs patch
- @xen-orchestra/proxy patch
- xo-server-netbox patch
- xo-web patch

<!--packages-end-->
