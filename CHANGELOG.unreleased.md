> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- Log the `Invalid XML-RPC message` error as an unexpected response (PR [#5138](https://github.com/vatesfr/xen-orchestra/pull/5138))
- [VM/disks] By default, sort disks by their device position instead of their name [#5163](https://github.com/vatesfr/xen-orchestra/issues/5163) (PR [#5165](https://github.com/vatesfr/xen-orchestra/pull/5165))
- [Schedule/edit] Ability to enable/disable an ordinary job's schedule [#5026](https://github.com/vatesfr/xen-orchestra/issues/5026) (PR [#5111](https://github.com/vatesfr/xen-orchestra/pull/5111))
- [New schedule] Enable 'Enable immediately after creation' by default (PR [#5111](https://github.com/vatesfr/xen-orchestra/pull/5111))
- [Self Service] Ability to globally ignore snapshots in resource set quotas (PR [#5164](https://github.com/vatesfr/xen-orchestra/pull/5164))
- [Home/VM, host] Ability to filter by power state (PR [#5118](https://github.com/vatesfr/xen-orchestra/pull/5118))
- [Import/OVA] Allow for VMDK disks inside .ova files to be gzipped (PR [#5085](https://github.com/vatesfr/xen-orchestra/pull/5085))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup/Restore] Fixes `an error has occurred` when all backups for a specific VM have been deleted (PR [#5156](https://github.com/vatesfr/xen-orchestra/pull/5156))
- [OVA Import] fix import of Red Hat generated .ova files (PR [#5159](https://github.com/vatesfr/xen-orchestra/pull/5159))
- [Proxy/deploy] Ability to set HTTP proxy configuration (PR [#5145](https://github.com/vatesfr/xen-orchestra/pull/5145))
- [Fast clone] Fix bug where the name of the created VM would be "undefined_clone" (PR [#5173](https://github.com/vatesfr/xen-orchestra/pull/5173))

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

- xo-vmdk-to-vhd minor
- xo-server minor
- xo-web minor
