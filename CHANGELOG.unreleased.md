> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [SR/new] Clarify address formats [#4450](https://github.com/vatesfr/xen-orchestra/issues/4450) (PR [#4460](https://github.com/vatesfr/xen-orchestra/pull/4460))
- [Backup NG/New] Show warning if zstd compression is not supported on a VM [#3892](https://github.com/vatesfr/xen-orchestra/issues/3892) (PRs [#4411](https://github.com/vatesfr/xen-orchestra/pull/4411))

### Bug fixes

- [PBD] Obfuscate cifs password from device config [#4384](https://github.com/vatesfr/xen-orchestra/issues/4384) (PR [#4401](https://github.com/vatesfr/xen-orchestra/pull/4401))
- [XOSAN] Fix "invalid parameters" error on creating a SR (PR [#4478](https://github.com/vatesfr/xen-orchestra/pull/4478))
- [Patching] Avoid overloading XCP-ng by reducing the frequency of yum update checks [#4358](https://github.com/vatesfr/xen-orchestra/issues/4358) (PR [#4477](https://github.com/vatesfr/xen-orchestra/pull/4477))
- [Network] Fix inability to create a bonded network (PR [#4489](https://github.com/vatesfr/xen-orchestra/pull/4489))
- [Backup restore & Replication] Don't copy `sm_config` to new VDIs which might leads to useless coalesces [#4482](https://github.com/vatesfr/xen-orchestra/issues/4482) (PR [#4484](https://github.com/vatesfr/xen-orchestra/pull/4484))

> Users must be able to say: “I had this issue, happy to know it's fixed”

### Released packages

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.

- xo-server-sdn-controller v0.2.2
- xo-server v5.49.0
- xo-web v5.49.0
