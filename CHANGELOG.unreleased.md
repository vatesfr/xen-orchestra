> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”


- [REST API] Expose `GET /rest/v0/ping` (PR [#9129](https://github.com/vatesfr/xen-orchestra/pull/9129))
- [Backups] Add `Merge backups synchronously` to mirror backup (PR [#9118](https://github.com/vatesfr/xen-orchestra/pull/9118))
- [V2V] support import of disk bigger than 2TB toward qcow enabled SR (PR [#9148](https://github.com/vatesfr/xen-orchestra/pull/9148))
- [Host/General] Display additional hardware data for Lenovo server (PR [#9149](https://github.com/vatesfr/xen-orchestra/pull/9149))
- [REST API] Expose `GET /rest/v0/gui-routes` (PR [#9133](https://github.com/vatesfr/xen-orchestra/pull/9133))
- [Netbox] Support Netbox v4.4.x (PR [#9153](https://github.com/vatesfr/xen-orchestra/pull/9153))
- [REST API] Add boot firmware for VM creation (PR [#9147](https://github.com/vatesfr/xen-orchestra/pull/9147))

- **XO 6:**
  - [User Menu] Added new links in the user menu and customized it (PR [#9126](https://github.com/vatesfr/xen-orchestra/pull/9126))
  - [Treeview] Move search loader from input to Treeview (PR [#9142](https://github.com/vatesfr/xen-orchestra/pull/9142))
  - [Site/Backups] Add backed-up VMs view (PR [#9018](https://github.com/vatesfr/xen-orchestra/pull/9018))
  - [Site/Backups] Add backup job configuration view (PR [#9008](https://github.com/vatesfr/xen-orchestra/pull/9008))
  - [Site/Backups] Add backup targets view (PR [#9048](https://github.com/vatesfr/xen-orchestra/pull/9048))

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
- @xen-orchestra/qcow2 minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi minor
- vhd-lib patch
- xo-server minor
- xo-server-netbox minor
- xo-web minor

<!--packages-end-->
