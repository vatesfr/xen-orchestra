> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [REST API/SDN Controller] With the XAPI plugin, traffic rules can be given an OpenFlow `priority` in `add_traffic_rule` and `update_traffic_rule`: of the rules of a network matching a packet, the highest-priority one wins (PR [#10525](https://github.com/vatesfr/xen-orchestra/pull/10525))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Servers] Fix servers stuck in `Connecting` state when using an HTTPS proxy that support HTTP/2 ([Forum#12502](https://xcp-ng.org/forum/topic/12502/xoa-6.9-update)) (PR [#10507](https://github.com/vatesfr/xen-orchestra/pull/10507))
- [VM/System] Fix video RAM displayed in bytes instead of MiB (PR [#10486](https://github.com/vatesfr/xen-orchestra/pull/10486))
- [XO5/Hosts] Disable restart toolstack button for the hosts that belongs to a HA pools in the home page (PR [#10497](https://github.com/vatesfr/xen-orchestra/pull/10497))

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
- @xen-orchestra/web patch
- xen-api patch
- xo-server-sdn-controller minor
- xo-web patch

<!--packages-end-->
