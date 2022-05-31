> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- Created SRs will now have auto-scan enabled similarly to what XenCenter does (PR [#6246](https://github.com/vatesfr/xen-orchestra/pull/6246))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [load-balancer] Fix density mode failing to shutdown hosts (PR [#6253](https://github.com/vatesfr/xen-orchestra/pull/6253))
- [Health] Make "Too many snapshots" table sortable by number of snapshots

### Packages to release

> When modifying a package, add it here with its release type.
>
> The format is the following: - `$packageName` `$releaseType`
>
> Where `$releaseType` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility

<!--packages-start-->

- @xen-orchestra/xapi minor
- xo-server minor
- xo-web patch

<!--packages-end-->
