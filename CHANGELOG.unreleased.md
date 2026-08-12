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
- [Backups] Health check eligibility, full/incremental scheduling, and mirror job VM selection can now be driven by complex-matcher expressions (PR [#10064](https://github.com/vatesfr/xen-orchestra/pull/10064))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [REST API] Fix `/users/:id/authentication_tokens` sometimes did not return the token used to make the request (PR [#10233](https://github.com/vatesfr/xen-orchestra/pull/10233))
- [XO server] Fix a random behavior regarding `coresPerSocket` update (PR [#10201](https://github.com/vatesfr/xen-orchestra/pull/10201))

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

- @vates/types minor
- @xen-orchestra/acl minor
- @xen-orchestra/async-map patch
- @xen-orchestra/backup-archive patch
- @xen-orchestra/backups minor
- @xen-orchestra/proxy-cli patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/upload-ova patch
- @xen-orchestra/web minor
- @xen-orchestra/xapi patch
- xen-api minor
- xo-cli patch
- xo-common minor
- xo-server minor
- xo-server-ipmi-sensors minor
- xo-server-netbox patch

<!--packages-end-->
