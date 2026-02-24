> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

[Search Engine] Implement first version of the Query Builder on Pools, Hosts, VMs, networks and Storage tables (PR [#9488](https://github.com/vatesfr/xen-orchestra/pull/9488))
- **XO 5:**
  - [Network] Ability to switch management PIF (PRs [#9369](https://github.com/vatesfr/xen-orchestra/pull/9369) [#9510](https://github.com/vatesfr/xen-orchestra/pull/9510))
  - [Licenses] Display bundle name next to license name (PR [#9512](https://github.com/vatesfr/xen-orchestra/pull/9512))
  - [V2V] Remember connection settings in the browser (PR [#9490](https://github.com/vatesfr/xen-orchestra/pull/9490))

- [V2V] Automatically take a snapshot if a running VM doesn't have any (PR [#9471](https://github.com/vatesfr/xen-orchestra/pull/9471))
- [Storage] Add possibility to create VDI in qcow2 format if size > 2TB - 8KB (PR [#9493](https://github.com/vatesfr/xen-orchestra/pull/9493))
- [Backups] Improve VHD dist handling an rework disk merge (delta backups) (PR [#9300](https://github.com/vatesfr/xen-orchestra/pull/9300))
- [REST API] Added POST `/pbds/{id}/actions/plug` and `/pbds/{id}/actions/unplug` rest routes (PR [#9477](https://github.com/vatesfr/xen-orchestra/pull/9477))
- [Backup] Implement Distributed storage for Backups, Mirror Backups and Replications(PR [#9433](https://github.com/vatesfr/xen-orchestra/pull/9433))
- [REST API] Added POST `/srs/{id}/actions/scan` rest routes (PR [#9514](https://github.com/vatesfr/xen-orchestra/pull/9514))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [HUB Recipe] A bug in the Pyrgos recipe requires to remove the DHCP option of the recipe form (PR [#9454](https://github.com/vatesfr/xen-orchestra/pull/9454))
- [OpenMetrics] Fix ECONNREFUSED on IPv6-only systems by binding to `localhost` instead of `127.0.0.1` (PR [#9489](https://github.com/vatesfr/xen-orchestra/pull/9489))
- [REST API] Exclude removable and ISO storage from top 5 SRs usage (PR [#9495](https://github.com/vatesfr/xen-orchestra/pull/9495))
- [xo-server-sdn-controller] traffic rules robustness (PR [#9442](https://github.com/vatesfr/xen-orchestra/pull/9442))

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

- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- complex-matcher minor
- xo-web minor

<!--packages-end-->
