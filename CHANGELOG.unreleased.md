> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Expose `/rest/v0/proxies` and `/rest/v0/proxies/<proxy-id>` (PR [#8920](https://github.com/vatesfr/xen-orchestra/pull/8920))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

[XO6/New VM] Display only ISO VDIs for the ISO input (PR [#8922](https://github.com/vatesfr/pull/8922))

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

- @vates/types minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web patch
- xo-server patch
- xo-web patch

<!--packages-end-->
