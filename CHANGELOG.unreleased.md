> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM] Ability to protect VM from accidental shutdown [#4773](https://github.com/vatesfr/xen-orchestra/issues/4773)
- [[Audit] Back up fingerprints](https://xen-orchestra.com/blog/xo-audit/) [#4844](https://github.com/vatesfr/xen-orchestra/issues/4844) (PR [#5077](https://github.com/vatesfr/xen-orchestra/pull/5077))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Proxy/deploy] Fix `no such proxy ok` error on a failure trial start (PR [#5196](https://github.com/vatesfr/xen-orchestra/pull/5196))

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
- xo-web minor
