> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [XOSTOR] Allow to copy VDI uuid in the resources table (PR [#7629](https://github.com/vatesfr/xen-orchestra/pull/7629))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Pool] Fix `Headers Timeout Error` when installing patches on XCP-ng

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

- xo-server patch
- xo-web minor

<!--packages-end-->
