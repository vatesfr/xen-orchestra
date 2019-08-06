> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM/Attach disk] Display confirmation modal when VDI is already attached [#3381](https://github.com/vatesfr/xen-orchestra/issues/3381) (PR [#4366](https://github.com/vatesfr/xen-orchestra/pull/4366))
- [Zstd]
  - [VM/copy, VM/export] Only show zstd option when it's supported [#3892](https://github.com/vatesfr/xen-orchestra/issues/3892) (PRs [#4326](https://github.com/vatesfr/xen-orchestra/pull/4326) [#4368](https://github.com/vatesfr/xen-orchestra/pull/4368))
  - [VM/Bulk copy] Show warning if zstd compression is not supported on a VM [#3892](https://github.com/vatesfr/xen-orchestra/issues/3892) (PR [#4346](https://github.com/vatesfr/xen-orchestra/pull/4346))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [SR/General] Display VDI VM name in SR usage graph (PR [#4370](https://github.com/vatesfr/xen-orchestra/pull/4370))
- [VM/Attach disk] Fix checking VDI mode (PR [#4373](https://github.com/vatesfr/xen-orchestra/pull/4373))

### Released packages

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.

- xo-server-usage-report v0.7.3
- xo-server v5.47.0
- xo-web v5.47.0
