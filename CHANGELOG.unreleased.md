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

- [Self Service] Always allow administrators to bypass quotas (PR [#7855](https://github.com/vatesfr/xen-orchestra/pull/7855))
- [V2V] Fix `Can't import delta of a running VM without its parent VHD` error during warm migration (PR [#7856](https://github.com/vatesfr/xen-orchestra/pull/7856))
- [Backups] Fix a race condition leading to `VDI_INCOMPATIBLE_TYPE` error when using _Purge snapshot data_ (PR [#7828](https://github.com/vatesfr/xen-orchestra/pull/7828))
- [Backups] NBD backups now respected _default backup network_ settings (PR [#7836](https://github.com/vatesfr/xen-orchestra/pull/7836))
- [Backups] NBD backups now ignore unreachable host and retry on reachable ones(PR [#7836](https://github.com/vatesfr/xen-orchestra/pull/7836))

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

- @vates/nbd-client minor
- @xen-orchestra/backups patch
- @xen-orchestra/xapi patch
- xen-api minor
- xo-server minor

<!--packages-end-->
