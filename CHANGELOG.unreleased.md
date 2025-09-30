> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- **Migrated REST API endpoints**:
  - `GET /rest/v0/vm-templates/<vm-template-id>/messages` (PR [#8995](https://github.com/vatesfr/xen-orchestra/pull/8995))
  - `GET /rest/v0/hosts/<host-id>/messages` (PR [#8995](https://github.com/vatesfr/xen-orchestra/pull/8995))

- **XO 6:**
  - [i18n] Update some wordings in French translation (contribution by [@Luxinenglish](https://github.com/Luxinenglish)) (PR [#8983](https://github.com/vatesfr/xen-orchestra/pull/8983))
  - [i18n] Update Czech, Spanish, Italian, Dutch, Portuguese (Brazil), Russian and Ukrainian translations (PR [#8901](https://github.com/vatesfr/xen-orchestra/pull/8901))
  - [Site/Backups] Add side panel to backup jobs view (PR [#8966](https://github.com/vatesfr/xen-orchestra/pull/8966))
  - [VM/Backups] Add side panel to VM backup jobs view (PR [#8978](https://github.com/vatesfr/xen-orchestra/pull/8978))

- [sdn-controller] Use the XCP-ng plugin instead of a direct channel to drive openflow (PR [#8488](https://github.com/vatesfr/xen-orchestra/pull/8488))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- **XO 6:**
  - [VM/New] Fix `auto_poweron is an excess property and therefore is not allowed` during VM creation (PR [#8998](https://github.com/vatesfr/xen-orchestra/pull/8998))
  - [sdn-controller] Remove port for ICMP filtering (PR [#8488](https://github.com/vatesfr/xen-orchestra/pull/8488))

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

- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server minor
- xo-server-sdn-controller minor
- xo-web minor

<!--packages-end-->
