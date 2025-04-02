> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Expose `/rest/v0/schedules` and `/rest/v0/schedules/<schedule-id>` enpoints (PR [#8477](https://github.com/vatesfr/xen-orchestra/pull/8477))
- [REST API] Expose the possibility to run a schedule `/rest/v0/schedules/<schedule-id>/actions/run` (PR [#8477](https://github.com/vatesfr/xen-orchestra/pull/8477))

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

- @vates/types minor
- @xen-orchestra/rest-api minor

<!--packages-end-->
