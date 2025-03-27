> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

- [VM/New]: Add VM creation page and form (PR [#8324](https://github.com/vatesfr/xen-orchestra/pull/8324))

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **XO 6:**
  - [Host] Add dashboard view (PR [#8398](https://github.com/vatesfr/xen-orchestra/pull/8398))
  - [i18n] Update Swedish, Czech, Spanish, Persian, German and add Italian, Russian and Ukrainian translations (PR [#8294](https://github.com/vatesfr/xen-orchestra/pull/8294))
- **Migrated REST API endpoints**:
  - `/rest/v0/vm-templates` (PR [#8450](https://github.com/vatesfr/xen-orchestra/pull/8450))
  - `/rest/v0/vm-templates/<vm-template-id>` (PR [#8450](https://github.com/vatesfr/xen-orchestra/pull/8450))
  - `/rest/v0/vm-controllers` (PR [#8454] (https://github.com/vatesfr/xen-orchestra/pull/8454))
  - `/rest/v0/vm-controllers/<vm-controller-id>` (PR [#8454] (https://github.com/vatesfr/xen-orchestra/pull/8454))
  - `/rest/v0/vm-snapshots` (PR [#8453](https://github.com/vatesfr/xen-orchestra/pull/8453))
  - `/rest/v0/vm-snapshots/<vm-snapshot-id>` (PR [#8453] (https://github.com/vatesfr/xen-orchestra/pull/8453))
- [RPU] Allows to perform an RPU even if an XOSTOR is present on the pool (PR [#8455](https://github.com/vatesfr/xen-orchestra/pull/8455))
- [VM] Updated Nested Virtualization handling to use `platform:nested-virt` for XCP-ng 8.3+ (PR [#8395](https://github.com/vatesfr/xen-orchestra/pull/8395))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [REST API] Correctly return a 404 not found error when trying to get a backup log that does not exist (PR [#8457](https://github.com/vatesfr/xen-orchestra/pull/8457))

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

- @vates/types patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server minor
- xo-server-backup-reports patch
- xo-web minor

<!--packages-end-->
