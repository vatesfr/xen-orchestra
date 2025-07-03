> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Expose `/rest/v0/pools/<pool-id>/stats` (PR [#8764](https://github.com/vatesfr/xen-orchestra/pull/8764))

- **Migrated REST API endpoints**

  - `GET /rest/v0/hosts/<host-id>/audit.txt` (PR [#8757](https://github.com/vatesfr/xen-orchestra/pull/8757))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- **XO 6:**
  - [Charts] Fix tooltip overflow when too close to the edge [Forum#11012](https://xcp-ng.org/forum/topic/11012/graph-in-v0.12.0-48bf9/2) (PR [#8779](https://github.com/vatesfr/xen-orchestra/pull/8779))

- [VM/New] Fix `Cannot read properties of undefined (reading '$ref')` when creating VM configured to PXE boot (PR [#8782](https://github.com/vatesfr/xen-orchestra/pull/8782))
- [Backups] fix backup job getting stuck without NBD (PR [#8780](https://github.com/vatesfr/xen-orchestra/pull/8780))

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

- @vates/nbd-client patch
- @vates/types minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi patch
- xen-api patch
- xo-server minor

<!--packages-end-->
