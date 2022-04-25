> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM export] Feat export to `ova` format (PR [#6006](https://github.com/vatesfr/xen-orchestra/pull/6006))
- [Backup] Add *Restore Health Check*: ensure a backup is viable by doing an automatic test restore (requires guest tools in the VM) [#6148](https://github.com/vatesfr/xen-orchestra/pull/6148)

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM/Host Console] Fix support of older versions of XCP-ng/XS, please not that HTTP proxies are note supported in that case [#6191](https://github.com/vatesfr/xen-orchestra/pull/6191)
- Fix HTTP proxy support to connect to pools (introduced in XO 5.69.0) [#6204](https://github.com/vatesfr/xen-orchestra/pull/6204)

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

- @vates/cached-dns.lookup major
- @vates/event-listeners-manager major
- xen-api patch
- xo-vmdk-to-vhd minor
- @xen-orchestra/proxy patch
- xo-server minor
- xo-web minor
