> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Netbox] Check Netbox version before attempting to synchronize (PR [#7735](https://github.com/vatesfr/xen-orchestra/pull/7735))
- [Netbox] Support Netbox 4 (Thanks [@ChrisMcNichol](https://github.com/ChrisMcNichol)!) (PR [#7735](https://github.com/vatesfr/xen-orchestra/pull/7735))
- [Migration] Disable CBT when needed during a disk/VM migration (PR [#7756](https://github.com/vatesfr/xen-orchestra/pull/7756))
- [Disks] Show and edit the use of CBT (Change Block Tracking) in disks (PR [#7732](https://github.com/vatesfr/xen-orchestra/pull/7732))
- [Create/SR] Display SCSI ID and LUN during HBA storage creation (PR [#7742](https://github.com/vatesfr/xen-orchestra/pull/7742))
- [Backups] Implements Change Block Tracking (CBT) (PR [#7750](https://github.com/vatesfr/xen-orchestra/pull/7750))
- [REST API] _Rolling Pool Reboot_ action available `pools/<uuid>/actions/rolling_reboot` (PR [#7761](https://github.com/vatesfr/xen-orchestra/pull/7761))
- [XOSTOR] Possibility to directly access an XOSTOR SR from the view that lists all XOSTOR SRs (PR [#7764](https://github.com/vatesfr/xen-orchestra/pull/7764))
- [VM/Advanced] Display an accurate secure boot status and allow user to propagate certificates from pool to VM (PR [#7751](https://github.com/vatesfr/xen-orchestra/pull/7751))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [V2V] Fix VSAN import not used when importing from VSAN ([PR #7717](https://github.com/vatesfr/xen-orchestra/pull/7717))
- [Backups] Fix EEXIST error after an interrupted mirror backup job ([PR #7694](https://github.com/vatesfr/xen-orchestra/pull/7694))
- [Netbox] Fix "Netbox error could not be retrieved" when an error occurs on Netbox's side (PR [#7758](https://github.com/vatesfr/xen-orchestra/pull/7758))
- [XOSTOR] Fix the _Approximate SR Capacity_ sometimes showing as 0 if not all hosts had disks (PR [#7765](https://github.com/vatesfr/xen-orchestra/pull/7765))
- [VM/Advanced] Ignore `Firmware not supported` warning for UEFI boot firmware [Forum#8878](https://xcp-ng.org/forum/topic/8878/uefi-firmware-not-supported) (PR [#7767](https://github.com/vatesfr/xen-orchestra/pull/7767))
- [LDAP] Fix users being removed from groups when synchronizing groups (PR [#7759](https://github.com/vatesfr/xen-orchestra/pull/7759))
- [Host/Advanced] Change _Advanced Live Telemetry_ link to point to Netdata's page of the specific host [#7702](https://github.com/vatesfr/xen-orchestra/issues/7702)

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

- @vates/fuse-vhd patch
- @vates/task minor
- @xen-orchestra/backups minor
- @xen-orchestra/proxy-cli patch
- @xen-orchestra/vmware-explorer patch
- @xen-orchestra/web patch
- @xen-orchestra/web-core patch
- @xen-orchestra/xapi minor
- vhd-lib minor
- xo-server minor
- xo-server-auth-ldap patch
- xo-server-backup-reports major
- xo-server-netbox minor
- xo-server-transport-email minor
- xo-web minor

<!--packages-end-->
