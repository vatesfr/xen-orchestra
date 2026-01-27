> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Add `POST /vbds/:id/actions/connect` and `POST /vbds/:id/actions/disconnect` endpoints to hotplug/unplug VBDs from running VMs (PR [#9399](https://github.com/vatesfr/xen-orchestra/pull/9399))
- [REST API] Add `POST /vdis/:id/actions/migrate` endpoint to migrate a VDI to another SR (PR [#9408](https://github.com/vatesfr/xen-orchestra/pull/9408))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

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
- @xen-orchestra/rest-api minor

<!--packages-end-->
