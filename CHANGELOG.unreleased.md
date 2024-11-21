> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Host/Network] When reconfiguring IP address on a PIF, no IPv6 reconfiguration if no IPv6 (PR [#8119](https://github.com/vatesfr/xen-orchestra/pull/8119))
- [Remotes] Fix NFS port (PR [#8085](https://github.com/vatesfr/xen-orchestra/pull/8085))
- [Plugins/Perf-alert] Fix unwritable SRs being monitored [Forum#9619](https://xcp-ng.org/forum/topic/9619/performance-alert-plugin-not-handling-removable-srs-correctly) (PR [#8113](https://github.com/vatesfr/xen-orchestra/pull/8113))
- [ISO SR/IPv6] Fix support of IPv6 ISO SR (PR [#8134](https://github.com/vatesfr/xen-orchestra/pull/8134))

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

- @xen-orchestra/fs patch
- @xen-orchestra/web patch
- @xen-orchestra/web-core minor
- xo-server minor
- xo-server-perf-alert minor
- xo-web patch

<!--packages-end-->
