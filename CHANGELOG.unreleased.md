> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Task] Display age and estimated duration (PR [#5530](https://github.com/vatesfr/xen-orchestra/pull/5530))
- [Proxy] Ask for a confirmation before upgrading a proxy with running backups (PR [#5533](https://github.com/vatesfr/xen-orchestra/pull/5533))
- [Backup/restore] Allow backup restore to any licence even if XOA isn't registered (PR [#5547](https://github.com/vatesfr/xen-orchestra/pull/5547))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM/Snapshot export] Fix `Error: no available place in queue` on canceling an export via browser then starting a new one when the concurrency threshold is reached [#5535](https://github.com/vatesfr/xen-orchestra/issues/5535) (PR [#5538](https://github.com/vatesfr/xen-orchestra/pull/5538))
- [Servers] Hide pool's objects if its master is unreachable [#5475](https://github.com/vatesfr/xen-orchestra/issues/5475) (PR [#5526](https://github.com/vatesfr/xen-orchestra/pull/5526))
- [Host] Restart toolstack: fix `ECONNREFUSED` error (PR [#5553](https://github.com/vatesfr/xen-orchestra/pull/5553))

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

- xen-api patch
- xo-common minor
- xo-server minor
- xo-web minor
