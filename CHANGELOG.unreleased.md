> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

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
- [IPMI-plugin] Add GET plugins/ipmi-sensors/hosts/{id}/ipmi to get IPMI sensors (PR [#10003](https://github.com/vatesfr/xen-orchestra/pull/10003))
- [VIF] Add VIF name in header on VIF detail page (PR [#10252](https://github.com/vatesfr/xen-orchestra/pull/10252))
- [IPMI-plugin] Add GET plugins/ipmi-sensors/hosts/{id}/ipmi to get IPMI sensors (PR [#10003](https://github.com/vatesfr/xen-orchestra/pull/10003))
- [VIF] Add VIF name in header on VIF detail page (PR [#10252](https://github.com/vatesfr/xen-orchestra/pull/10252))
- [XO6/SR] Add dedicated Storage Repository page with general information, space usage, PBD details, custom fields (PR [#10100](https://github.com/vatesfr/xen-orchestra/pull/10100))
- [XO5/Backups] Add `Synchronize snapshots` checkbox to backup jobs to get consistent restore points (PR [#10136](https://github.com/vatesfr/xen-orchestra/pull/10136))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Backup/File restore, Backup/Health] An unreachable backup repository no longer slows down every listing: it is skipped after a delay and retried with an increasing backoff (PR [#10205](https://github.com/vatesfr/xen-orchestra/pull/10205))
- [REST API] Fix `/users/:id/authentication_tokens` sometimes did not return the token used to make the request (PR [#10233](https://github.com/vatesfr/xen-orchestra/pull/10233))
- [XO server] Fix a random behavior regarding `coresPerSocket` update (PR [#10201](https://github.com/vatesfr/xen-orchestra/pull/10201))
- [Warm migration] Fix `Vm target of warm migration not found` error at the end of a migration (PR [#10210](https://github.com/vatesfr/xen-orchestra/pull/10210))
- [XO6] Fix inconsistent spacing in side panel cards (PR [#10279](https://github.com/vatesfr/xen-orchestra/pull/10279))
- [VIF] Preserve other_config, rate limit, MTU and device when changing a VIF's MAC address (PR [#10284](https://github.com/vatesfr/xen-orchestra/pull/10284))
- **XO 5**:
  - [VM/Console] Fix the page header and tab navigation disappearing permanently in the console tab (PR [#10007](https://github.com/vatesfr/xen-orchestra/pull/10007))

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

- @vates/types patch
- @xen-orchestra/acl minor
- @xen-orchestra/async-map patch
- @xen-orchestra/backups minor
- @xen-orchestra/proxy-cli patch
- @xen-orchestra/qa-test minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/upload-ova patch
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi patch
- xen-api minor
- xo-cli patch
- xo-common minor
- xo-server patch
- xo-server-ipmi-sensors minor
- xo-server-netbox patch
- xo-web minor

<!--packages-end-->
