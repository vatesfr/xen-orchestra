> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

- [SBOM] Add CycloneDX generation script to check all dependencies in one json (PR [#10368](https://github.com/vatesfr/xen-orchestra/pull/10368))

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Servers] Fix servers stuck in `Connecting` state when using an HTTPS proxy that support HTTP/2 ([Forum#12502](https://xcp-ng.org/forum/topic/12502/xoa-6.9-update)) (PR [#10507](https://github.com/vatesfr/xen-orchestra/pull/10507))
- [V2V] Fix `vectura is not runnable` on XOA and other systems based on Debian 11 (glibc 2.31): the `vectura` binary required glibc 2.34
- [VM/System] Fix video RAM displayed in bytes instead of MiB (PR [#10486](https://github.com/vatesfr/xen-orchestra/pull/10486))
- [XO5/Hosts] Disable restart toolstack button for the hosts that belongs to a HA pools in the home page (PR [#10497](https://github.com/vatesfr/xen-orchestra/pull/10497))

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

- @xen-orchestra/vmware-explorer patch
- @xen-orchestra/web patch
- vectura patch
- xen-api patch
- xo-web patch

<!--packages-end-->
