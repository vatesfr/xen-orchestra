> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

- [VM] Detect XSA-468 vulnerable VMs. Read our announcement on the [XCP-ng blog](https://xcp-ng.org/blog/2025/05/27/xsa-468-windows-pv-driver-vulnerabilities/) for more details. (PR [#8638](https://github.com/vatesfr/xen-orchestra/pull/8638))

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **Migrated REST API endpoints**:
  - `/rest/v0/pifs` (PR [#8569](https://github.com/vatesfr/xen-orchestra/pull/8569))
  - `/rest/v0/pifs/<pif-id>` (PR [#8569](https://github.com/vatesfr/xen-orchestra/pull/8569))
  - `/rest/v0/vms/<vm-id>/actions/snapshot` (PR [#8622](https://github.com/vatesfr/xen-orchestra/pull/8622))
- **XO 6:**
  - [i18n] Update Czech, German, Spanish, Dutch, Russian and Swedish translations (PR [#8534](https://github.com/vatesfr/xen-orchestra/pull/8534))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- **XO 6**:

  - [VM] Add auto redirection from /vm/[id] to /vm/[id]/console (PR [#8553](https://github.com/vatesfr/xen-orchestra/pull/8553))

- [Hosts] Avoid getting XO tasks logs flooded with errors on `host.isPubKeyTooShort` (PR [#8605](https://github.com/vatesfr/xen-orchestra/pull/8605))
- [VM] Fix "an error has occurred" in Advanced tab when VTPM is `null` (PR [#8601](https://github.com/vatesfr/xen-orchestra/pull/8601))

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
- @xen-orchestra/backups minor
- @xen-orchestra/disk-transform patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web patch
- @xen-orchestra/web-core patch
- xo-server minor
- xo-server-auth-ldap patch
- xo-web minor

<!--packages-end-->
