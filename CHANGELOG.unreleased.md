> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- Fix `incorrect state` error when trying to delete a disabled server [#11128](https://xcp-ng.org/forum/topic/11128/can-t-delete-disconnected-server-in-settings) (PR [#8854](https://github.com/vatesfr/xen-orchestra/pull/8854))
**XO 6**:

    - [Pool,Host/Dashboard] CPU provisioning considers all VMs instead of just running VMs (PR [#8858](https://github.com/vatesfr/xen-orchestra/pull/8858))

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

- @xen-orchestra/rest-api patch
- @xen-orchestra/web patch
- @xen-orchestra/web-core patch
- xo-server patch

<!--packages-end-->
