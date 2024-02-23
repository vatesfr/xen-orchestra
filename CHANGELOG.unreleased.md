> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- Disable search engine indexing via a `robots.txt`
- [Stats] Support format used by XAPI 23.31
- [REST API] Export host [SMT](https://en.wikipedia.org/wiki/Simultaneous_multithreading) status at `/hosts/:id/smt` [Forum#71374](https://xcp-ng.org/forum/post/71374)
- [Home & REST API] `$container` field of an halted VM now points to a host if a VDI is on a local storage [Forum#71769](https://xcp-ng.org/forum/post/71769)
- [Size Input] Ability to select two new units in the dropdown (`TiB`, `PiB`) (PR [#7382](https://github.com/vatesfr/xen-orchestra/pull/7382))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Settings/XO Config] Sort backups from newest to oldest
- [Plugins/audit] Don't log `tag.getAllConfigured` calls
- [Remotes] Correctly clear error when the remote is tested with success
- [Import/VMWare] Fix importing last snapshot (PR [#7370](https://github.com/vatesfr/xen-orchestra/pull/7370))
- [Host/Reboot] Fix false positive warning when restarting an host after updates (PR [#7366](https://github.com/vatesfr/xen-orchestra/pull/7366))
- [New/VM] Respect _Fast clone_ setting broken since 5.91.0 (PR [#7388](https://github.com/vatesfr/xen-orchestra/issues/7388))
- [Backup] Remove incorrect _unused VHD_ warning because the situation is normal (PR [#7406](https://github.com/vatesfr/xen-orchestra/issues/7406))

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

- @xen-orchestra/backups patch
- @xen-orchestra/fs patch
- @xen-orchestra/xapi patch
- vhd-lib patch
- xo-server minor
- xo-server-audit patch
- xo-web minor

<!--packages-end-->
