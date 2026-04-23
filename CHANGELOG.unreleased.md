> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [VM] Add possibility to remove a snapshot on snapshot tab (PR [#9749](https://github.com/vatesfr/xen-orchestra/pull/9749))
- [Pool/Hosts] Management IP is now always shown first and the IP column is renamed to "Management IP" (PR [#9747](https://github.com/vatesfr/xen-orchestra/pull/9747))
- [REST API] ACL V2 integration (PR [#9774](https://github.com/vatesfr/xen-orchestra/pull/9774))
- [Pool] Add new Network creation forms (normal, Bonded and Internal) (PR [#9629](https://github.com/vatesfr/xen-orchestra/pull/9629))
- [MCP] Add `?markdown=true` output format to REST API and simplify MCP tools with declarative registry (PR [#9624](https://github.com/vatesfr/xen-orchestra/pull/9624))
- [MCP] Generate tools dynamically from the XO OpenAPI spec at startup: one `{domain}_query` tool per resource domain instead of a fixed tool per endpoint. Stats endpoints are excluded. Write operations can be opted in with `XO_MCP_ENABLE_ACTIONS=1`, with one-shot confirmation tokens for destructive calls. (PR [#9641](https://github.com/vatesfr/xen-orchestra/pull/9641))
- [OpenMetrics] Add per-VDI disk size metrics: `xcp_vdi_virtual_size_bytes` and `xcp_vdi_physical_usage_bytes` [#9680](https://github.com/vatesfr/xen-orchestra/pull/9680)
- [i18n] Update Chinese (Simplified Han script), Czech, Dutch, German, Persian, Polish, Portuguese, Portuguese (Brasil), Slovak, Spanish and Swedish translations (PR [#9729](https://github.com/vatesfr/xen-orchestra/pull/9729))
- [REST API] Add `POST rest/v0/plugins/sdn-controller/networks/:id/actions/add_traffic_rule` and `POST rest/v0/plugins/sdn-controller/networks/:id/actions/delete_traffic_rule` endpoints ([#9418](https://github.com/vatesfr/xen-orchestra/pull/9418))
- [REST API] Add `POST rest/v0/plugins/sdn-controller/vifs/:id/actions/add_traffic_rule` and `POST rest/v0/plugins/sdn-controller/vifs/:id/actions/delete_traffic_rule` endpoints ([#9759](https://github.com/vatesfr/xen-orchestra/pull/9759))
- [Pool/Network] Add Network deletion (PR [#9714](https://github.com/vatesfr/xen-orchestra/pull/9714))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Backup] Fix cleanVm incorrect backup size in metadata (PR [#9637] (https://github.com/vatesfr/xen-orchestra/pull/9637))
- [xo-server] Fix VM-template still visible after deletion (PR [#9760](https://github.com/vatesfr/xen-orchestra/pull/9760))
- **XO 5**:
  - [Icons] Fix display of RHEL 10 icons in vm list (PR [#9766](https://github.com/vatesfr/xen-orchestra/pull/9766))
  - [xo-server-sdn-controller] Better traffic-rules synchronization related to VM lifecycle (PR [#9518](https://github.com/vatesfr/xen-orchestra/pull/9518))

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
- @xen-orchestra/acl major
- @xen-orchestra/backups patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server minor
- xo-server-sdn-controller minor

<!--packages-end-->
