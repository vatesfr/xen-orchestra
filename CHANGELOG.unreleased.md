> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

- **XO6**:

  - [Pool/Network]: Display networks and host internal networks information in side panel (PR [#8286](https://github.com/vatesfr/xen-orchestra/pull/8286))

- [VM] Updated Nested Virtualization handling to use `platform:nested-virt` for XCP-ng 8.3+ (PR [#8395](https://github.com/vatesfr/xen-orchestra/pull/8395))

> Users must be able to say: “Nice enhancement, I'm eager to test it”

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

- @xen-orchestra/web minor
- xo-server minor

<!--packages-end-->
