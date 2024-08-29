> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [OTP] Key can be copied to clipboard because some clients cannot use the QR code
- [Plugin/perf-alert] Add a toggle to exclude selected items (PR [#7911](https://github.com/vatesfr/xen-orchestra/pull/7911))
- [Backup/Mirror] Filter the VM that must be mirrored [#7748](https://github.com/vatesfr/xen-orchestra/issues/7748) (PR [#7941](https://github.com/vatesfr/xen-orchestra/pull/7941))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [New/SR] Fix 'an error as occured' when creating a new SR (PR [#7931](https://github.com/vatesfr/xen-orchestra/pull/7931))
- [VM/General] Fix 'an error as occured' in general tab view for non-admin users (PR [#7928](https://github.com/vatesfr/xen-orchestra/pull/7928))
- [Plugin/perf-alert] Fix 'NaN' values in CPU usage (PR [#7925](https://github.com/vatesfr/xen-orchestra/pull/7925))

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
- @xen-orchestra/web-core patch
- xo-server minor
- xo-server-perf-alert minor
- xo-web minor

<!--packages-end-->
