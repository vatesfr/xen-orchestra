> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

- [MCP] Global kill-switch — set `[mcp] enabled = false` in `xo-server` config to immediately reject every MCP client connection

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Swagger] Rename the `acls` tag to `rbacs` (PR [#9874](https://github.com/vatesfr/xen-orchestra/pull/9874))
- [VM] Add possibility to attach a VDI on tab VDI (PR [#9772](https://github.com/vatesfr/xen-orchestra/pull/9772))
- [IPMI-Sensors] Add default outlet regex to the dell preset (PR [#9884](https://github.com/vatesfr/xen-orchestra/pull/9884))
- [Pool/Security] Implement possibility to add new traffic rule from pool (PR [#9809](https://github.com/vatesfr/xen-orchestra/pull/9809))
- [VM/Snapshot] Add possibility to revert a snapshot on a VM (PR [#9862](https://github.com/vatesfr/xen-orchestra/pull/9862))
- [MCP] Restrict which REST endpoints the AI assistant can reach: read-only endpoints are exposed by default, write actions require `XO_MCP_ENABLE_ACTIONS=1` with a confirmation step, and binary/stream endpoints stay hidden (PR [#9875](https://github.com/vatesfr/xen-orchestra/pull/9875))
- [OpenMetrics] Add XOSTOR metrics (cluster status, replica health, SMART, alarms, pending updates) and an `sr_type` label on SR-tagged metrics so Grafana can filter by storage type (PR [#9849](https://github.com/vatesfr/xen-orchestra/pull/9849))
### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [REST API] `POST /vdis` no longer necessarily requires `other_config` (PR [#9883](https://github.com/vatesfr/xen-orchestra/pull/9883))
- [xo-server] Fix network being put first in boot order when HVM template has VDIs (PR [#9867](https://github.com/vatesfr/xen-orchestra/pull/9867))
- [Backup] Fix OUT_OF_RANGE error when resuming failed merge (PR [#9782](https://github.com/vatesfr/xen-orchestra/pull/9782))
- [xo-server] Fix TLS memory leak (PR [#9842](https://github.com/vatesfr/xen-orchestra/pull/9842))
- **XO 5**:
  - [Dashboard/Health] Ignore the replicated VM when checking the number of snapshots(PR [#9868](https://github.com/vatesfr/xen-orchestra/pull/9868))

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
- @xen-orchestra/mcp minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- xo-server patch
- xo-server-ipmi-sensors minor
- xo-server-openmetrics minor
- xo-web patch

<!--packages-end-->
