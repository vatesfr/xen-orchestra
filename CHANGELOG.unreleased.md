> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM Import] Make the `Description` field optional (PR [#5258](https://github.com/vatesfr/xen-orchestra/pull/5258))
- [New VM] Hide missing ISOs in selector [#5222](https://github.com/vatesfr/xen-orchestra/issues/5222)
- [Dashboard/Health] Show VMs that have too many snapshots [#5238](https://github.com/vatesfr/xen-orchestra/pull/5238)
- [Groups] Ability to delete multiple groups at once (PR [#5264](https://github.com/vatesfr/xen-orchestra/pull/5264))
- [Backup/logs] Log's tasks pagination [#4406](https://github.com/vatesfr/xen-orchestra/issues/4406) (PR [#5209](https://github.com/vatesfr/xen-orchestra/pull/5209))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Import VMDK] Fix `No position specified for vmdisk1` error (PR [#5255](https://github.com/vatesfr/xen-orchestra/pull/5255))
- [API] Fix `this.removeSubjectFromResourceSet is not a function` error on calling `resourceSet.removeSubject` via `xo-cli` [#5265](https://github.com/vatesfr/xen-orchestra/issues/5265) (PR [#5266](https://github.com/vatesfr/xen-orchestra/pull/5266))

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

- xo-vmdk-to-vhd patch
- xo-web minor
- xo-server patch
