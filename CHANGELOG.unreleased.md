> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **Migrated REST API endpoints**:

  - `POST /rest/v0/users` (PR [#8697](https://github.com/vatesfr/xen-orchestra/pull/8697))
  - `DELETE /rest/v0/users/<user-id>` (PR [#8698](https://github.com/vatesfr/xen-orchestra/pull/8698))
  - `DELETE /rest/v0/groups/<group-id>` (PR [#8704](https://github.com/vatesfr/xen-orchestra/pull/8704))
  - `GET /rest/v0/hosts/<host-id>/alarms` (PR [#8800](http://github.com/vatesfr/xen-orchestra/pull/8800))
  - `GET /rest/v0/networks/<network-id>/alarms` (PR [#8801](https://github.com/vatesfr/xen-orchestra/pull/8801))

- **XO 6:**

  - [SearchBar] Updated query search bar to work in responsive (PR [#8761](https://github.com/vatesfr/xen-orchestra/pull/8761))
  - [Sidebar] Updated sidebar to auto close when the screen is small (PR [#8760](https://github.com/vatesfr/xen-orchestra/pull/8760))

- [REST API] Expose `/rest/v0/pools/<pool-id>/dashboard` (PR [#8768](https://github.com/vatesfr/xen-orchestra/pull/8768))
- [ACL] Confirmation message when deleting an ACL rule (PR [#8774](https://github.com/vatesfr/xen-orchestra/pull/8774))
- [REST API] Ability to create a VM with `name_description`, `memory` and `autoPoweron` (PR [#8798](https://github.com/vatesfr/xen-orchestra/pull/8798))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- **XO 6:**

  - [Host/VM/Dashboard] Fix display error due to inversion of upload and download (PR [#8793](https://github.com/vatesfr/xen-orchestra/pull/8793))

- [Health] Fix labels and modals mentioning VMs instead of snapshots when deleting snapshots (PR [#8775](https://github.com/vatesfr/xen-orchestra/pull/8775))
- [REST API] Alarm time is now in milliseconds and body value is now in percentage (PR [#8802](https://github.com/vatesfr/xen-orchestra/pull/8802))

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
- @xen-orchestra/mixins patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server patch
- xo-web minor

<!--packages-end-->
