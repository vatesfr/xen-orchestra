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
  - `GET /rest/v0/pifs/<pif-id>/alarms` (PR [#8802](http://github.com/vatesfr/xen-orchestra/pull/8802))
  - `GET /rest/v0/vdis/<vdi-id>/alarms` (PR [#8824](http://github.com/vatesfr/xen-orchestra/pull/8824))
  - `GET /rest/v0/vdi-snapshots/<vdi-snapshot-id>/alarms` (PR [#8823](http://github.com/vatesfr/xen-orchestra/pull/8823))
  - `GET /rest/v0/vm-templates/<vm-template-id>/alarms` (PR [#8828](http://github.com/vatesfr/xen-orchestra/pull/8828))
  - `GET /rest/v0/hosts/<host-id>/logs.tgz` (PR [#8830](https://github.com/vatesfr/xen-orchestra/pull/8830))

- **XO 6:**

  - [SearchBar] Updated query search bar to work in responsive (PR [#8761](https://github.com/vatesfr/xen-orchestra/pull/8761))
  - [Sidebar] Updated sidebar to auto close when the screen is small (PR [#8760](https://github.com/vatesfr/xen-orchestra/pull/8760))

- [REST API] Expose `/rest/v0/pools/<pool-id>/dashboard` (PR [#8768](https://github.com/vatesfr/xen-orchestra/pull/8768))
- [ACL] Confirmation message when deleting an ACL rule (PR [#8774](https://github.com/vatesfr/xen-orchestra/pull/8774))
- [REST API] Ability to create a VM with `name_description`, `memory` and `autoPoweron` (PR [#8798](https://github.com/vatesfr/xen-orchestra/pull/8798))
- [xo-server] Display build commit at start-up and with `xo-server --help`
- [xo-server] Warn if build is out of sync with local git repository
  - [Pool/system] Display pool information in pool/system tab (PR [#8581](https://github.com/vatesfr/xen-orchestra/pull/8581))
  - [Host/Dashboard] Update RAM usage components wordings and update CPU provisioning logic (PR [#8648](https://github.com/vatesfr/xen-orchestra/pull/8648))
  - [Site/Dashboard] Update BackupIssues and VtsBackupState components to display data in table (PR [#8674](https://github.com/vatesfr/xen-orchestra/pull/8674)

- **Migrated REST API endpoints**

  - `/rest/v0/pools/<pool-id>/actions/emergency_shutdown` (PR [#8653](https://github.com/vatesfr/xen-orchestra/pull/8653))
  - `/rest/v0/pools/<pool-id>/actions/rolling_reboot` (PR [#8653](https://github.com/vatesfr/xen-orchestra/pull/8653))
  - `/rest/v0/pools/<pool-id>/actions/rolling_update` (PR [#8653](https://github.com/vatesfr/xen-orchestra/pull/8653))
  - `/rest/v0/dashboard` (PR [#8580](https://github.com/vatesfr/xen-orchestra/pull/8580))
  - POST `/rest/v0/groups` (PR [#8703](https://github.com/vatesfr/xen-orchestra/pull/8703))

- [VM] Ability to hide XSA-468 warnings for specific VMs by adding `HIDE_XSA468` tag (PR [#8665](https://github.com/vatesfr/xen-orchestra/pull/8665))
- [OTP] Change wording from "Password" to "OTP code" when enabling OTP (PR [#8666](https://github.com/vatesfr/xen-orchestra/pull/8666))
- [Backups] Fix `HANDLE_INVALID(SR)` when replicated to multiples tagret (PR [#8668](https://github.com/vatesfr/xen-orchestra/pull/8668))
- [REST API] Ability to create a network `POST /rest/v0/pools/<pool-id/actions/createNetwork` (PR [#8671](https://github.com/vatesfr/xen-orchestra/pull/8671))
- [REST API] Ability to delete a network `DELETE /rest/v0/networks/<network-id>` (PR [#8671](https://github.com/vatesfr/xen-orchestra/pull/8671))
- [REST API] Expose `GET /rest/v0/pcis` and `GET /rest/v0/pcis/<pci-id>` (PR [#8686](https://github.com/vatesfr/xen-orchestra/pull/8686))

- **Azure Blob Storage**:
  - [Backups]: Implemented Azure Blob Storage for backups, Integrating with both the Azurite emulator and Azure (PR [#8415](https://github.com/vatesfr/xen-orchestra/pull/8415))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup] Fix full backup retry failing with EEXIST error (PR [#8776](https://github.com/vatesfr/xen-orchestra/pull/8776))
- [Backup] Force snapshot if one of its VDIs has a NOBAK tag (PR [#8820](https://github.com/vatesfr/xen-orchestra/pull/8820))

- **XO 6:**

  - [Host/VM/Dashboard] Fix display error due to inversion of upload and download (PR [#8793](https://github.com/vatesfr/xen-orchestra/pull/8793))

- [Health] Fix labels and modals mentioning VMs instead of snapshots when deleting snapshots (PR [#8775](https://github.com/vatesfr/xen-orchestra/pull/8775))
- [REST API] Alarm time is now in milliseconds and body value is now in percentage (PR [#8802](https://github.com/vatesfr/xen-orchestra/pull/8802))
- [REST API/XOA/Dashboard] Fix some type issues. Some object may return `{error: true}` instead of `undefined` on error.`s3` and `other` object may be undefined (if no S3 or other backup repositories detected) (PR [#8806](https://github.com/vatesfr/xen-orchestra/pull/8806))
- [REST API] An unauthenticated request no longer creates a failed XO task `XO user authentication` ([#8821](https://github.com/vatesfr/xen-orchestra/pull/8821))

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

- @vates/generator-toolbox patch
- @vates/types minor
- @xen-orchestra/backups minor
- @xen-orchestra/fs patch
- @xen-orchestra/mixins patch
- @xen-orchestra/openflow patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi patch
- xo-server minor
- xo-web minor

<!--packages-end-->
