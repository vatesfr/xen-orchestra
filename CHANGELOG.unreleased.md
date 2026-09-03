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

- [Backup/Proxy] No longer fail a backup job after one minute when the proxy is slow to start it
- [Backup] Report the underlying cause of network errors in job logs instead of a bare `fetch failed`
- [Proxy] Fix `MaxListenersExceededWarning` when several updater state checks overlap (PR [#XXXX](https://github.com/vatesfr/xen-orchestra/pull/XXXX))

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
- @xen-orchestra/proxy patch

<!--packages-end-->
