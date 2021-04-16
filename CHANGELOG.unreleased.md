> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Backup] Run backup jobs on different system processes (PR [#5660](https://github.com/vatesfr/xen-orchestra/pull/5660))
- [XOA] Notify user when proxies need to be upgraded (PR [#5717](https://github.com/vatesfr/xen-orchestra/pull/5717))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Proxy] _Force upgrade_ no longer fails on broken proxy
- [Proxy] _Redeploy_ now works when the bound VM is missing
- [VM template] Fix confirmation modal doesn't appear on deleting a default template (PR [#5644](https://github.com/vatesfr/xen-orchestra/pull/5644))

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

- @xen-orchestra/disposable patch
- xo-server-transport-email minor
- @xen-orchestra/fs minor
- @xen-orchestra/xapi minor
- @xen-orchestra/backups minor
- @xen-orchestra/backups-cli minor
- xo-server minor
- xo-web patch
