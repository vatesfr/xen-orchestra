> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM import & Continuous Replication] Enable `guessVhdSizeOnImport` by default, this fix some `VDI_IO_ERROR` with XenServer 7.1 and XCP-ng 8.0 (PR [#4436](https://github.com/vatesfr/xen-orchestra/pull/4436))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM revert] Snapshot before: add admin ACLs on created snapshot [#4331](https://github.com/vatesfr/xen-orchestra/issues/4331) (PR [#4391](https://github.com/vatesfr/xen-orchestra/pull/4391))
- [Network] Fixed "invalid parameters" error when creating bonded network [#4425](https://github.com/vatesfr/xen-orchestra/issues/4425) (PR [#4429](https://github.com/vatesfr/xen-orchestra/pull/4429))

### Released packages

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.

- xo-server v5.48.0
- xo-web v5.48.0
