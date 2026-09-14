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
- [REST API/Backup] Add `backup-archives/:id/actions/mountLiveDisk` and `.../unmountLiveDisk` endpoints: attach a disk of a backup to a host as a read-only SR, to read its content without restoring it. This XO's address reachable from the hosts is auto-detected, or can be set explicitly with `iscsi.advertisedAddress`

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [REST API] Fix `/users/:id/authentication_tokens` sometimes did not return the token used to make the request (PR [#10233](https://github.com/vatesfr/xen-orchestra/pull/10233))

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
- @xen-orchestra/backups minor
- @xen-orchestra/mixins minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server minor

<!--packages-end-->
