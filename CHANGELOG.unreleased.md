> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- **XO 6:**
  - [Vm/new] Fix overflow of resource managment input on little screen (PR [#9344](https://github.com/vatesfr/xen-orchestra/pull/9344))
  - [Core/checkbox] Fix width of checkbox when the container is too small. Now checkbox is a square in all cases (PR [#9344](https://github.com/vatesfr/xen-orchestra/pull/9344))
  - [Core/checkbox] Fix width of radio button when the container is too small. Now radio button is a circle in all cases (PR [#9344](https://github.com/vatesfr/xen-orchestra/pull/9344))

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

- @xen-orchestra/web patch

<!--packages-end-->
