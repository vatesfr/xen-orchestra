> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Logs] Ability to report a bug with attached log (PR [#4201](https://github.com/vatesfr/xen-orchestra/pull/4201))
- [Backup] Reduce _VDI chain protection error_ occurrence by being more tolerant (configurable via `xo-server`'s `xapiOptions.maxUncoalescedVdis` setting) [#4124](https://github.com/vatesfr/xen-orchestra/issues/4124) (PR [#4651](https://github.com/vatesfr/xen-orchestra/pull/4651))
- [Plugin] New web hooks plugin [#1946](https://github.com/vatesfr/xen-orchestra/issues/1946) (PR [#3155](https://github.com/vatesfr/xen-orchestra/pull/3155))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”
- [SDN controller] Prevent private network creation on bond slave PIF (Fixes https://github.com/xcp-ng/xcp/issues/300) (PR [4633](https://github.com/vatesfr/xen-orchestra/pull/4633))

- [Metadata backup] Fix failed backup reported as successful [#4596](https://github.com/vatesfr/xen-orchestra/issues/4596) (PR [#4598](https://github.com/vatesfr/xen-orchestra/pull/4598))

### Released packages

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.

- xo-server-backup-reports v0.16.3
- vhd-lib v0.7.1
- xo-server v5.52.0
- xo-web v5.52.0
