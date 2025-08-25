> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **Migrated REST API endpoints**:

  - `GET /rest/v0/tasks` (PR [#8801](https://github.com/vatesfr/xen-orchestra/pull/8843))
  - `GET /rest/v0/tasks/<task-id>` (PR [#8801](https://github.com/vatesfr/xen-orchestra/pull/8843))
  - `GET /rest/v0/pools/<pool-id>/missing_patches` (PR [#8871](http://github.com/vatesfr/xen-orchestra/pull/8871))

- [Host/General] Display additional hardware data for Dell server (PR [#8861](https://github.com/vatesfr/xen-orchestra/pull/8861))

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
- @xen-orchestra/mixins patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi minor
- xo-server minor
- xo-web patch

<!--packages-end-->
