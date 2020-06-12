> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM/Network] Show IP addresses in front of their VIFs [#4882](https://github.com/vatesfr/xen-orchestra/issues/4882) (PR [#5003](https://github.com/vatesfr/xen-orchestra/pull/5003))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM/Creation] Fix `insufficient space` which could happened when moving and resizing disks (PR [#5044](https://github.com/vatesfr/xen-orchestra/pull/5044))
- [VM/General] Fix displayed IPV6 instead of IPV4 in case of an old version of XenServer (PR [#5036](https://github.com/vatesfr/xen-orchestra/pull/5036)))
- [Host/Load-balancer] Fix VM migration condition: free memory in the destination host must be greater or equal to used VM memory (PR [#5054](https://github.com/vatesfr/xen-orchestra/pull/5054))
- [Home] Broken "Import VM" link [#5055](https://github.com/vatesfr/xen-orchestra/issues/5055) (PR [#5056](https://github.com/vatesfr/xen-orchestra/pull/5056))
- [Home/SR] Fix inability to edit SRs' name [#5057](https://github.com/vatesfr/xen-orchestra/issues/5057) (PR [#5058](https://github.com/vatesfr/xen-orchestra/pull/5058))
- [Backup] Fix huge logs in case of Continuous Replication or Disaster Recovery errors (PR [#5069](https://github.com/vatesfr/xen-orchestra/pull/5069))
- [Notification] Fix same notification showing again as unread (PR [#5067](https://github.com/vatesfr/xen-orchestra/pull/5067))
- [SDN Controller] Fix broken private network creation when specifiyng a preferred center [#5076](https://github.com/vatesfr/xen-orchestra/issues/5076) (PR [#5079](https://github.com/vatesfr/xen-orchestra/pull/5079)) (PR [#5080](https://github.com/vatesfr/xen-orchestra/pull/5080))

### Packages to release

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.
>
> The format is the following: - `$packageName` `$version`
>
> Where `$version` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> In case of conflict, the highest (lowest in previous list) `$version` wins.

- xo-server-load-balancer patch
- xo-server patch
- xo-web minor
