> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [VIF] Implement possibility to add new traffic rule from VIF (PR [#9837](https://github.com/vatesfr/xen-orchestra/pull/9837))
- [VM] Add possibility to create a VDI on tab VDI (PR [#9848](https://github.com/vatesfr/xen-orchestra/pull/9848))
- [VIF] Add a new "General" tab to the VIF page (PR [#9831](https://github.com/vatesfr/xen-orchestra/pull/9831))
- [i18n] Update Chinese (Simplified Han script), Czech, Dutch, German, Korean, Slovak, Spanish and Swedish translations (PR [#9780](https://github.com/vatesfr/xen-orchestra/pull/9780))
- **RBAC** check for REST API endpoints:
  - GET `/vdi-snapshots/{id}.{format}` (PR [#9906](https://github.com/vatesfr/xen-orchestra/pull/9906))
  - GET `/vdi-snapshots/{id}` (PR [#9906](https://github.com/vatesfr/xen-orchestra/pull/9906))
  - DELETE `/vdi-snapshots/{id}` (PR [#9906](https://github.com/vatesfr/xen-orchestra/pull/9906))
  - PUT `/vdi-snapshots/{id}/tags/{tag}` (PR [#9906](https://github.com/vatesfr/xen-orchestra/pull/9906))
  - DELETE `/vdi-snapshots/{id}/tags/{tag}` (PR [#9906](https://github.com/vatesfr/xen-orchestra/pull/9906))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

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
- @xen-orchestra/acl minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor

<!--packages-end-->
