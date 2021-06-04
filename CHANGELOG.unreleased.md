> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [OVA import] improve OVA import error reporting (PR [#5797](https://github.com/vatesfr/xen-orchestra/pull/5797))
- [Backup] Distinguish error messages between cancelation and interrupted HTTP connection

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [IPs] Handle space-delimited IP address format provided by outdated guest tools [5801](https://github.com/vatesfr/xen-orchestra/issues/5801) (PR [5805](https://github.com/vatesfr/xen-orchestra/pull/5805))

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
- @xen-orchestra/xapi patch
- @xen-orchestra/backups patch
- @xen-orchestra/proxy patch
- xo-server patch
- xo-web patch
