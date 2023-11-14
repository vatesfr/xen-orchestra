> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Netbox] Ability to synchronize XO users as Netbox tenants (PR [#7158](https://github.com/vatesfr/xen-orchestra/pull/7158))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup/Restore] In case of snapshot with memory, create the suspend VDI on the correct SR instead of the default one
- [Import/ESXi] Handle `Cannot read properties of undefined (reading 'perDatastoreUsage')` error when importing VM without storage (PR [#7168](https://github.com/vatesfr/xen-orchestra/pull/7168))

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
- @xen-orchestra/vmware-explorer patch
- xo-server-netbox minor
- xo-web patch

<!--packages-end-->
