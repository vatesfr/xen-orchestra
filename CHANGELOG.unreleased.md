> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **XO 6:**
  - [i18n] Update Czech, Danish, Spanish, French, Italian, Dutch, Portuguese (Brazil), and Russian translations (PR [#9243](https://github.com/vatesfr/xen-orchestra/pull/9243))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [REST API] Fix various _cannot convert undefined or null to object_ (PR [#9304](https://github.com/vatesfr/xen-orchestra/pull/9304))
- [REST API/VM Dashboard] Fix _cannot read property of undefined_ (PR [#9304](https://github.com/vatesfr/xen-orchestra/pull/9304))

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
- @xen-orchestra/web-core minor

<!--packages-end-->
