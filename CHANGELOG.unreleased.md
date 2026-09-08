> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [XO6/Vm] Add the VM name to VM related actions that open a modal (PR [#10310](https://github.com/vatesfr/xen-orchestra/pull/10310))
- [XO6] Allow changing which PIF a host uses for its management interface, without deleting and recreating the network config (PR [#10110](https://github.com/vatesfr/xen-orchestra/pull/10110))
- [XO6/SR] Add dedicated Storage Repository page hosts sidepanel (PR [#10140](https://github.com/vatesfr/xen-orchestra/pull/10140))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Web-core] Fix "console offline" illustration sparks color (PR [#10309](https://github.com/vatesfr/xen-orchestra/pull/10309))
- [Web-core] Fix 404 illustration color (PR [#10325](https://github.com/vatesfr/xen-orchestra/pull/10325))
- [Backup-archive] No longer create a `cache.json.gz` file on immutable/S3 remote during cleanup, which could not be deleted afterwards and stayed billed forever (PR [#10243](https://github.com/vatesfr/xen-orchestra/pull/10243))

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

- @xen-orchestra/backup-archive patch
- @xen-orchestra/backups patch
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor

<!--packages-end-->
