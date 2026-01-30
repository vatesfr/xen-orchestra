> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

- [Settings] Add various themes (PR [#9387](https://github.com/vatesfr/xen-orchestra/pull/9387))

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

- [xo-server-sdn-controller] traffic rules robustness (PR [#9442](https://github.com/vatesfr/xen-orchestra/pull/9442))

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

- @xen-orchestra/web minor
- xo-server-sdn-controller patch

<!--packages-end-->
