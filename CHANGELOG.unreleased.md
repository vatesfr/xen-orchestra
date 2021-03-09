> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VIF] To edit MAC address on a VIF, user has to be operator of the VIF and administrator of its network [#4700](https://github.com/vatesfr/xen-orchestra/issues/4700) (PR [#5631](https://github.com/vatesfr/xen-orchestra/pull/5631))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Editable number] When you are trying to edit a number and it's failing, display an error (PR [#5634](https://github.com/vatesfr/xen-orchestra/pull/5634))
- [VM/Network] Fix `an error has occurred` when trying to sort the table by the network's name (PR [#5639](https://github.com/vatesfr/xen-orchestra/pull/5639))
- [Backup] Try harder to avoid orphan VDI snapshots, especially with iSCSI SRs [#4926](https://github.com/vatesfr/xen-orchestra/issues/4926)

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

- xen-api minor
- @xen-orchestra/xapi patch
- @xen-orchestra/backups minor
- xo-server minor
- xo-web patch
