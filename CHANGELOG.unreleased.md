> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VDI migration]
  - Remove 'Migrate all VDIs' checkbox (PR [#4876](https://github.com/vatesfr/xen-orchestra/pull/4876))
  - [VM/disks]: Add bulk migration (PR [#4877](https://github.com/vatesfr/xen-orchestra/pull/4877))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Audit] Fix "EACCES" error in case of changing the user that run "xo-server" [#4854](https://github.com/vatesfr/xen-orchestra/issues/4854) (PR [#4897](https://github.com/vatesfr/xen-orchestra/pull/4897))

### Released packages

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.

- xo-server-audit patch
- xo-server minor
- xo-web minor
