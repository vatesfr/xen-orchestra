> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Health] Show duplicated MAC addresses with their VIFs / VMs / networks [#5448](https://github.com/vatesfr/xen-orchestra/issues/5448) (PR [#5468](https://github.com/vatesfr/xen-orchestra/pull/5468))
- [Web hooks] Possibility to wait a response from the server before continuing [#4948](https://github.com/vatesfr/xen-orchestra/issues/4948) (PR [#5420](https://github.com/vatesfr/xen-orchestra/pull/5420))
- [XOA/update] Add a link to the channel's changelog (PR [#5494](https://github.com/vatesfr/xen-orchestra/pull/5494))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM/network] Change VIF's locking mode automatically to `locked` when adding allowed IPs (PR [#5472](https://github.com/vatesfr/xen-orchestra/pull/5472))
- [Backup Reports] Don't hide errors during plugin test [#5486](https://github.com/vatesfr/xen-orchestra/issues/5486) (PR [#5491](https://github.com/vatesfr/xen-orchestra/pull/5491))
- [Backup reports] Fix malformed sent email in case of multiple VMs (PR [#5479](https://github.com/vatesfr/xen-orchestra/pull/5479))

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

- xo-server-backup-reports patch
- xo-server minor
- xo-web minor
- xo-server-web-hooks minor
