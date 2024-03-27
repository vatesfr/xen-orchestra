> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VMWare/Migration] Make one pass for the cold base disk and snapshots (PR [#7487](https://github.com/vatesfr/xen-orchestra/pull/7487))
- [VMWare/Migration] Use NFS datastore from XO Remote to bypass VMFS6 lock (PR [#7487](https://github.com/vatesfr/xen-orchestra/pull/7487))
- [Remotes] S3 (Object storage) and remote encryption are production ready (PR [#7515](https://github.com/vatesfr/xen-orchestra/pull/7515))
- [Template] Attempting to delete a template protected against accidental deletion displays a confirmation modal (PR [#7493](https://github.com/vatesfr/xen-orchestra/pull/7493))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VMWare/Migration] Alignment of the end of delta on older ESXi (PR [#7487](https://github.com/vatesfr/xen-orchestra/pull/7487))
- [Backup] Fix `no object with uuid or opaqueref` when running a health check (PR [#7467](https://github.com/vatesfr/xen-orchestra/pull/7467))
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

- @xen-orchestra/backups patch
- @xen-orchestra/vmware-explorer minor
- vhd-lib patch
- xo-acl-resolver minor
- xo-server patch
- xo-web minor

<!--packages-end-->
