> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Pool] Add new Network creation forms (normal, Bonded and Internal) (PR [#9629](https://github.com/vatesfr/xen-orchestra/pull/9629))
- [MCP] Add `?markdown=true` output format to REST API and simplify MCP tools with declarative registry (PR [#9624](https://github.com/vatesfr/xen-orchestra/pull/9624))
- [OpenMetrics] Add per-VDI disk size metrics: `xcp_vdi_virtual_size_bytes` and `xcp_vdi_physical_usage_bytes` [#9680](https://github.com/vatesfr/xen-orchestra/pull/9680)

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

- @xen-orchestra/mcp minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server-openmetrics minor
- xo-web patch

<!--packages-end-->
