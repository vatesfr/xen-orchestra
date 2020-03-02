> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup reports] Fix backup report not sent in case of interrupted backup job (PR [#4772](https://github.com/vatesfr/xen-orchestra/pull/4772))
- Fix TLS error (`unsupported protocol`) with XenServer <= 6.5 and Node >= 12 (PR [#8437](https://github.com/vatesfr/xen-orchestra/pull/8437))
- [Metadata backup] fix metadata backup timeout [#4819](https://github.com/vatesfr/xen-orchestra/issues/4819) (PR [#4831](https://github.com/vatesfr/xen-orchestra/pull/4831))

### Released packages

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.

- @xen-orchestra/fs v0.10.3
- xo-server-backup-reports v0.16.5
- xo-server v5.58.0
- xo-web v5.58.0
