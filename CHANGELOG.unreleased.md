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

- [OpenMetrics] Add 9 missing host RRD metrics: `hostload`, `memory_reclaimed`, `memory_reclaimed_max`, `running_vcpus`, `pif_aggr_rx`, `pif_aggr_tx`, `iops_total`, `io_throughput_total`, `latency` per SR (PR [#9696](https://github.com/vatesfr/xen-orchestra/pull/9696))

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [QA Test] Add end-to-end QA test suite `@xen-orchestra/qa-test` for VM, backup and export testing (PR [#9626](https://github.com/vatesfr/xen-orchestra/pull/9626))
- [i18n] Add Portuguese and Slovak and update Chinese (Simplified Han script), Czech, Dutch, German, Italian, Norwegian, Persian, Portuguese (Brasil), Russian, Spanish, Swedish and Ukrainian translations (PR [#9554](https://github.com/vatesfr/xen-orchestra/pull/9554))
- [Treeview/Pool/Host] Add button to download bugtools (PR [#9419](https://github.com/vatesfr/xen-orchestra/pull/9419))
- [REST API] Add `POST rest/v0/plugins/sdn-controller/vifs/:id/rules` and `DELETE rest/v0/plugins/sdn-controller/vifs/:id/rules` traffic rule endpoints for VIFs ([#9418](https://github.com/vatesfr/xen-orchestra/pull/9418))

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

- @xen-orchestra/backups minor
- @xen-orchestra/rest-api patch
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server patch
- xo-server-netbox patch
- xo-server-sdn-controller minor

<!--packages-end-->
