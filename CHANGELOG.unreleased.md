> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [XO6/Host] Add possibility to shut down and start an host (PR [#10088](https://github.com/vatesfr/xen-orchestra/pull/10088))
- [REST API] Add `hosts/:id/actions/scan_pifs` endpoint (PR [#10187](https://github.com/vatesfr/xen-orchestra/pull/10187))
- [XO6/Host] Add possibility to scan PIFs directly from the host (PR [#10191](https://github.com/vatesfr/xen-orchestra/pull/10191))
- [Docs] Improve doc, rename titles, and refactor menu (PR [#10212](https://github.com/vatesfr/xen-orchestra/pull/10212))

- [IPMI-plugin] Add GET plugins/ipmi-sensors/hosts/{id}/ipmi to get IPMI sensors (PR [#10003](https://github.com/vatesfr/xen-orchestra/pull/10003))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [REST API] Fix `/users/:id/authentication_tokens` sometimes did not return the token used to make the request (PR [#10233](https://github.com/vatesfr/xen-orchestra/pull/10233))
- [Backup] Fix backups and exports hanging forever, with `uncaught exception AssertionError: assert(!this.paused)` in the logs, when a host closes a transfer while XO is writing to a slower destination (PR [#10249](https://github.com/vatesfr/xen-orchestra/pull/10249))

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

- @xen-orchestra/acl minor
- @xen-orchestra/mcp major
- @xen-orchestra/proxy-cli major
- @xen-orchestra/rest-api minor
- @xen-orchestra/upload-ova patch
- @xen-orchestra/vmware-explorer major
- @xen-orchestra/web minor
- @xen-orchestra/xapi major
- xen-api major
- xo-cli major
- xo-common minor
- xo-server major
- xo-server-ipmi-sensors minor
- xo-server-netbox patch
- xo-server-openmetrics major

<!--packages-end-->
