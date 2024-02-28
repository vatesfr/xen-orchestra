> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Pool/Network] Ability to edit MTU [#7039](https://github.com/vatesfr/xen-orchestra/issues/7039) (PR [#7393](https://github.com/vatesfr/xen-orchestra/pull/7393))
- [Backup] Ability to set a number of retries for VM backup failures [#2139](https://github.com/vatesfr/xen-orchestra/issues/2139) (PR [#7308](https://github.com/vatesfr/xen-orchestra/pull/7308))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [API/backupNg.getLogs] Fix `after` parameter handling when `limit` parameter is not provided
- [New/SR] Fix create button never appearing for `smb iso` SR [#7355](https://github.com/vatesfr/xen-orchestra/issues/7355), [Forum#8417](https://xcp-ng.org/forum/topic/8417) (PR [#7405](https://github.com/vatesfr/xen-orchestra/pull/7405))
- [Pool/Network] Don't allow MTU values that are too small to work (<68) (PR [#7393](https://github.com/vatesfr/xen-orchestra/pull/7393)
- [Import/VMWare] Correctly handle IDE disks
- [Backups/Full] Fix `Cannot read properties of undefined (reading 'healthCheckVmsWithTags')` (PR [#7396](https://github.com/vatesfr/xen-orchestra/pull/7396))
- [Backups/Healthcheck] Don't run health checks after empty mirror backups (PR [#7396](https://github.com/vatesfr/xen-orchestra/pull/7396))
- [SR/SMB] Fix `SR_BACKEND_FAILURE_111` during SMB storage creation [#7356](https://github.com/vatesfr/xen-orchestra/issues/7356) (PR [#7407](https://github.com/vatesfr/xen-orchestra/pull/7407))
- [Editable text] Make sure the text is still clickable/editable if the content is a single white space [Forum#8466](https://xcp-ng.org/forum/topic/8466) (PR [#7411](https://github.com/vatesfr/xen-orchestra/pull/7411))

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

- @xen-orchestra/xapi minor
- @xen-orchestra/backups minor
- @xen-orchestra/vmware-explorer patch
- xo-server minor
- xo-web minor

<!--packages-end-->
