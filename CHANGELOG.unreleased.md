> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Backup/Restore file] Implement File level restore for s3 and encrypted backups (PR [#6409](https://github.com/vatesfr/xen-orchestra/pull/6409))

- [Backup] Improve listing speed by updating caches instead of regenerating them on backup creation/deletion (PR [#6411](https://github.com/vatesfr/xen-orchestra/pull/6411))
- [Backup] Add `mergeBlockConcurrency` and `writeBlockConcurrency` to allow tuning of backup resources consumptions (PR [#6416](https://github.com/vatesfr/xen-orchestra/pull/6416))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Plugin/auth-saml] Certificate input support multiline (PR [#6403](https://github.com/vatesfr/xen-orchestra/pull/6403))
- [Backup] Launch Health Check after a full backup (PR [#6401](https://github.com/vatesfr/xen-orchestra/pull/6401))
- [Backup] Fix `Lock file is already being held` error when deleting a VM backup while the VM is currently being backed up

### Packages to release

> When modifying a package, add it here with its release type.
>
> The format is the following: - `$packageName` `$releaseType`
>
> Where `$releaseType` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> Keep this list alphabetically ordered to avoid merge conflicts

<!--packages-start-->

- @vates/fuse-vhd major
- @xen-orchestra/backups minor
- vhd-lib minor
- xo-server-auth-saml patch
- xo-server minor
- xo-web minor

<!--packages-end-->
