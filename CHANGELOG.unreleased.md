> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- Ignore leading and trailing spaces when editing VM/Pools/Hosts/SRs names and descriptions (PR [#8115](https://github.com/vatesfr/xen-orchestra/pull/8115))
- [VM/Advanced] in Nested virtualization section, add warning tooltip and link to documentation (PR [#8107](https://github.com/vatesfr/xen-orchestra/pull/8107))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup/CBT] use asynchronous method to list changed block, reducing the number of fall back to full backup
- [Backups] handle incremental doing base (full) each time (PR [#8126](https://github.com/vatesfr/xen-orchestra/pull/8126))
- [Backup/Health Check] Better detection of guest tools even when they do not properly report their version number

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

- @xen-orchestra/web patch
- @xen-orchestra/web-core minor
- xo-web minor

<!--packages-end-->
