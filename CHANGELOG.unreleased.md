> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Backup] Run backup jobs on different system processes (PR [#5660](https://github.com/vatesfr/xen-orchestra/pull/5660))
- [VM] Display the full driver version in the general and advanced tab instead of `major.minor` [#5680](https://github.com/vatesfr/xen-orchestra/issues/5680) (PR [#5691](https://github.com/vatesfr/xen-orchestra/pull/5691))
- [Restore] Handle the possibility to generate new mac addresses (PR [#5697](https://github.com/vatesfr/xen-orchestra/pull/5697))

### Bug fixes

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

- @xen-orchestra/xapi minor
- @xen-orchestra/backups minor
- @xen-orchestra/backups-cli minor
- xo-server minor
- xo-web minor
