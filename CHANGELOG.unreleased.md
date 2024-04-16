> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Backups] Make health check timeout configurable: property `healthCheckTimeout` of config file (PR [#7561](https://github.com/vatesfr/xen-orchestra/pull/7561))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Import/VMWare] Fix `Cannot read properties of undefined (reading 'match')`

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

- @vates/task minor
- @xen-orchestra/backups minor
- @xen-orchestra/proxy minor
- @xen-orchestra/vmware-explorer patch
- xo-server patch

<!--packages-end-->
