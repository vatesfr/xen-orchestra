> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **Migrated REST API endpoints**:

  - `GET /rest/v0/hosts/<host-id>/smt` (PR [#8863](http://github.com/vatesfr/xen-orchestra/pull/8863))
  - `GET /rest/v0/vms/<vm-id>/vdis` (PR [#8876](http://github.com/vatesfr/xen-orchestra/pull/8876))
  - `GET /rest/v0/vm-templates/<vm-template-id>/vdis` (PR [#8876](http://github.com/vatesfr/xen-orchestra/pull/8876))
  - `GET /rest/v0/vm-snapshots/<vm-snapshot-id>/vdis` (PR [#8876](http://github.com/vatesfr/xen-orchestra/pull/8876))
  - `GET /rest/v0/vm-controllers/<vm-controller-id>/vdis` (PR [#8876](http://github.com/vatesfr/xen-orchestra/pull/8876))

- [REST API] Expose `/rest/v0/docs/swagger.json` (PR [#8892](https://github.com/vatesfr/xen-orchestra/pull/8892))

- **XO 6**:
  - [Pool,Host,VM/Dashboard] Remember the last visited tab per object type (Pool/Host/VM) when navigating (PR [#8873](https://github.com/vatesfr/xen-orchestra/pull/8873))
  - Replace native `select` with a new custom component (PR [#8681](https://github.com/vatesfr/xen-orchestra/pull/8681))

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
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server minor

<!--packages-end-->
