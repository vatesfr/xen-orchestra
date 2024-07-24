> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Backups] Add 'report recipients' when creating a metadata backup [#7569](https://github.com/vatesfr/xen-orchestra/issues/7569) (PR [#7776](https://github.com/vatesfr/xen-orchestra/pull/7776))
- [Host/General] Display additional hardware data for 2CRSi server [#7816](https://github.com/vatesfr/xen-orchestra/issues/7816) (PR [#7838](https://github.com/vatesfr/xen-orchestra/pull/7838))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Self Service] Always allow administrators to bypass quotas (PR [#7855](https://github.com/vatesfr/xen-orchestra/pull/7855))
- [V2V] Fix `Can't import delta of a running VM without its parent VHD` error during warm migration (PR [#7856](https://github.com/vatesfr/xen-orchestra/pull/7856))
- [Backups] Fix a race condition leading to `VDI_INCOMPATIBLE_TYPE` error when using _Purge snapshot data_ (PR [#7828](https://github.com/vatesfr/xen-orchestra/pull/7828))
- [Backups] NBD backups now respected _default backup network_ settings (PR [#7836](https://github.com/vatesfr/xen-orchestra/pull/7836))
- [Backups] NBD backups now ignore unreachable host and retry on reachable ones (PR [#7836](https://github.com/vatesfr/xen-orchestra/pull/7836))
- [New SR] Add confirmation modal before creating an SR if SRs are already present in the same path (for NFS/ISCSI) [#4273](https://github.com/vatesfr/xen-orchestra/issues/4273) (PR [#7845](https://github.com/vatesfr/xen-orchestra/pull/7845))
- [XO Tasks] Reduce the number of API calls that incorrectly stay in pending status (often `sr.getAllUnhealthyVdiChainsLength`) [Forum#79281](https://xcp-ng.org/forum/post/79281) [Forum#80010](https://xcp-ng.org/forum/post/80010)
- [Plugin/backup-reports] Fix _Metadata Backup_ report not sent in some cases (PR [#7776](https://github.com/vatesfr/xen-orchestra/pull/7776))
- [Host/Advanced] Fix *Advanced Live Telemetry* link on recent XOAs

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
- @xen-orchestra/backups patch
- @xen-orchestra/mixins minor
- @xen-orchestra/xapi minor
- xen-api minor
- xo-server-backup-reports minor
- xo-server minor
- xo-web minor

<!--packages-end-->
