> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [XO6] After deleting a VM or VIF, users are now redirected to the parent list instead of seeing a 404 page (PR [#9984](https://github.com/vatesfr/xen-orchestra/pull/9984))
- [Web stack] Updated side panels (PR [#9836](https://github.com/vatesfr/xen-orchestra/pull/9836))
- [Plugin/LDAP] Add failover URIs (PR [#9961](https://github.com/vatesfr/xen-orchestra/pull/9961))
- [V2V] Add `esxi.importDisk` API endpoint to import a single ESXi disk into an SR as a standalone VDI ( [PR#10024] (https://github.com/vatesfr/xen-orchestra/pull/10024))
- [XO5/V2V] Show if the transfer will be a full or a delta one when doing 2 steps V2V transfer (PR [#10014](https://github.com/vatesfr/xen-orchestra/pull/10014))
- [V2V] Create a CDROM on destination if source has one (PR [#10014](https://github.com/vatesfr/xen-orchestra/pull/10014))
- [XO6/VDI] Add the possibility to export VDI from detail screen of a VM (PR [#9983](https://github.com/vatesfr/xen-orchestra/pull/9983))
- [SidePanels] Add and use new `VtsCardObjectTitle` component to display object title and ID in side panels (PR [#9755](https://github.com/vatesfr/xen-orchestra/pull/9755))
- [i18n] Update Chinese (Simplified Han script), Czech, Dutch, German, Korean, Slovak, Spanish and Swedish translations (PR [#9998](https://github.com/vatesfr/xen-orchestra/pull/9998))

- [REST API] Expose `GET /rest/v0/backup-archives/:id/disks` (PR [#9464](https://github.com/vatesfr/xen-orchestra/pull/9941))
- [REST API] Expose `GET /rest/v0/backup-archives/:id/disks/:diskId/partitions` (PR [#9941](https://github.com/vatesfr/xen-orchestra/pull/9941))
### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Site/Dashboard] Rename `no job` to `no active job` in the `VMs protection` card (PR [#10013](https://github.com/vatesfr/xen-orchestra/pull/10013))
- [Backups] Fix failed VM not appearing in the logs (PR [#10021](https://github.com/vatesfr/xen-orchestra/pull/10021))
- [V2V] Fix migration when template memory_static_min is it's less than actual vm memory (PR [#10014](https://github.com/vatesfr/xen-orchestra/pull/10014))
- [XO6/Tree/Web-core] Infrastructure tree is now streamed and rendered as a single virtualized list, fix some performance issues on medium and big infrastructures (PR [#9986](https://github.com/vatesfr/xen-orchestra/pull/9986))
- [xo-server] Fix memory leak on failed http query (XS update for example) (PR [#10026](https://github.com/vatesfr/xen-orchestra/pull/10026))

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
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server minor
- xo-server-netbox patch
- xo-web minor

<!--packages-end-->
