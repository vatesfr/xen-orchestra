> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **XO 6**:
  - [Console]: Displays a loader when the console is loading (PR [#8226](https://github.com/vatesfr/xen-orchestra/pull/8226))
  - [i18n] Add Spanish translation (contribution made by [@DSJ2](https://github.com/DSJ2)) (PR [#8220](https://github.com/vatesfr/xen-orchestra/pull/8220))
  - [Console]: Add Ctrl+Alt+Del functionality to console (PR [#8239](https://github.com/vatesfr/xen-orchestra/pull/8239))
  - [UI]: Use user language set in XO 5 to set the language in XO 6 (PR [#8232](https://github.com/vatesfr/xen-orchestra/pull/8232))
  - [Console]: Adding a border when console is focused (PR [#8235](https://github.com/vatesfr/xen-orchestra/pull/8235))
  - [Console]: Add fullscreen functionality for console (PR [#8238](https://github.com/vatesfr/xen-orchestra/pull/8238))
  - [Backup] New [ChaCha20-Poly1305](https://en.wikipedia.org/wiki/ChaCha20-Poly1305) encryption for remotes, allow encrypted files larger than 64GB (PR [#8237](https://github.com/vatesfr/xen-orchestra/pull/8237))
  - [Backup] Don't checksum encrypted full backup because encryption already handles it (PR [#8270](https://github.com/vatesfr/xen-orchestra/pull/8270))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- Fix SR tags not being listed in tag selectors (PR [#8251](https://github.com/vatesfr/xen-orchestra/pull/8251))
- [Plugins/usage-report] Prevent the report creation from failing over and over when previous stats file is empty or incorrect (PR [#8240](https://github.com/vatesfr/xen-orchestra/pull/8240))
- [Backups/Logs] Display mirror backup transfer size (PR [#8224](https://github.com/vatesfr/xen-orchestra/pull/8224))
- [Settings/Remotes] Only allow using encryption when using data block storage to prevent errors during backups (PR [#8244](https://github.com/vatesfr/xen-orchestra/pull/8244))
- Fix _Rolling Pool Update_ and _Install Patches_ for XenServer >= 8.4 [Forum#9550](https://xcp-ng.org/forum/topic/9550/xenserver-8-patching/27?_=1736774010376) (PR [#8241](https://github.com/vatesfr/xen-orchestra/pull/8241))
- [New/VM] Fix premature destruction of the cloudConfig VDI when using the option _destroyCloudConfigVdiAfterBoot_ [#8219](https://github.com/vatesfr/xen-orchestra/issues/8219) (PR [#8247](https://github.com/vatesfr/xen-orchestra/pull/8247))
- [V2V] Improve compatiblity whith VSphere handling multiple vSAN storages (PR [#8243](https://github.com/vatesfr/xen-orchestra/pull/8243))
- [Backup/LTR] Fix computation for the last week of the year (PR [#8269](https://github.com/vatesfr/xen-orchestra/pull/8269))
- [New/Storage] Correctly display error if storage detection failed for HBA or ZFS (PR [#8250](https://github.com/vatesfr/xen-orchestra/pull/8250))

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
- @xen-orchestra/fs minor
- @xen-orchestra/vmware-explorer minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi minor
- xo-server minor
- xo-server-audit patch
- xo-server-usage-report patch
- xo-web minor

<!--packages-end-->
