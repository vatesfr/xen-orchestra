> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **XO 6:**
  - [VM] Add "Change state" button on VM view (PR [#9317](https://github.com/vatesfr/xen-orchestra/pull/9317))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [REST API] Fix `/vms/:id/dashboard` _cannot read properties of undefined (reading 'id')_ (PR [#9380](https://github.com/vatesfr/xen-orchestra/pull/9380))
- [REST API] `vms/:id/dashboard` return now an empty object for the `replication` key instead of undefined (in case of no replication) (PR [#9380](https://github.com/vatesfr/xen-orchestra/pull/9380))
- [REST API] `vms/:id/dashboard` rename `not-in-job` into `not-in-active-job` for the `vmProtection` key to avoid confusion (PR [#9380](https://github.com/vatesfr/xen-orchestra/pull/9380))
- [REST API] Don't return VDI-snapshot for `/vms/:id/vdis` endpoints (PR [#9381](https://github.com/vatesfr/xen-orchestra/pull/9381))
- [REST API] `/dashboard` return now `{isEmpty: true}` instead of undefined in case there is no data to compute (PR [#9395](https://github.com/vatesfr/xen-orchestra/pull/9395))
- [Backup] Fix `read xxx bytes, maximum size allowed is yyy` for full backup on S3 (PR [#9396](https://github.com/vatesfr/xen-orchestra/pull/9396))
- [VM] Add "Change state" button on VM view (PR [#9317](https://github.com/vatesfr/xen-orchestra/pull/9317))

- **XO 6:**
  - [Sidebar] Removal borders top and right of sidebar in mobile (PR [#9366](https://github.com/vatesfr/xen-orchestra/pull/9366))

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
- @xen-orchestra/backups patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- vhd-cli minor
- xo-server minor
- xo-server-openmetrics minor

<!--packages-end-->
