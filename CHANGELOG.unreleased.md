> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM import & Continuous Replication] Enable `guessVhdSizeOnImport` by default, this fix some `VDI_IO_ERROR` with XenServer 7.1 and XCP-ng 8.0 (PR [#4436](https://github.com/vatesfr/xen-orchestra/pull/4436))
- [SDN Controller] Add possibility to create multiple GRE networks and VxLAN networks within a same pool (PR [#4435](https://github.com/vatesfr/xen-orchestra/pull/4435))
- [SDN Controller] Let the user choose on which PIF to create a private network (PR [#4379](https://github.com/vatesfr/xen-orchestra/pull/4379))
- [VM/Attach disk] Display confirmation modal when VDI is already attached [#3381](https://github.com/vatesfr/xen-orchestra/issues/3381) (PR [#4366](https://github.com/vatesfr/xen-orchestra/pull/4366))
- [Zstd]
  - [VM/copy, VM/export] Only show zstd option when it's supported [#3892](https://github.com/vatesfr/xen-orchestra/issues/3892) (PRs [#4326](https://github.com/vatesfr/xen-orchestra/pull/4326) [#4368](https://github.com/vatesfr/xen-orchestra/pull/4368))
  - [VM/Bulk copy] Show warning if zstd compression is not supported on a VM [#3892](https://github.com/vatesfr/xen-orchestra/issues/3892) (PR [#4346](https://github.com/vatesfr/xen-orchestra/pull/4346))
- [SDN Controller] Add possibility to create cross-pool private networks. (PR [#4405](https://github.com/vatesfr/xen-orchestra/pull/4405))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

### Released packages

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.

- xo-server v5.49.0
- xo-web v5.49.0
