> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Host/Advanced] Add the field `IOMMU` if it is defined (PR [#5294](https://github.com/vatesfr/xen-orchestra/pull/5294))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [XOA/Notifications] Don't show expired notifications (PR [#5304](https://github.com/vatesfr/xen-orchestra/pull/5304))
- [Backup/S3] Fix secret key edit form [#5233](https://github.com/vatesfr/xen-orchestra/issues/5233) (PR[#5305](https://github.com/vatesfr/xen-orchestra/pull/5305))
- [New network] Remove the possibility of creating a network on a bond member interface (PR [#5262](https://github.com/vatesfr/xen-orchestra/pull/5262))
- [User] Fix custom filters not showing up when selecting a default filter for templates (PR [#5298](https://github.com/vatesfr/xen-orchestra/pull/5298))
- [Home] Hide backup filter for non-admin users [#5285](https://github.com/vatesfr/xen-orchestra/issues/5285) (PR [#5264](https://github.com/vatesfr/xen-orchestra/pull/5264))

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

- xo-server minor
- xo-web minor
