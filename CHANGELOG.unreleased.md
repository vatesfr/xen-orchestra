> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup] Remove incorrect size warning following a merge [Forum #5727](https://xcp-ng.org/forum/topic/4769/warnings-showing-in-system-logs-following-each-backup-job/4) (PR [#6010](https://github.com/vatesfr/xen-orchestra/pull/6010))
- [Delta Backup] Preserve UEFI boot parameters [#6054](https://github.com/vatesfr/xen-orchestra/issues/6054) [Forum #5319](https://xcp-ng.org/forum/topic/5319/bug-uefi-boot-parameters-not-preserved-with-delta-backups)
- [Delta Backup on S3] Compress blocks by default ([Brotli](https://en.wikipedia.org/wiki/Brotli)) which reduces remote usage and increase backup speed (PR [#5932](https://github.com/vatesfr/xen-orchestra/pull/5932))

### Packages to release

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.
>
> The format is the following: - `$packageName` `$version`
>
> Where `$version` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> In case of conflict, the highest (lowest in previous list) `$version` wins.

- @xen-orchestra/xapi patch
- vhd-lib minor
- xo-vmdk-to-vhd patch
- @xen-orchestra/backups patch
- xo-server patch
- @xen-orchestra/proxy patch
