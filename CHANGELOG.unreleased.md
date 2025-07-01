> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Expose `/rest/v0/pools/<pool-id>/stats` (PR [#8764](https://github.com/vatesfr/xen-orchestra/pull/8764))
- [ACL] Confirmation message when deleting an ACL rule

- **Migrated REST API endpoints**

  - `GET /rest/v0/hosts/<host-id>/audit.txt` (PR [#8757](https://github.com/vatesfr/xen-orchestra/pull/8757))

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
- xo-server minor
- xo-web minor

<!--packages-end-->
