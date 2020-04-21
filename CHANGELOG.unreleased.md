> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Snapshot] Confirmation message before creating a snapshot with memory [#4914](https://github.com/vatesfr/xen-orchestra/issues/4914) (PR [#4917](https://github.com/vatesfr/xen-orchestra/pull/4917))
- [Internationalization] Italian translation (Thanks [@infodavide](https://github.com/infodavide)!) [#4908](https://github.com/vatesfr/xen-orchestra/issues/4908) (PRs [#4931](https://github.com/vatesfr/xen-orchestra/pull/4931) [#4932](https://github.com/vatesfr/xen-orchestra/pull/4932))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup] Fix TLS error (`unsupported protocol`) when XenServer <= 6.5 is used as target
- [Patches] Hide patch `CH81` (upgrade patch) from the pool patches (PR [#4942](https://github.com/vatesfr/xen-orchestra/pull/4942))

### Released packages

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

- xo-server-audit patch
- xen-api patch
- xo-server patch
