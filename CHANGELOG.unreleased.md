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
  - `/rest/v0/pools` (PR [#8490](https://github.com/vatesfr/xen-orchestra/pull/8490))
  - `/rest/v0/pools/<pool-id>` (PR [#8490](https://github.com/vatesfr/xen-orchestra/pull/8490))
  - `/rest/v0/alarms` (PR [#8485](https://github.com/vatesfr/xen-orchestra/pull/8485))
  - `/rest/v0/alarms/<alarm-id>` (PR [#8485](https://github.com/vatesfr/xen-orchestra/pull/8485))
  - `/rest/v0/messages` (PR [#8485](https://github.com/vatesfr/xen-orchestra/pull/8485))
  - `/rest/v0/messages/<message-id>` (PR [#8485](https://github.com/vatesfr/xen-orchestra/pull/8485))
- [VM/Advanced] Rename `Block migration` to `Prevent migration` (PR [#8500](https://github.com/vatesfr/xen-orchestra/pull/8500))
- [VM/system] Create system pages (PR [#8513](https://github.com/vatesfr/xen-orchestra/pull/8513))
- [Dashboard/Health] Display snapshots older than 30 days for which no schedules are enabled (PR [#8487](https://github.com/vatesfr/xen-orchestra/pull/8487))
- [REST API] Expose `/rest/v0/schedules` and `/rest/v0/schedules/<schedule-id>` enpoints (PR [#8477](https://github.com/vatesfr/xen-orchestra/pull/8477))
- [REST API] Expose the possibility to run a schedule `/rest/v0/schedules/<schedule-id>/actions/run` (PR [#8477](https://github.com/vatesfr/xen-orchestra/pull/8477))
- [Host/Networks] PIFs can now be filtered by network names
- [Plugins/audit] Add an option to import audit logs from an XOA to another (PR [#8474](https://github.com/vatesfr/xen-orchestra/pull/8474))
- **XO 6:**
  - [i18n] Update Swedish, Czech, Spanish, Persian, Italian, Russian and add Dutch translations (PR [#8465](https://github.com/vatesfr/xen-orchestra/pull/8465))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backups] Don't flood logs when a remote doesn't have any VM (PR [#8489](https://github.com/vatesfr/xen-orchestra/pull/8489))
- [Backups] Properly show a permission error during config backup (PR [#8489](https://github.com/vatesfr/xen-orchestra/pull/8489))

- [Backups] Don't flood logs when a remote doesn't have any VM (PR [#8489](https://github.com/vatesfr/xen-orchestra/pull/8489))
- [Backups] Properly show a permission error during config backup (PR [#8489](https://github.com/vatesfr/xen-orchestra/pull/8489))
- [New VM] Fix `DEVICE_ALREADY_EXISTS(#)` (PR [#8473](https://github.com/vatesfr/xen-orchestra/pull/8473))
- [OpenAPI spec] Fixed some required properties being marked as optional (PR [#8480](https://github.com/vatesfr/xen-orchestra/pull/8480))
- [VM/Advanced] Do not show VM creator to non-admins [#8463](https://github.com/vatesfr/xen-orchestra/issues/8463) (PR [#8503](https://github.com/vatesfr/xen-orchestra/pull/8503))
- **XO 6:**
  - [VM/Create] Fix TS type-check errors (PR [#8472](https://github.com/vatesfr/xen-orchestra/pull/8472))

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
- @xen-orchestra/audit-core minor
- @xen-orchestra/backups minor
- @xen-orchestra/fs minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server patch
- xo-server-audit minor
- xo-web minor

<!--packages-end-->
