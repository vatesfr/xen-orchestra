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

- **Azure Blob Storage**:
  - [Backups]: Implemented Azure Blob Storage for backups, Integrating with both the Azurite emulator and Azure (PR [#8415](https://github.com/vatesfr/xen-orchestra/pull/8415))

### Bug fixes

[REST API] Ability to use `ndjson` query parameter also on migrated collections (PR [#8628](https://github.com/vatesfr/xen-orchestra/pull/8628))

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM/Advanced] Fix CPU mask list in VM (PR [#8661](https://github.com/vatesfr/xen-orchestra/pull/8661))

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
- @xen-orchestra/fs minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xen-api patch
- xo-server minor
- xo-server-perf-alert patch
- xo-web patch

<!--packages-end-->
