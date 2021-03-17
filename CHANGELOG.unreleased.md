> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Pool] Fix `an error has occurred` when using the "Disconnect" button from the pool page [#5669](https://github.com/vatesfr/xen-orchestra/issues/5669) (PR [#5671](https://github.com/vatesfr/xen-orchestra/pull/5671))
- [Configuration] Automatically connect enabled servers after import [#5660](https://github.com/vatesfr/xen-orchestra/issues/5660) (PR [#5672](https://github.com/vatesfr/xen-orchestra/pull/5672))
- Work-around some `ECONNRESET` errors when connecting to XEN-API (PR [#5674](https://github.com/vatesfr/xen-orchestra/pull/5674))
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

- xen-api minor
- xo-server minor
- xo-web minor
