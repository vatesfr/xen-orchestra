> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Web hooks] Possibility to wait a response from the server before continuing [#4948](https://github.com/vatesfr/xen-orchestra/issues/4948) (PR [#5420](https://github.com/vatesfr/xen-orchestra/pull/5420))
- [XOA/update] Add a link to the channel's changelog (PR [#5494](https://github.com/vatesfr/xen-orchestra/pull/5494))
- Assign custom date-time fields on pools, hosts, SRs, and VMs in advanced tab [#4730](https://github.com/vatesfr/xen-orchestra/issues/4730) (PR [#5473](https://github.com/vatesfr/xen-orchestra/pull/5473))
- [Health] Show duplicated MAC addresses with their VIFs, VMs and networks [#5448](https://github.com/vatesfr/xen-orchestra/issues/5448) (PR [#5468](https://github.com/vatesfr/xen-orchestra/pull/5468))
- [Host/stats] Show interfaces' names in graph "Network throughput" instead of PIFs' indices (PR [#5483](https://github.com/vatesfr/xen-orchestra/pull/5483))
- [Pool/advanced] Ability to define default migration network [#3788](https://github.com/vatesfr/xen-orchestra/issues/3788#issuecomment-743207834) (PR [#5465](https://github.com/vatesfr/xen-orchestra/pull/5465))
- [Metadata backups] Ability to link a backup to a proxy (PR [#4206](https://github.com/vatesfr/xen-orchestra/pull/4206))
- [Proxy] Support metadata backups (PRs [#5499](https://github.com/vatesfr/xen-orchestra/pull/5499) [#5517](https://github.com/vatesfr/xen-orchestra/pull/5517) [#5519](https://github.com/vatesfr/xen-orchestra/pull/5519))
- [VM/console] Add button to connect to the VM via the local RDP client [#5495](https://github.com/vatesfr/xen-orchestra/issues/5495) (PR [#5523](https://github.com/vatesfr/xen-orchestra/pull/5523))
- [VM] Ability to set guest secure boot (guest secure boot is available soon in XCP-ng) [#5502](https://github.com/vatesfr/xen-orchestra/issues/5502) (PR [#5527](https://github.com/vatesfr/xen-orchestra/pull/5527))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM/network] Change VIF's locking mode automatically to `locked` when adding allowed IPs (PR [#5472](https://github.com/vatesfr/xen-orchestra/pull/5472))
- [Backup Reports] Don't hide errors during plugin test [#5486](https://github.com/vatesfr/xen-orchestra/issues/5486) (PR [#5491](https://github.com/vatesfr/xen-orchestra/pull/5491))
- [Backup reports] Fix malformed sent email in case of multiple VMs (PR [#5479](https://github.com/vatesfr/xen-orchestra/pull/5479))
- [Restore/metadata] Ignore disabled remotes on listing backups (PR [#5504](https://github.com/vatesfr/xen-orchestra/pull/5504))
- [VM/network] Change VIF's locking mode automatically to `network_default` when changing network (PR [#5500](https://github.com/vatesfr/xen-orchestra/pull/5500))
- [Backup/S3] Fix `TimeoutError: Connection timed out after 120000ms` (PR [#5456](https://github.com/vatesfr/xen-orchestra/pull/5456))
- [New SR/reattach SR] Fix SR not being properly reattached to hosts [#4546](https://github.com/vatesfr/xen-orchestra/issues/4546) (PR [#5488](https://github.com/vatesfr/xen-orchestra/pull/5488))
- [Home/pool] Missing patches warning: fix 1 patch showing as missing in case of error [#4922](https://github.com/vatesfr/xen-orchestra/issues/4922)
- [Proxy/remote] Fix error not updated on remote test (PR [#5514](https://github.com/vatesfr/xen-orchestra/pull/5514))
- [Home/SR] Sort SR usage in % instead of bytes [#5463](https://github.com/vatesfr/xen-orchestra/issues/5463) (PR [#5513](https://github.com/vatesfr/xen-orchestra/pull/5513))
- [VM migration] Fix `SR_NOT_ATTACHED` error when migration network is selected (PR [#5516](https://github.com/vatesfr/xen-orchestra/pull/5516))

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

- @xen-orchestra/fs patch
- xo-server-backup-reports patch
- xo-server minor
- xo-web minor
- xo-server-web-hooks minor
