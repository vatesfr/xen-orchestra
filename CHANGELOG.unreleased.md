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
- [MCP] Generate tools dynamically from the XO OpenAPI spec at startup: one `{domain}_query` tool per resource domain instead of a fixed tool per endpoint. Stats endpoints are excluded. Write operations can be opted in with `XO_MCP_ENABLE_ACTIONS=1`, with one-shot confirmation tokens for destructive calls. (PR [#9641](https://github.com/vatesfr/xen-orchestra/pull/9641))
- [OpenMetrics] Add per-VDI disk size metrics: `xcp_vdi_virtual_size_bytes` and `xcp_vdi_physical_usage_bytes` [#9680](https://github.com/vatesfr/xen-orchestra/pull/9680)
- [i18n] Update Chinese (Simplified Han script), Czech, Danish, Dutch, Finnish, German, Italian, Korean, Norwegian, Persian, Polish, Portuguese, Portuguese (Brasil), Russian, Slovak and Spanish translations (PR [#9649](https://github.com/vatesfr/xen-orchestra/pull/9649))

### Bug fixes

- [Header] Fix `Unable to connect to XO server` falshing every 30 secondes (PR [#9681](https://github.com/vatesfr/xen-orchestra/pull/9681))
- [Backups] Fix regression on cleanVM speed (PR [#9692](https://github.com/vatesfr/xen-orchestra/pull/9692))
- [REST API] Fix memory leak on SSE (PR [#9707](https://github.com/vatesfr/xen-orchestra/pull/9707))

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
