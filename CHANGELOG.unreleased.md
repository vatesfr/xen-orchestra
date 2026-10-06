> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [REST API] `POST /rest/v0/acl-roles` now supports a `privileges` property, allowing privileges to be directly associated with the newly created role (PR [#10470](https://github.com/vatesfr/xen-orchestra/pull/10470))
- [XO6/Tasks] Add link and object resolution to Tasks Overview panel, better text flow for resolved task names (PR [#10265](https://github.com/vatesfr/xen-orchestra/pull/10265))
- [XO5/Settings/IPs] Show an example of the expected IP format when adding IPs to an IP pool (PR [#10522](https://github.com/vatesfr/xen-orchestra/pull/10522))
- [XO6/BRs] Add backup repository create form (PR [#10271](https://github.com/vatesfr/xen-orchestra/pull/10271))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [New/VM] Hide guest tools ISO SR in new VM ISO selector (PR [#10430](https://github.com/vatesfr/xen-orchestra/pull/10430))
- [Host/VM] Fix the confirmation modal staying open and blocking the UI until the action was fully completed (PR #10417](https://github.com/vatesfr/xen-orchestra/pull/10417))
- [Dashboard] Fix cards staying in error state after a temporary failure to fetch data, until the page was reloaded (PR [#10516](https://github.com/vatesfr/xen-orchestra/pull/10516))

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
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server minor
- xo-web minor

<!--packages-end-->
