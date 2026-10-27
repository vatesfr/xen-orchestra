> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [V2V] With `stopSource`, the source VM is shut down cleanly through the VMware tools, and only powered off when its tools do not run or it does not shut down within 10 minutes (PR [#10637](https://github.com/vatesfr/xen-orchestra/pull/10637))
- [XO6] Display dates and times as `YYYY-MM-DD HH:mm:ss` in all UI views (PR [#10547](https://github.com/vatesfr/xen-orchestra/pull/10547))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- Fix `cannot read properties of undefined (reading code)` (PR [#10668](https://github.com/vatesfr/xen-orchestra/pull/10668))
- [SDN Controller] A Global Private Network that fails to be set up, or whose preferred star-center host was removed, no longer blocks the other private networks (PR [#10629](https://github.com/vatesfr/xen-orchestra/pull/10629))
- [V2V] Fix the migration of a running VM whose change tracking (CBT) is not enabled failing on ESXi 7 and 8 once the source is stopped: the change tracking is now enabled on the source VM, so that only the used blocks are read, and only the changed ones for the delta. A partial import made before can't be resumed and is transferred again (PR [#10637](https://github.com/vatesfr/xen-orchestra/pull/10637))

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

- @xen-orchestra/vmware-explorer minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server patch
- xo-server-sdn-controller patch

<!--packages-end-->
