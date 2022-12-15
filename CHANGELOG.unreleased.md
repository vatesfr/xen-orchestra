> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Snapshot] Use the new [`ignore_vdis` feature](https://github.com/xapi-project/xen-api/pull/4563) of XCP-ng/XenServer 8.3

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Nagios] Fix reporting, broken in 5.77.2

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

- @xen-orchestra/xapi minor
- xo-server patch

<!--packages-end-->
