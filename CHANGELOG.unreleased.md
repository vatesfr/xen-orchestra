> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Add backup repository and storage repository information in the `/rest/v0/dashboard` endpoint (PR [#7882](https://github.com/vatesfr/xen-orchestra/pull/7882), [#7904](https://github.com/vatesfr/xen-orchestra/pull/7904))
- [SR/Disks] Show and edit the use of CBT (Change Block Tracking) [#7786](https://github.com/vatesfr/xen-orchestra/issues/7786) (PR [#7888](https://github.com/vatesfr/xen-orchestra/pull/7888))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Self] Remove unit in CPU usage total count (PR [#7894](https://github.com/vatesfr/xen-orchestra/pull/7894))
- [Home/SR] Fix _Shared/Not shared_ sort
- [Home/VM] When sorted by _Start time_, move VMs with no value at the end
- [Import/VM Ware] Shows only SRs and networks of the selected pool (PR [#7905](https://github.com/vatesfr/xen-orchestra/pull/7905))

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

- @xen-orchestra/proxy patch
- xo-server minor
- xo-web minor

<!--packages-end-->
