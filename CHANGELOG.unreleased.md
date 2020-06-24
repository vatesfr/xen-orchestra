> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM/Network] Show IP addresses in front of their VIFs [#4882](https://github.com/vatesfr/xen-orchestra/issues/4882) (PR [#5003](https://github.com/vatesfr/xen-orchestra/pull/5003))
- [VM] Ability to protect VM from accidental deletion [#4773](https://github.com/vatesfr/xen-orchestra/issues/4773)
- [Plugin] Disable test plugin action when the plugin is not loaded (PR [#5038](https://github.com/vatesfr/xen-orchestra/pull/5038))
- [Home/Template] Ability to copy/clone VM templates [#4734](https://github.com/vatesfr/xen-orchestra/issues/4734) (PR [#5006](https://github.com/vatesfr/xen-orchestra/pull/5006))
- [VM/bulk copy] Add fast clone option (PR [#5006](https://github.com/vatesfr/xen-orchestra/pull/5006))
- [VM] Differentiate PV drivers detection from management agent detection [#4783](https://github.com/vatesfr/xen-orchestra/issues/4783) (PR [#5007](https://github.com/vatesfr/xen-orchestra/pull/5007))
- [Home/VM] Homogenize the list of backed up VMs with the normal list (PR [#5046](https://github.com/vatesfr/xen-orchestra/pull/5046)
- [SR/Disks] Add tooltip for disabled migration (PR [#4884](https://github.com/vatesfr/xen-orchestra/pull/4884))
- [SR/Advanced, SR selector] Show thin/thick provisioning [#2208](https://github.com/vatesfr/xen-orchestra/issues/2208) (PR [#5081](https://github.com/vatesfr/xen-orchestra/pull/5081))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM/Creation] Fix `insufficient space` which could happened when moving and resizing disks (PR [#5044](https://github.com/vatesfr/xen-orchestra/pull/5044))
- [VM/General] Fix displayed IPV6 instead of IPV4 in case of an old version of XenServer (PR [#5036](https://github.com/vatesfr/xen-orchestra/pull/5036)))
- [Host/Load-balancer] Fix VM migration condition: free memory in the destination host must be greater or equal to used VM memory (PR [#5054](https://github.com/vatesfr/xen-orchestra/pull/5054))
- [Home] Broken "Import VM" link [#5055](https://github.com/vatesfr/xen-orchestra/issues/5055) (PR [#5056](https://github.com/vatesfr/xen-orchestra/pull/5056))
- [Home/SR] Fix inability to edit SRs' name [#5057](https://github.com/vatesfr/xen-orchestra/issues/5057) (PR [#5058](https://github.com/vatesfr/xen-orchestra/pull/5058))
- [Backup] Fix huge logs in case of Continuous Replication or Disaster Recovery errors (PR [#5069](https://github.com/vatesfr/xen-orchestra/pull/5069))
- [Notification] Fix same notification showing again as unread (PR [#5067](https://github.com/vatesfr/xen-orchestra/pull/5067))
- [SDN Controller] Fix broken private network creation when specifiyng a preferred center [#5076](https://github.com/vatesfr/xen-orchestra/issues/5076) (PRs [#5079](https://github.com/vatesfr/xen-orchestra/pull/5079) & [#5080](https://github.com/vatesfr/xen-orchestra/pull/5080))
- [Import/VMDK] Import of VMDK disks has been broken since 5.45.0 (PR [#5087](https://github.com/vatesfr/xen-orchestra/pull/5087))
- [Remotes] Fix not displayed used/total disk (PR [#5093](https://github.com/vatesfr/xen-orchestra/pull/5093))

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

- xo-server-audit minor
- xo-server-sdn-controller patch
- xo-server-load-balancer patch
- xo-server minor
- xo-web minor
