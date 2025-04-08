> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **Migrated REST API endpoints**:
  - `/rest/v0/vifs` (PR [#8483](https://github.com/vatesfr/xen-orchestra/pull/8483))
  - `/rest/v0/vifs/<vif-id>` (PR [#8483](https://github.com/vatesfr/xen-orchestra/pull/8483))
- [VM/Advanced] Rename `Block migration` to `Disable migration` (PR [#8492](https://github.com/vatesfr/xen-orchestra/pull/8492))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [OpenAPI spec] Fixed some required properties being marked as optional (PR [#8480](https://github.com/vatesfr/xen-orchestra/pull/8480))

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
- @xen-orchestra/web-core minor
- xo-server patch
- xo-web patch

<!--packages-end-->
