> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM migration] Ability to choose network for migration within a pool [#2028](https://github.com/vatesfr/xen-orchestra/issues/2028) (PR [#4828](https://github.com/vatesfr/xen-orchestra/pull/4828))
- [Support] Link to create a new support ticket [#4234](https://github.com/vatesfr/xen-orchestra/issues/4234) (PR [#4833](https://github.com/vatesfr/xen-orchestra/pull/4833))
- [Import] add CLI tool to import OVA files (PR [#3630](https://github.com/vatesfr/xen-orchestra/pull/3630))
- [Proxies] Ability to redeploy a proxy VM [#4825](https://github.com/vatesfr/xen-orchestra/issues/4825) (PR [#4725](https://github.com/vatesfr/xen-orchestra/pull/4725))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [XOSAN] Fix the installer (PR [#4839](https://github.com/vatesfr/xen-orchestra/pull/4839))
- [Self] When a Self Service related operation fails, always revert the quotas to what they were before the operation (PR [#4861](https://github.com/vatesfr/xen-orchestra/pull/4861))

### Released packages

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.

- xo-vmdk-to-vhd major
- xo-upload-ova major
- xo-server minor
- xo-web minor
