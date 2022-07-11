> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [SR] When SR is in maintenance, add "Maintenance mode" badge next to its name (PR [#6313](https://github.com/vatesfr/xen-orchestra/pull/6313))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Tasks] Fix tasks not displayed when running CR backup job [Forum#6038](https://xcp-ng.org/forum/topic/6038/not-seeing-tasks-any-more-as-admin) (PR [#6315](https://github.com/vatesfr/xen-orchestra/pull/6315))
- [Backup] Fix failing merge multiple VHDs at once (PR [#6317](https://github.com/vatesfr/xen-orchestra/pull/6317))
- [VM/Console] Fix _Connect with SSH/RDP_ when address is IPv6
- [Audit] Ignore side-effects free API methods `xoa.check`, `xoa.clearCheckCache` and `xoa.getHVSupportedVersions`

### Packages to release

> When modifying a package, add it here with its release type.
>
> The format is the following: - `$packageName` `$releaseType`
>
> Where `$releaseType` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> Keep this list alphabetically ordered to avoid merge conflicts

<!--packages-start-->

- @vates/async-each major
- vhd-lib patch
- xo-server-audit minor
- xo-web minor

<!--packages-end-->
