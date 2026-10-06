> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Backup] Read the disks through the `xo-nbd` XAPI plugin when it is installed on the hosts, faster than `xapi-nbd` which stays the fallback
- [Backup] Faster NBD reads using much less CPU: the blocks are received without intermediate copy and their memory is reused
- [Backup] Less CPU used to write the blocks on a remote, especially an encrypted one: the data are written and encrypted without being concatenated first
- [Backup] New `zstd` compression for the remotes in block mode, faster to back up and about 1.5 times faster to restore than `brotli`
- [Backup] Faster compression and decompression of the backups on a remote in block mode, existing backups included
- [Backup/Restore] Faster reading of the files of a remote, like the full backups (10 MiB chunks instead of 64 KiB)
- [Restore/Replication] Write the disks through the `xo-nbd` XAPI plugin when it is installed, several blocks at a time, instead of a XAPI import
- [Mirror] The incremental mirrors copy the blocks as stored, without decompressing nor recompressing them, when the source and the destinations use the same compression
- [Mirror] The full mirrors between unencrypted remotes reuse the checksum of the source instead of computing it again
- [Backup/Restore] Less CPU used on the local, NFS and SMB remotes: the stack traces of the file system errors are no longer completed by default (`syncStackTraces` in `[remoteOptions]` to enable them)

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

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

- @vates/nbd-client minor
- @xen-orchestra/backup-archive minor
- @xen-orchestra/backups minor
- @xen-orchestra/disk-transform minor
- @xen-orchestra/fs minor
- @xen-orchestra/xapi minor
- vhd-lib minor

<!--packages-end-->
