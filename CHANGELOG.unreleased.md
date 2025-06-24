> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Backup] Support qcow2 disks > 2TB for backup and replication (PR [#8668](https://github.com/vatesfr/xen-orchestra/pull/8668))
- [Export] Support qcow2 disks exports (PR [#8668](https://github.com/vatesfr/xen-orchestra/pull/8668))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

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

- @xen-orchestra/backups minor
- @xen-orchestra/disk-transform minor
- @xen-orchestra/qcow2 major
- @xen-orchestra/xapi minor
- vhd-lib minor
- xo-acl-resolver patch
- xo-server minor
- xo-web minor
<!--packages-end-->
