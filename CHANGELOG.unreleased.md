> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Settings/Servers] Display last known pool name as server default label (PR [#8206](https://github.com/vatesfr/xen-orchestra/pull/8206))
- **XO6**:
  - [Dashboard] Display size used by XO replications (PR [#8300](https://github.com/vatesfr/xen-orchestra/pull/8300))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM/New] Fix _Int64 expected, got 'N'_ when trying to create a VM without passing VDI sizes in `existingDisks` (PR [#8291](https://github.com/vatesfr/xen-orchestra/pull/8291))

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
- xo-server minor

<!--packages-end-->
