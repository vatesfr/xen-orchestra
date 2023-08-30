> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Backups] Ability to set the NBD mode per backup job in the UI instead of globally in the config file (PR [#6995](https://github.com/vatesfr/xen-orchestra/pull/6995))
- [Netbox] Better handle cases where the IP addresses reported by XAPI are malformed (PR [#6989](https://github.com/vatesfr/xen-orchestra/pull/6989))
- [Netbox] Fallback to other VIF's IPs when first VIF doesn't have an IP [#6978](https://github.com/vatesfr/xen-orchestra/issues/6978) (PR [#6989](https://github.com/vatesfr/xen-orchestra/pull/6989))
- [Jobs] Jobs are ordered by their name in the _Scheduling_ form [Forum#64825](https://xcp-ng.org/forum/post/64825)

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [REST API] `limit` parameter now applies at the end of the `backups/logs` and `restore/logs` collections, i.e. it selects the last entries [Forum#64880](https://xcp-ng.org/forum/post/64880)

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

- @xen-orchestra/backups minor
- @xen-orchestra/xapi minor
- xo-server patch
- xo-server-netbox minor
- xo-web minor

<!--packages-end-->
