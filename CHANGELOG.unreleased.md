> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

**XO 6**:
  - [Dashboard] Cards are displayed as soon as they are ready (PR [#8695](https://github.com/vatesfr/xen-orchestra/pull/8695))
  - [Tab/Network] Updated side panel in tab network behavior for mobile view (PR [#8688](https://github.com/vatesfr/xen-orchestra/pull/8688)

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
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi minor
- vhd-lib minor
- xo-acl-resolver patch
- xo-server minor
- xo-web minor

<!--packages-end-->
