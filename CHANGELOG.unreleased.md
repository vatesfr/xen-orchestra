> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [V2V] With `stopSource`, the source VM is shut down cleanly through the VMware tools, and only powered off when its tools do not run or it does not shut down within 10 minutes (PR [#10637](https://github.com/vatesfr/xen-orchestra/pull/10637))
- [Plugins] Add plugin list and detail pages in admin menu, to configure, load, unload and test the plugins (PR [#10593](https://github.com/vatesfr/xen-orchestra/pull/10593))
- [XO6] Display dates and times as `YYYY-MM-DD HH:mm:ss` in all UI views (PR [#10547](https://github.com/vatesfr/xen-orchestra/pull/10547))
- [XO6/VM] Warn that deleting a VM also deletes its snapshots and disks (PR [#10554](https://github.com/vatesfr/xen-orchestra/pull/10554))
- [Backup jobs] Add backup job list in admin menu (PR [#10630](https://github.com/vatesfr/xen-orchestra/pull/10630))
- [Backup jobs] Add backup job side panel in admin menu (PR [#10631](https://github.com/vatesfr/xen-orchestra/pull/10631))
- [Backup jobs] The backup links of the site dashboard and the VM Backups tab now use the backup jobs of the admin menu (PR [#10636](https://github.com/vatesfr/xen-orchestra/pull/10636))
- [Pool/Dashboard] In the CPU and RAM usage cards, show a "No data to calculate" message when there is no host or VM to rank (PR [#10386](https://github.com/vatesfr/xen-orchestra/pull/10386))
- [REST API/V2V] `POST /rest/v0/v2v/inventory` reads the inventory of a vCenter or ESXi (datacenters, clusters, hosts, datastores, networks and VMs with their disks and network cards), and `POST /rest/v0/pools/:id/actions/import_vms_from_vmware` imports a list of VMs into the pool, with an SR per disk and a network per network card, resuming partial imports with a delta. Restricted to administrators, credentials are never stored (PR [#10597](https://github.com/vatesfr/xen-orchestra/pull/10597))
- [XO6/V2V] Add the _Migrate VMs_ wizard in Administration › V2V, with its first step: connect to a VMware source, new or remembered in the browser (PR [#10623](https://github.com/vatesfr/xen-orchestra/pull/10623))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- Fix `cannot read properties of undefined (reading code)` (PR [#10668](https://github.com/vatesfr/xen-orchestra/pull/10668))
- [SDN Controller] A Global Private Network that fails to be set up, or whose preferred star-center host was removed, no longer blocks the other private networks (PR [#10629](https://github.com/vatesfr/xen-orchestra/pull/10629))
- [V2V] Fix the migration of a running VM whose change tracking (CBT) is not enabled failing on ESXi 7 and 8 once the source is stopped: the change tracking is now enabled on the source VM, so that only the used blocks are read, and only the changed ones for the delta. A partial import made before can't be resumed and is transferred again (PR [#10637](https://github.com/vatesfr/xen-orchestra/pull/10637))
- [V2V] Keep the MAC address of a network card set by hand on VMware, instead of generating a new one, and no longer create a network interface for a card which is not present (PR [#10597](https://github.com/vatesfr/xen-orchestra/pull/10597))

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

- @vates/types minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/vmware-explorer minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server patch
- xo-server-sdn-controller patch
- xo-server minor

<!--packages-end-->
