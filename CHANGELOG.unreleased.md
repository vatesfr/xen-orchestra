> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Search Engine] Implement first version of the Query Builder on Pools, Hosts, VMs, networks and Storage tables (PR [#9488](https://github.com/vatesfr/xen-orchestra/pull/9488))
- [REST API] Added POST `/srs/{id}/actions/scan` rest routes (PR [#9514](https://github.com/vatesfr/xen-orchestra/pull/9514))
- **XO 5:**
  - [Network] Ability to switch management PIF (PRs [#9369](https://github.com/vatesfr/xen-orchestra/pull/9369) [#9510](https://github.com/vatesfr/xen-orchestra/pull/9510))
  - [Licenses] Display bundle name next to license name (PR [#9512](https://github.com/vatesfr/xen-orchestra/pull/9512))
  - [Patches] Warn about updating XOSTOR before installing patches (PR [#9517](https://github.com/vatesfr/xen-orchestra/pull/9517))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backups] remove the `cleanVm: incorrect backup size in metadata` error (PR [#9527](https://github.com/vatesfr/xen-orchestra/pull/9527))

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

- @xen-orchestra/backups patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- complex-matcher minor
- xo-web minor

<!--packages-end-->
