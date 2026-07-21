> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [XO6] Allow changing which PIF a host uses for its management interface, without deleting and recreating the network config (PR [#10110](https://github.com/vatesfr/xen-orchestra/pull/10110))
- [i18n] Add Arabic and update Czech, Dutch, Finnish, Portuguese (Brasil), Slovak and Swedish translations (PR [#10181](https://github.com/vatesfr/xen-orchestra/pull/10181))
- [XO6/Backups] Add header title on backup job detail page (PR [#10303](https://github.com/vatesfr/xen-orchestra/pull/10303))
- [XO6/Host] Add possibility to restart a host toolstack (PR [#10178](https://github.com/vatesfr/xen-orchestra/pull/10178))
- [XO6/Pool] Add forget action on page Site (PR [#10130](https://github.com/vatesfr/xen-orchestra/pull/10130))
- [XO6/Host] Add possibility to shut down and start an host (PR [#10088](https://github.com/vatesfr/xen-orchestra/pull/10088))
- [REST API] Add `hosts/:id/actions/scan_pifs` endpoint (PR [#10187](https://github.com/vatesfr/xen-orchestra/pull/10187))
- [XO6/Host] Add possibility to scan PIFs directly from the host (PR [#10191](https://github.com/vatesfr/xen-orchestra/pull/10191))
- [Docs] Improve doc, rename titles, and refactor menu (PR [#10212](https://github.com/vatesfr/xen-orchestra/pull/10212))
- [XO6/Host] Add possibility to forget a host (PR [#10089](https://github.com/vatesfr/xen-orchestra/pull/10089))
- [Pool/Traffic rules] Add an error message and disable the ability to create a network-type traffic rule depending on the method used (PR [#10202](https://github.com/vatesfr/xen-orchestra/pull/10202))
- [XO6/Host] Add possibility to disable a host an evacuate its VMs (PR [#10090](https://github.com/vatesfr/xen-orchestra/pull/10090))
- [XO6/Host] Add possibility to reboot a host (PR [#10141](https://github.com/vatesfr/xen-orchestra/pull/10141))
- [XO6/Host] Add possibility to force reboot a host (PR [#10175](https://github.com/vatesfr/xen-orchestra/pull/10175))
- [VIF] Add VIF name in header on VIF detail page (PR [#10252](https://github.com/vatesfr/xen-orchestra/pull/10252))
- [IPMI-plugin] Add GET plugins/ipmi-sensors/hosts/{id}/ipmi to get IPMI sensors (PR [#10003](https://github.com/vatesfr/xen-orchestra/pull/10003))
- [XO6/SR] Add dedicated Storage Repository page with general information, space usage, PBD details, custom fields (PR [#10100](https://github.com/vatesfr/xen-orchestra/pull/10100))
- [XO6/SR] Add dedicated Storage Repository page hosts sidepanel (PR [#10140](https://github.com/vatesfr/xen-orchestra/pull/10140))
- [XO5/Backups] Add `Synchronize snapshots` checkbox to backup jobs to get consistent restore points (PR [#10136](https://github.com/vatesfr/xen-orchestra/pull/10136))
- [XO6/Host] Add possibility to smart reboot a host (PR [#10177](https://github.com/vatesfr/xen-orchestra/pull/10177))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

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

<!--packages-end-->
