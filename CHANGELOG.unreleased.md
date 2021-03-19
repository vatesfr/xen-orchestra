> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Pool] Fix `an error has occurred` when using the "Disconnect" button from the pool page [#5669](https://github.com/vatesfr/xen-orchestra/issues/5669) (PR [#5671](https://github.com/vatesfr/xen-orchestra/pull/5671))
- [Configuration] Automatically connect enabled servers after import [#5660](https://github.com/vatesfr/xen-orchestra/issues/5660) (PR [#5672](https://github.com/vatesfr/xen-orchestra/pull/5672))
- Work-around some `ECONNRESET` errors when connecting to XEN-API (PR [#5674](https://github.com/vatesfr/xen-orchestra/pull/5674))
- [Backup] Retry automatically on `resource temporarily unavailable` error (PR [#5612](https://github.com/vatesfr/xen-orchestra/pull/5612))
- [Backup Restore] Don't break in case of malformed logs
- [Backup Restore] Fix `MESSAGE_METHOD_UNKNOWN(VM.set_bios_strings)` with XenServer < 7.3
- [Disk import] Fix `an error has occurred` when importing wrong format or corrupted files [#5663](https://github.com/vatesfr/xen-orchestra/issues/5663) (PR [#5683]https://github.com/vatesfr/xen-orchestra/pull/5683)

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

- xo-common minor
- @xen-orchestra/fs patch
- xen-api minor
- @xen-orchestra/xapi patch
- @xen-orchestra/backups patch
- xo-server patch
- xo-web patch
