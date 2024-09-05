> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Pool/Networks] Networks can be sorted by VLANs
- [Pool/Networks] Networks can be filtered by VLANs, e.g. `VLAN:10`
- [REST API] Add `pifs` and `vm-controllers` collections
- [REST API/Dashboard] Add name and type of the backup in the backup job issues (PR [#7958](https://github.com/vatesfr/xen-orchestra/pull/7958))
- [Perf-alert] Display warning if no guest tools are detected while monitoring VM memory (PR [#7886](https://github.com/vatesfr/xen-orchestra/pull/7886))

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

- xo-server minor
- xo-server-perf-alert minor
- xo-web minor

<!--packages-end-->
