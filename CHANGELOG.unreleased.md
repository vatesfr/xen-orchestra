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

- [Plugins/Perf-alert] Fixing plugin configuration error happening while editing config [Forum#9658](https://xcp-ng.org/forum/post/90573) (PR [#8561](https://github.com/vatesfr/xen-orchestra/pull/8561))
- [Plugins/Perf-alert] Prevent non-running VMs and hosts to be monitored in specific cases [Forum#10802](https://xcp-ng.org/forum/topic/10802/performance-alerts-fail-when-turning-on-all-running-hosts-all-running-vm-s-etc) (PR [#8561](https://github.com/vatesfr/xen-orchestra/pull/8561))

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

- xo-server-perf-alert patch

<!--packages-end-->
