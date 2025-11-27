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
- [Plugins/Perf-alert] **Breaking changes** Improve performance of plugins, remove Alarm generation (PR [#9070](https://github.com/vatesfr/xen-orchestra/pull/9070))

- **XO 6:**
  - [New/VM] Display unsupported features information message (PR [#9203](https://github.com/vatesfr/xen-orchestra/pull/9203))
  - [i18n] Update Czech, German, French, Italian, Dutch, Portuguese (Brazil), and Ukrainian translations, and add Danish translation (PR [#9165](https://github.com/vatesfr/xen-orchestra/pull/9165))
  - [Header] Add EasyVirt DC Scope and DC NetScope buttons to install and access EasyVirt solutions (PR [#9242](https://github.com/vatesfr/xen-orchestra/pull/9242))
  - Implement reactivity for VMs, VM templates, VM controllers, VIFs, VDIs, VBDs, SRs, pools, PIFs, PGPUs, PCIs, networks, alarms, and hosts (PR [#9183](https://github.com/vatesfr/xen-orchestra/pull/9183))
  - [Core] Add tooltip on tag component if the text is cut (PR [#9184](https://github.com/vatesfr/xen-orchestra/pull/9184))
  - [Pool/Hosts] Implement hosts view and side panel information (PR [#9218](https://github.com/vatesfr/xen-orchestra/pull/9218))
  - [VM/VDIs] Implement vdis view and side panel information (PR [#9232](https://github.com/vatesfr/xen-orchestra/pull/9232))
  - [VM/New] Add boot firmware to VM creation form (PR [#9158](https://github.com/vatesfr/xen-orchestra/pull/9158))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backups] use the oldest record for Long Term Retention instead of newest (PR [#9180](https://github.com/vatesfr/xen-orchestra/pull/9180))
- [Backups] fix infinite chain of snapshot and replication [Forum#11540](https://xcp-ng.org/forum/topic/11540) [Forum#11539](https://xcp-ng.org/forum/topic/11539) (PR [#9202](https://github.com/vatesfr/xen-orchestra/pull/9202))
- [V2V] fix missing libssl.so.3 in path on debian 11 (PR [#9208](https://github.com/vatesfr/xen-orchestra/pull/9208))
- [xo-server] imporve esxi 6 importing from wmware failure fallback by using COWD file (PR [#9223](https://github.com/vatesfr/xen-orchestra/pull/9223))
- [REST API] Fix `/rest/v0/backup-archives` return error 500 _Cannot convert undefined or null to object_ (PR [#9240](https://github.com/vatesfr/xen-orchestra/pull/9240))

- **XO 6:**
  - [Host/Vm] fix issues on dashboards, and translation on charts (PR [#9204](https://github.com/vatesfr/xen-orchestra/pull/9204))
  - [Dashboards/Alarms] fix double scrollbar in Alarms lists due to incorrect height setting (PR [#9246](https://github.com/vatesfr/xen-orchestra/pull/9246))
  - [Dashboards] Prevent charts reloading every 30 seconds (PR [#8939](https://github.com/vatesfr/pull/8939))
- [V2V] fix transfer failing at 99% for unaligned disk (PR [#9233](https://github.com/vatesfr/xen-orchestra/pull/9233))
- [REST API] _parse error: expected end of input at position #_ when an invalid query parameter is provided, a 400 error is returned with more details (PR [#9244](https://github.com/vatesfr/xen-orchestra/pull/9244))

- **XO 6:**
  - [Host/HostSystemResourceManagement] Fix display when control domain memory is undefined (PR [#9197](https://github.com/vatesfr/xen-orchestra/pull/9197))

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
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- vhd-cli major
- vhd-lib patch
- xo-server patch
- xo-server-auth-oidc minor
- xo-server-perf-alert major
- xo-web minor

<!--packages-end-->
