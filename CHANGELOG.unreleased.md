> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **XO 6**:
  - [Pool/Networks]: Display networks and host internal networks lists in pool view (PR [#8182](https://github.com/vatesfr/xen-orchestra/pull/8182))
  - [Host/Networks]: Display Pifs lists in host view (PR [#8235](https://github.com/vatesfr/xen-orchestra/pull/8198))

### Bug fixes

- **XO 6**:
	- [Pool/Network] Fix issue with network status (PR [#8284](https://github.com/vatesfr/xen-orchestra/pull/8284))

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
- @xen-orchestra/web-core minor

<!--packages-end-->
