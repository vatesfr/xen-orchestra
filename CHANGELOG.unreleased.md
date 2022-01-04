> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- Limit number of concurrent VM migrations per pool to `3` [#6065](https://github.com/vatesfr/xen-orchestra/issues/6065) (PR [#6076](https://github.com/vatesfr/xen-orchestra/pull/6076))
  Can be changed in `xo-server`'s configuration file: `xapiOptions.vmMigrationConcurrency`

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Import/Disk] Fix `JSON.parse` and `createReadableSparseStream is not a function` errors [#6068](https://github.com/vatesfr/xen-orchestra/issues/6068)

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

- vhd-lib major
- xo-vmdk-to-vhd patch
- xo-server patch
- xo-web patch
