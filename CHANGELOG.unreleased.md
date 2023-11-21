> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Netbox] Ability to synchronize XO users as Netbox tenants (PR [#7158](https://github.com/vatesfr/xen-orchestra/pull/7158))
- [VM/Console] Add a message to indicate that the console view has been [disabled](https://support.citrix.com/article/CTX217766/how-to-disable-the-console-for-the-vm-in-xencenter) for this VM [#6319](https://github.com/vatesfr/xen-orchestra/issues/6319) (PR [#7161](https://github.com/vatesfr/xen-orchestra/pull/7161))
- [Restore] Show source remote and restoration time on a restored VM (PR [#7186](https://github.com/vatesfr/xen-orchestra/pull/7186))
- [Backup/Import] Show disk import status during Incremental Replication or restoration of Incremental Backup (PR [#7171](https://github.com/vatesfr/xen-orchestra/pull/7171))
- [VM Creation] Added ISO option in new VM form when creating from template with a disk [#3464](https://github.com/vatesfr/xen-orchestra/issues/3464) (PR [#7166](https://github.com/vatesfr/xen-orchestra/pull/7166))
- [REST API] `tags` property can be updated (PR [#7196](https://github.com/vatesfr/xen-orchestra/pull/7196))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup/Restore] In case of snapshot with memory, create the suspend VDI on the correct SR instead of the default one
- [Import/ESXi] Handle `Cannot read properties of undefined (reading 'perDatastoreUsage')` error when importing VM without storage (PR [#7168](https://github.com/vatesfr/xen-orchestra/pull/7168))
- [Export/OVA] Handle export with resulting disk larger than 8.2GB (PR [#7183](https://github.com/vatesfr/xen-orchestra/pull/7183))
- [Self Service] Fix error displayed after adding a VM to a resource set (PR [#7144](https://github.com/vatesfr/xen-orchestra/pull/7144))

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

- @vates/nbd-client patch
- @xen-orchestra/backups minor
- @xen-orchestra/cr-seed-cli major
- @xen-orchestra/vmware-explorer patch
- xen-api major
- xo-cli minor
- xo-server minor
- xo-server-netbox minor
- xo-vmdk-to-vhd patch
- xo-web minor

<!--packages-end-->
