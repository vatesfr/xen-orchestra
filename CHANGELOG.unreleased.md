> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Swagger] Rename the `acls` tag to `rbacs` (PR [#9874](https://github.com/vatesfr/xen-orchestra/pull/9874))
- [VM] Add possibility to attach a VDI on tab VDI (PR [#9772](https://github.com/vatesfr/xen-orchestra/pull/9772))
- [IPMI-Plugin] Add default outlet regex to the dell preset (PR [#9884](https://github.com/vatesfr/xen-orchestra/pull/9884))
- [Pool/Security] Implement possibility to add new traffic rule from pool (PR [#9809](https://github.com/vatesfr/xen-orchestra/pull/9809))
- [VM/Snapshot] Add possibility to revert a snapshot on a VM (PR [#9862](https://github.com/vatesfr/xen-orchestra/pull/9862))
- [MCP] Restrict which REST endpoints the AI assistant can reach: read-only endpoints are exposed by default, write actions require `XO_MCP_ENABLE_ACTIONS=1` with a confirmation step, and binary/stream endpoints stay hidden (PR [#9875](https://github.com/vatesfr/xen-orchestra/pull/9875))
- [OpenMetrics] Add XOSTOR metrics (cluster status, replica health, SMART, alarms, pending updates) and an `sr_type` label on SR-tagged metrics so Grafana can filter by storage type (PR [#9849](https://github.com/vatesfr/xen-orchestra/pull/9849))
- [VIF] Implement possibility to add new traffic rule from VIF (PR [#9837](https://github.com/vatesfr/xen-orchestra/pull/9837))
- [VIF] Add a new "General" tab to the VIF page (PR [#9831](https://github.com/vatesfr/xen-orchestra/pull/9831))

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
- @xen-orchestra/web minor
- xo-server-ipmi-sensors patch
<!--packages-end-->
