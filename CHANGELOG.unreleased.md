> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [New XOSTOR] Display a warning when replication count is higher than number of hosts with disks (PR [#7625](https://github.com/vatesfr/xen-orchestra/pull/7625))
- [XOSTOR] Ability to copy VDI UUID in the resources table (PR [#7629](https://github.com/vatesfr/xen-orchestra/pull/7629))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Pool] Fix `Headers Timeout Error` when installing patches on XCP-ng
- [Pool/Advanced] Only show current pool's SRs in default SR selector (PR [#7626](https://github.com/vatesfr/xen-orchestra/pull/7626))
- [SR/XOSTOR] Fix `an error has occured` in the Resource List (PR [#7630](https://github.com/vatesfr/xen-orchestra/pull/7630))
- [XOSTOR] Don't require host licenses to run XOSTOR (PR [#7628](https://github.com/vatesfr/xen-orchestra/pull/7628))

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

- xo-server patch
- xo-web minor

<!--packages-end-->
