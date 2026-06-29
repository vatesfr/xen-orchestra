> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Site/Dashboard] Rename `no job` to `no active job` in the `VMs protection` card (PR [#10013](https://github.com/vatesfr/xen-orchestra/pull/10013))
- [Backups] Fix failed VM not appearing in the logs (PR [#10021](https://github.com/vatesfr/xen-orchestra/pull/10021))
- [VDI] Fix progress bar appearing half-filled when used space is at 100% [Forum#100200](https://xcp-ng.org/forum/post/100200) (PR [#10027](https://github.com/vatesfr/xen-orchestra/pull/10027))

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

<!--packages-end-->
