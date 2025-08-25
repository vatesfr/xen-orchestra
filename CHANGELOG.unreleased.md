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
  - `GET /rest/v0/hosts/<host-id>/missing_patches` (PR [#8862](https://github.com/vatesfr/xen-orchestra/pull/8862))

- [Host/General] Display additional hardware data for Dell server (PR [#8861](https://github.com/vatesfr/xen-orchestra/pull/8861))

- **XO 6**:
  - [Pool,Host,VM/Dashboard] Remember the last visited tab per object type (Pool/Host/VM) when navigating (PR [#8873](https://github.com/vatesfr/xen-orchestra/pull/8873))
  - Replace native `select` with a new custom component (PR [#8681](https://github.com/vatesfr/xen-orchestra/pull/8681))
  - [i18n] Add Portuguese (Brazil) and update Czech, German, Spanish, Italian, Dutch and Swedish translations (PR [#8837](https://github.com/vatesfr/xen-orchestra/pull/8837))
  - [Site] Add Backup Jobs page (PR [#8889](https://github.com/vatesfr/xen-orchestra/pull/8889))

- [REST API] Expose `/rest/v0/docs/swagger.json` (PR [#8892](https://github.com/vatesfr/xen-orchestra/pull/8892))
- [web] Add link to the rest api docs (PR [#8902](https://github.com/vatesfr/xen-orchestra/pull/8902))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup/Sequences] Prevent sequences from ending prematurely when a backup job is skipped (PR [#8859](https://github.com/vatesfr/xen-orchestra/pull/8859))
- [Plugins/audit] Prevent audit plugin disabling from failing (PR [#8898](https://github.com/vatesfr/xen-orchestra/pull/8898))

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
- xo-common minor
- xo-server minor
- xo-web minor

<!--packages-end-->
