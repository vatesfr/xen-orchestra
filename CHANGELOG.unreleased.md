> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Backup] Merge multiple VHDs at once which will speed up the merging ĥase after reducing the retention of a backup job(PR [#6184](https://github.com/vatesfr/xen-orchestra/pull/6184))
- [Backup] Implement file cache for listing the backups of a VM (PR [#6220](https://github.com/vatesfr/xen-orchestra/pull/6220))
- [Backup] Add setting `backups.metadata.defaultSettings.unconditionalSnapshot` in `xo-server`'s configuration file to force a snapshot even when not required by the backup, this is useful to avoid locking the VM halted during the backup (PR [#6221](https://github.com/vatesfr/xen-orchestra/pull/6221))
- [XO Web] Add ability to configure a default filter for Storage [#6236](https://github.com/vatesfr/xen-orchestra/issues/6236) (PR [#6237](https://github.com/vatesfr/xen-orchestra/pull/6237))
- [Backup] VMs with USB Pass-through devices are now supported! The advanced _Offline Snapshot Mode_ setting must be enabled. For Full Backup or Disaster Recovery jobs, Rolling Snapshot needs to be anabled as well. (PR [#6239](https://github.com/vatesfr/xen-orchestra/pull/6239))
- [RPU/Host] If some backup jobs are running on the pool, ask for confirmation before starting an RPU, shutdown/rebooting a host or restarting a host's toolstack (PR [6232](https://github.com/vatesfr/xen-orchestra/pull/6232))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [S3] Fix S3 remote with empty directory not showing anything to restore (PR [#6218](https://github.com/vatesfr/xen-orchestra/pull/6218))
- [S3] remote fom did not save the `https` and `allow unatuhorized`during remote creation (PR [#6219](https://github.com/vatesfr/xen-orchestra/pull/6219))
- [VM/advanced] Fix various errors when adding ACLs [#6213](https://github.com/vatesfr/xen-orchestra/issues/6213) (PR [#6230](https://github.com/vatesfr/xen-orchestra/pull/6230))
- [Home/Self] Don't make VM's resource set name clickable for non admin users as they aren't allowed to view the Self Service page

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

<!--packages-start-->

- @xen-orchestra/self-signed patch
- vhd-lib minor
- @xen-orchestra/fs patch
- vhd-cli patch
- xo-vmdk-to-vhd minor
- @xen-orchestra/upload-ova patch
- @xen-orchestra/backups minor
- @xen-orchestra/backups-cli patch
- @xen-orchestra/emit-async major
- @xen-orchestra/mixins minor
- @xen-orchestra/proxy minor
- xo-server minor
- xo-web minor
- xo-server-backup-reports minor

<!--packages-end-->
