> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [XO5] Remove XOSAN (PR [#9248](https://github.com/vatesfr/xen-orchestra/pull/9248))
- [Plugins/Backup-reports] Add optional context in email subject and Pool ID in summary [#8544](https://github.com/vatesfr/xen-orchestra/issues/8544) (PR [#8973](https://github.com/vatesfr/xen-orchestra/pull/8973))
- [Plugins/Openmetrics] Expose XCP-NG metrics in OpenMetrics format for Prometheus/Grafana (PR [#9323](https://github.com/vatesfr/xen-orchestra/pull/9323))

- **XO 6:**
  - [Site/Tasks] Implement tasks view and side panel information (PR [#9063](https://github.com/vatesfr/xen-orchestra/pull/9063))
  - [Pool/Tasks] Implement tasks view and side panel information (PR [#9312](https://github.com/vatesfr/xen-orchestra/pull/9312))
  - [Host/Tasks] Implement tasks view and side panel information (PR [#9311](https://github.com/vatesfr/xen-orchestra/pull/9311))
  - [VMs/Tasks] Implement tasks view and side panel information (PR [#9313](https://github.com/vatesfr/xen-orchestra/pull/9313))
  - [i18n] Update Czech, German, Persian, Italian, Japanese, Korean, Norwegian, Dutch, Russian, Swedish and Ukrainian translations (PR [#9305](https://github.com/vatesfr/xen-orchestra/pull/9305))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backups] Don't fail backup with memory on "INVALID_UUID" error (PR [#9308](https://github.com/vatesfr/xen-orchestra/pull/9308))
- [Plugins/Perf-alert] Unload configuration when the plugin is disabled (PR [#9306](https://github.com/vatesfr/xen-orchestra/pull/9306))
- [REST-API] Fix duplicate entries using `ndjson` (PR [#9320](https://github.com/vatesfr/xen-orchestra/pull/9320))
- [Host] Report 0 RAM usage for halted hosts instead of incorrect values (PR [#9272](https://github.com/vatesfr/xen-orchestra/pull/9272))
- [Plugins/OIDC] Fix group import on string (PR [#9280](https://github.com/vatesfr/xen-orchestra/pull/9280))
- [Vm Import] Fix `error intermediate value not iterable` (PR [#9327](https://github.com/vatesfr/xen-orchestra/pull/9327))
- [XO5/Restore] Replace deprecated endpoint call (PR [#9316](https://github.com/vatesfr/xen-orchestra/pull/9316))

- **XO 6:**
  - [VM/New] Fix wording in "Memory" section (PR [#9309](https://github.com/vatesfr/xen-orchestra/pull/9309))
  - [Nav/AccountMenu] License URL wasn’t redirecting properly to XO 5 (PR [#9321](https://github.com/vatesfr/xen-orchestra/pull/9321))

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

- @xen-orchestra/rest-api patch
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi patch
- xen-api patch
- xo-server patch
- xo-server-audit minor
- xo-server-auth-oidc patch
- xo-server-backup-reports minor
- xo-server-openmetrics major
- xo-server-perf-alert minor
- xo-web patch

<!--packages-end-->
