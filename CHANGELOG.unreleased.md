> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Snapshot] Fallback to normal snapshot if quiesce is not available [#4735](https://github.com/vatesfr/xen-orchestra/issues/4735) (PR [#4736](https://github.com/vatesfr/xen-orchestra/pull/4736)) \
  Fixes compatibility with **Citrix Hypervisor 8.1**.
- [Uncompressed full backup] Quick healthcheck of downloaded XVAs in case there was an undetected issue (PR [#4741](https://github.com/vatesfr/xen-orchestra/pull/4741))
- [Backup] Make built-in concurrency limits configurable (PR [#4743](https://github.com/vatesfr/xen-orchestra/pull/4743)) \
  Via the following entries in `xo-server`'s configuration file:
  - `xapiOptions.vdiExportConcurrency`
  - `xapiOptions.vmExportConcurrency`
  - `xapiOptions.vmSnapshotConcurrency`

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

### Released packages

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.

- xo-server v5.55.0
- xo-web v5.55.0
