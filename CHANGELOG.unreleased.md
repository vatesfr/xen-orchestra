> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Plugins/load balancer] Add configurable VM migration cooldown to prevent oscillation (default 30min) (PR [#9388](https://github.com/vatesfr/xen-orchestra/pull/9388))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backups/s3] Fallback in rmtree for providers which do not support DeleteObjectsCommand (PR [#9450](https://github.com/vatesfr/xen-orchestra/pull/9450))
- Fix build issue [#9455](https://github.com/vatesfr/xen-orchestra/issues/9455) (PR [#9482](https://github.com/vatesfr/xen-orchestra/pull/9482))

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

- @xen-orchestra/fs patch
- @xen-orchestra/web patch
- xo-server-load-balancer minor

<!--packages-end-->
