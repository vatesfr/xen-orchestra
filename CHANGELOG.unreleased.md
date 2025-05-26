> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **Migrated REST API endpoints**:
  - `/rest/v0/pifs` (PR [#8569](https://github.com/vatesfr/xen-orchestra/pull/8569))
  - `/rest/v0/pifs/<pif-id>` (PR [#8569](https://github.com/vatesfr/xen-orchestra/pull/8569))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- **XO 6**:
  - [VM] Add auto redirection from /vm/[id] to /vm/[id]/console (PR [#8553](https://github.com/vatesfr/xen-orchestra/pull/8553))
  - [Hosts] Avoid getting XO tasks logs flooded with errors on `host.isPubKeyTooShort` (PR [#8605](https://github.com/vatesfr/xen-orchestra/pull/8605))

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
- @xen-orchestra/web patch
- xo-server patch
- xo-web patch

<!--packages-end-->
