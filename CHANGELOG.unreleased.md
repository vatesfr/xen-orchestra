> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Backup/Restore] Live restore: a disk can now be live mounted read/write, with a cache on an SR of the pool running XO (or the proxy). Each block is read from the BR only once and the VM can boot from it, but what it writes is lost when the mount is released. The live mounted SR and VDI are now named after the backed up VM, disk and backup date (PR [#10434](https://github.com/vatesfr/xen-orchestra/pull/10434))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- Fix `cannot read properties of undefined (reading code)` (PR [#10668](https://github.com/vatesfr/xen-orchestra/pull/10668))
- [SDN Controller] A Global Private Network that fails to be set up, or whose preferred star-center host was removed, no longer blocks the other private networks (PR [#10629](https://github.com/vatesfr/xen-orchestra/pull/10629))

### Packages to release

> When modifying a package, add it here with its release type.
>
> The format is the following: `- $packageName $releaseType`
>
> Where `$releaseType` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> Keep this list alphabetically ordered to avoid merge conflicts

<!--packages-start-->

- @vates/iscsi minor
- @vates/types minor
- @xen-orchestra/backups minor
- @xen-orchestra/mixins minor
- @xen-orchestra/proxy minor
- xo-server minor
- xo-web minor
- xo-server-sdn-controller patch

<!--packages-end-->
