> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Plugin/load-balancer] Added an option in the plugin configuration to balance CPU usage on hosts before it reaches too high values (performance plan only) (PR [#7698](https://github.com/vatesfr/xen-orchestra/pull/7698))
- [V2V] Select template before import (PR [#7566](https://github.com/vatesfr/xen-orchestra/pull/7566))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup & Replication] Fix job stalling when failing to find a base VM
- [REST API] Host logs are in tar+gzip format, the path is now `/host/:uuid/logs.tgz` [#7703](https://github.com/vatesfr/xen-orchestra/issues/7703)
- [Plugin/perf-alert] Reduce the number of queries to the hosts [#7692](https://github.com/vatesfr/xen-orchestra/issues/7692)

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

- @vates/node-vsphere-soap minor
- @xen-orchestra/backups patch
- @xen-orchestra/vmware-explorer minor
- @xen-orchestra/web-core patch
- xo-server patch
- xo-server-load-balancer minor
- xo-server-perf-alert patch
- xo-web patch

<!--packages-end-->
