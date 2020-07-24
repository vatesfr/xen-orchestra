> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- Log the `Invalid XML-RPC message` error as an unexpected response (PR [#5138](https://github.com/vatesfr/xen-orchestra/pull/5138))
- [VM/network] Improve the network locking mode [#4713](https://github.com/vatesfr/xen-orchestra/issues/4713) (PR [#5170](https://github.com/vatesfr/xen-orchestra/pull/5170))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup/Restore] Fixes `an error has occurred` when all backups for a specific VM have been deleted (PR [#5156](https://github.com/vatesfr/xen-orchestra/pull/5156))

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

- xo-web patch
