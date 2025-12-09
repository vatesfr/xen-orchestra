> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **XO 6:**
  - [Navigation] Navigation state is now persisted in localStorage and items are now collapsible while filtering. (PR [#9277](https://github.com/vatesfr/xen-orchestra/pull/9277))

- [REST API] Add link to the openAPI JSON directly in the swagger description (PR [#9285](https://github.com/vatesfr/xen-orchestra/pull/9285))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- **XO 6:**
  - [VDIs] Fix broken fallback link to XO 5 VDIs page (PR [#9267](https://github.com/vatesfr/xen-orchestra/pull/9267))

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

- @xen-orchestra/rest-api patch
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor

<!--packages-end-->
