> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [REST API] Add `POST rest/v0/plugins/sdn-controller/networks/:id/rules` and `DELETE rest/v0/plugins/sdn-controller/networks/:id/rules` traffic rule endpoints for networks ([#9418](https://github.com/vatesfr/xen-orchestra/pull/9418))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [xo-server] Fix VM-template still visible after deletion (PR [#9760](https://github.com/vatesfr/xen-orchestra/pull/9760))

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
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- xo-server minor
- xo-server-sdn-controller minor
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
- xo-server-sdn-controller minor
- xo-server-usage-report patch
- xo-vmdk-to-vhd patch
- xo-web minor
- xo-server-sdn-controller minor

<!--packages-end-->
