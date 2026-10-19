> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- Fix `cannot read properties of undefined (reading code)` (PR [#10668](https://github.com/vatesfr/xen-orchestra/pull/10668))
- [SDN Controller] A Global Private Network that fails to be set up, or whose preferred star-center host was removed, no longer blocks the other private networks (PR [#10629](https://github.com/vatesfr/xen-orchestra/pull/10629))

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
- xo-server-sdn-controller patch

<!--packages-end-->
