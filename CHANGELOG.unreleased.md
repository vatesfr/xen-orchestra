> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [i18n] Japanese translation (PR [#7582](https://github.com/vatesfr/xen-orchestra/pull/7582))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- Fix support of XenServer 6.5 (broken in XO 5.93.0)

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

- @vates/xml major
- @vates/xml-rpc major
- xen-api patch
- xo-web minor

<!--packages-end-->
