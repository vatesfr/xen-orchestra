> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Netbox] Don't delete VMs that have been created manually in XO-synced cluster [Forum#7639](https://xcp-ng.org/forum/topic/7639) (PR [#7008](https://github.com/vatesfr/xen-orchestra/pull/7008))
- [Home/Hosts, Pools] Display product brand and version (PR [#7027](https://github.com/vatesfr/xen-orchestra/pull/7027))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

### Packages to release

> When modifying a package, add it here with its release type.
>
> The format is the following: `- $packageName $releaseType`
>
> Where `$releaseType` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> Keep this list alphabetically ordered to avoid merge conflicts

<!--packages-start-->

- xo-server-netbox minor
- xo-web minor

<!--packages-end-->
