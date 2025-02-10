> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Plugin/backup-reports] Add VM Description to the backup report. (contribution made by [@truongtx8](https://github.com/truongtx8)) (PR [#8253](https://github.com/vatesfr/xen-orchestra/pull/8253))
- **XO6**:
  - [Dashboard] Adding a mobile layout (PR [#8268](https://github.com/vatesfr/xen-orchestra/pull/8268))
- [REST API] Swagger interface available on `/rest/v0/docs` endpoint. Endpoint documentation will be added step by step (PR [#8316](https://github.com/vatesfr/xen-orchestra/pull/8316))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

[SDN-controller] Fix _No PIF found_ error when creating a private network [#8027](https://github.com/vatesfr/xen-orchestra/issues/8027) (PR [#8319](https://github.com/vatesfr/xen-orchestra/pull/8319))

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

- @vates/types major
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server-auth-oidc patch
- xo-server-backup-reports minor
- xo-server-sdn-controller patch

<!--packages-end-->
