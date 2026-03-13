> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

- [@vates/node-vsphere-soap] Update axios, follow-redirects (transitive) (PR [#9640](https://github.com/vatesfr/xen-orchestra/pull/9640))
- [@xen-orchestra/backups] Update tar (PR [#9640](https://github.com/vatesfr/xen-orchestra/pull/9640))
- [@xen-orchestra/fs] Update fast-xml-parser (transitive) (PR [#9640](https://github.com/vatesfr/xen-orchestra/pull/9640))
- [@xen-orchestra/lite] Update lodash-es, vite, rollup (transitive), postcss (transitive) (PR [#9640](https://github.com/vatesfr/xen-orchestra/pull/9640))
- [@xen-orchestra/mcp] Update hono (transitive), @hono/node-server (transitive), express-rate-limit (transitive) (PR [#9640](https://github.com/vatesfr/xen-orchestra/pull/9640))
- [@xen-orchestra/mixins] Update node-forge (transitive) (PR [#9640](https://github.com/vatesfr/xen-orchestra/pull/9640))
- [@xen-orchestra/proxy] Update koa (PR [#9640](https://github.com/vatesfr/xen-orchestra/pull/9640))
- [@xen-orchestra/rest-api] Update @hapi/content (transitive), path-to-regexp (transitive) (PR [#9640](https://github.com/vatesfr/xen-orchestra/pull/9640))
- [@xen-orchestra/vmware-explorer] Update undici (PR [#9640](https://github.com/vatesfr/xen-orchestra/pull/9640))
- [@xen-orchestra/web] Update lodash-es, vite (PR [#9640](https://github.com/vatesfr/xen-orchestra/pull/9640))
- [@xen-orchestra/web-core] Update lodash-es (PR [#9640](https://github.com/vatesfr/xen-orchestra/pull/9640))
- [Packages] Update lodash, picomatch (transitive), minimatch (transitive), ajv (transitive), bn.js (transitive) (PR [#9640](https://github.com/vatesfr/xen-orchestra/pull/9640))
- [xen-api] Update undici, basic-ftp (transitive) (PR [#9640](https://github.com/vatesfr/xen-orchestra/pull/9640))
- [xo-server] Update fast-xml-parser, pug (PR [#9640](https://github.com/vatesfr/xen-orchestra/pull/9640))
- [xo-server-auth-saml] Update @xmldom/xmldom (transitive) (PR [#9640](https://github.com/vatesfr/xen-orchestra/pull/9640))
- [xo-web] Update immutable, pug (transitive), postcss (transitive) (PR [#9640](https://github.com/vatesfr/xen-orchestra/pull/9640))

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [BACKUPS] Add merged size in cleanVm task log (PR [#9679](https://github.com/vatesfr/xen-orchestra/pull/9679))
- [Pool] Add new Network creation forms (normal, Bonded and Internal) (PR [#9629](https://github.com/vatesfr/xen-orchestra/pull/9629))
- [MCP] Add `?markdown=true` output format to REST API and simplify MCP tools with declarative registry (PR [#9624](https://github.com/vatesfr/xen-orchestra/pull/9624))
- [OpenMetrics] Add per-VDI disk size metrics: `xcp_vdi_virtual_size_bytes` and `xcp_vdi_physical_usage_bytes` (PR [#9680](https://github.com/vatesfr/xen-orchestra/pull/9680))
- [i18n] Update Chinese (Simplified Han script), Czech, Danish, Dutch, Finnish, German, Italian, Korean, Norwegian, Persian, Polish, Portuguese, Portuguese (Brasil), Russian, Slovak and Spanish translations (PR [#9649](https://github.com/vatesfr/xen-orchestra/pull/9649))
- [OpenMetrics] Add 9 missing host RRD metrics: `hostload`, `memory_reclaimed`, `memory_reclaimed_max`, `running_vcpus`, `pif_aggr_rx`, `pif_aggr_tx`, `iops_total`, `io_throughput_total`, `latency` per SR (PR [#9696](https://github.com/vatesfr/xen-orchestra/pull/9696))
- [Netbox] Use platform hierarchy to assign versioned OS names (e.g. "Debian 12" instead of "Debian") when the major version is known (requires Netbox >= 4.4) [#7773](https://github.com/vatesfr/xen-orchestra/issues/7773) (PR [#9644](https://github.com/vatesfr/xen-orchestra/pull/9644))
- [Backups] Backups no longer use their own task system, but instead use the same system as XO Task. This will help improve loading times in the future (PR [#9734](https://github.com/vatesfr/xen-orchestra/pull/9734))
- [OpenMetrics] Add VM status (`xcp_vm_status`) and VM uptime (`xcp_vm_uptime_seconds`) metrics [#9684](https://github.com/vatesfr/xen-orchestra/pull/9684)
- **XO 5**:
  - [Settings/Servers] Add info tip to remind users to only add pool masters

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Header] Fix `Unable to connect to XO server` falshing every 30 secondes (PR [#9681](https://github.com/vatesfr/xen-orchestra/pull/9681))
- [Backups] Fix regression on cleanVM speed (PR [#9692](https://github.com/vatesfr/xen-orchestra/pull/9692))
- [REST API] Fix memory leak on SSE (PR [#9707](https://github.com/vatesfr/xen-orchestra/pull/9707))
- [xo-server] Fix memory leak with secure session (PR [#9725](https://github.com/vatesfr/xen-orchestra/pull/9725))
- [xo-server-sdn-controller] Better traffic-rules synchronization related to VM lifecycle (PR [#9518](https://github.com/vatesfr/xen-orchestra/pull/9518))
- **XO 5**:
  - [VM/Copy]: Fix compression not used when copying a VM to another pool (PR [#9699](https://github.com/vatesfr/xen-orchestra/pull/9699))

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

- @vates/async-each patch
- @vates/generator-toolbox patch
- @vates/http-server-plus major
- @vates/nbd-client minor
- @vates/node-vsphere-soap patch
- @vates/task minor
- @vates/types minor
- @xen-orchestra/async-map patch
- @xen-orchestra/backups minor
- @xen-orchestra/backups-cli patch
- @xen-orchestra/cron patch
- @xen-orchestra/disk-cli major
- @xen-orchestra/disk-transform patch
- @xen-orchestra/fs minor
- @xen-orchestra/immutable-backups major
- @xen-orchestra/log patch
- @xen-orchestra/mcp minor
- @xen-orchestra/mixin patch
- @xen-orchestra/mixins minor
- @xen-orchestra/proxy minor
- @xen-orchestra/qcow2 minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/template patch
- @xen-orchestra/upload-ova patch
- @xen-orchestra/vmware-explorer minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi patch
- complex-matcher patch
- vhd-cli patch
- vhd-lib minor
- xapi-explore-sr patch
- xen-api patch
- xo-cli patch
- xo-collection patch
- xo-common patch
- xo-lib patch
- xo-remote-parser patch
- xo-server minor
- xo-server-backup-reports patch
- xo-server-load-balancer patch
- xo-server-netbox minor
- xo-server-openmetrics minor
- xo-server-sdn-controller patch
- xo-server-usage-report patch
- xo-vmdk-to-vhd patch
- xo-web minor

<!--packages-end-->
