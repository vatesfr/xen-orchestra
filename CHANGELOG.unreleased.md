> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **XO 6:**

  - [Pool/system] Display pool information in pool/system tab (PR [#8581](https://github.com/vatesfr/xen-orchestra/pull/8581))
  - [Host/Dashboard] Update RAM usage components wordings and update CPU provisioning logic (PR [#8648](https://github.com/vatesfr/xen-orchestra/pull/8648))
  - [Site/Dashboard] Update BackupIssues and VtsBackupState components to display data in table (PR [#8674](https://github.com/vatesfr/xen-orchestra/pull/8674)
  - [VM/Dashboard] Display VM information in dashboard tab (PR [#8585](https://github.com/vatesfr/xen-orchestra/pull/8585)
  - [Site] Add "Site" level in treeview and add "Site" header and tabs (PR [#8694](https://github.com/vatesfr/xen-orchestra/pull/8694))

- **Migrated REST API endpoints**

  - `/rest/v0/pools/<pool-id>/actions/emergency_shutdown` (PR [#8653](https://github.com/vatesfr/xen-orchestra/pull/8653))
  - `/rest/v0/pools/<pool-id>/actions/rolling_reboot` (PR [#8653](https://github.com/vatesfr/xen-orchestra/pull/8653))
  - `/rest/v0/pools/<pool-id>/actions/rolling_update` (PR [#8653](https://github.com/vatesfr/xen-orchestra/pull/8653))
  - `/rest/v0/dashboard` (PR [#8580](https://github.com/vatesfr/xen-orchestra/pull/8580))

- [VM] Ability to hide XSA-468 warnings for specific VMs by adding `HIDE_XSA468` tag (PR [#8665](https://github.com/vatesfr/xen-orchestra/pull/8665))
- [OTP] Change wording from "Password" to "OTP code" when enabling OTP (PR [#8666](https://github.com/vatesfr/xen-orchestra/pull/8666))
- [Backups] Fix `HANDLE_INVALID(SR)` when replicated to multiples tagret (PR [#8668](https://github.com/vatesfr/xen-orchestra/pull/8668))
- [REST API] Ability to create a network `POST /rest/v0/pools/<pool-id/actions/createNetwork` (PR [#8671](https://github.com/vatesfr/xen-orchestra/pull/8671))
- [REST API] Ability to delete a network `DELETE /rest/v0/networks/<network-id>` (PR [#8671](https://github.com/vatesfr/xen-orchestra/pull/8671))
- [REST API] Expose `GET /rest/v0/pcis` and `GET /rest/v0/pcis/<pci-id>` (PR [#8686](https://github.com/vatesfr/xen-orchestra/pull/8686))
- [REST API] expose `GET /rest/v0/pgpus` and `GET /rest/v0/pgpus/<pgpu-id>` (PR [#8684](https://github.com/vatesfr/xen-orchestra/pull/8684))
- [REST API] expose `DELETE /rest/v0/servers/<server-id>` (PR [#8710](https://github.com/vatesfr/xen-orchestra/pull/8710))
- [Backup reports] Make content of backup reports independant of 'Report when' parameter (PR [#8670](https://github.com/vatesfr/xen-orchestra/pull/8670))
- [i18n] Ability to switch language to ones newly present in XO6, but not available for XO5 (Thanks [p-bo](https://github.com/p-bo)!) (PR [#8711](https://github.com/vatesfr/xen-orchestra/pull/8711))

- **Azure Blob Storage**:
  - [Backups]: Implemented Azure Blob Storage for backups, Integrating with both the Azurite emulator and Azure (PR [#8415](https://github.com/vatesfr/xen-orchestra/pull/8415))

### Bug fixes

- [REST API] Ability to use `ndjson` query parameter also on migrated collections (PR [#8628](https://github.com/vatesfr/xen-orchestra/pull/8628))
- [Backup] Fix EBADF on mirror backup chaining (PR [#8706](https://github.com/vatesfr/xen-orchestra/pull/8706))
- [Site/Dashboard] Fix issue with stacked bar on site dashboard when prefix 'B' is added (PR [#8721](https://github.com/vatesfr/xen-orchestra/pull/8721))

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM/Advanced] Fix CPU mask list in VM (PR [#8661](https://github.com/vatesfr/xen-orchestra/pull/8661))
- [Server] Fix server deletion now fully disconnects and deletes (PR [#8710](https://github.com/vatesfr/xen-orchestra/pull/8710))

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
- @xen-orchestra/backups patch
- @xen-orchestra/backups-cli minor
- @xen-orchestra/fs minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- vhd-lib minor
- xen-api patch
- xo-remote-parser minor
- xo-server minor
- xo-server-auth-oidc patch
- xo-server-backup-reports minor
- xo-server-perf-alert patch
- xo-web minor

<!--packages-end-->
