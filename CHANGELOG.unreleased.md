> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [HUB Recipe] Support custom cluster CIDR and Xo CCM (Cloud Controller Manager) in Pyrgos recipe
- [Disk] Add warning before disconnecting a VBD (PR [#9211](https://github.com/vatesfr/xen-orchestra/pull/9211))
- [vhd-cli] **Breaking changes** Changed commands input to make plugin usable on encrypted remotes (PR [#9235](https://github.com/vatesfr/xen-orchestra/pull/9235))
- [Plugins/OIDC] Import user groups from OIDC (PR [#9206](https://github.com/vatesfr/xen-orchestra/pull/9206))

- **XO 6:**
  - [New/VM] Display unsupported features information message (PR [#9203](https://github.com/vatesfr/xen-orchestra/pull/9203))
  - [i18n] Update Czech, German, French, Italian, Dutch, Portuguese (Brazil), and Ukrainian translations, and add Danish translation (PR [#9165](https://github.com/vatesfr/xen-orchestra/pull/9165))
  - [Header] Add EasyVirt DC Scope and DC NetScope buttons to install and access EasyVirt solutions (PR [#9242](https://github.com/vatesfr/xen-orchestra/pull/9242))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backups] use the oldest record for Long Term Retention instead of newest (PR [#9180](https://github.com/vatesfr/xen-orchestra/pull/9180))
- [Backups] fix infinite chain of snapshot and replication [Forum#11540](https://xcp-ng.org/forum/topic/11540) [Forum#11539](https://xcp-ng.org/forum/topic/11539) (PR [#9202](https://github.com/vatesfr/xen-orchestra/pull/9202))
- [V2V] fix missing libssl.so.3 in path on debian 11 (PR [#9208](https://github.com/vatesfr/xen-orchestra/pull/9208))
- [xo-server] imporve esxi 6 importing from wmware failure fallback by using COWD file (PR [#9223](https://github.com/vatesfr/xen-orchestra/pull/9223))

- **XO 6:**
  - [Host/Vm] fix issues on dashboards, and translation on charts (PR [#9204](https://github.com/vatesfr/xen-orchestra/pull/9204))
- [V2V] fix transfer failing at 99% for unaligned disk (PR [#9233](https://github.com/vatesfr/xen-orchestra/pull/9233))

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

- @vates/nbd-client patch
- @xen-orchestra/rest-api patch
- @xen-orchestra/vmware-explorer patch
- vhd-cli major
- vhd-lib patch
- xo-server patch
- xo-server-auth-oidc minor
- xo-web minor

<!--packages-end-->
