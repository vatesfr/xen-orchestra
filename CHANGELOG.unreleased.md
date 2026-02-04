> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Settings] Add various themes (PR [#9387](https://github.com/vatesfr/xen-orchestra/pull/9387))
- [VM] Add delete and snapshot buttons to manage VM (PR [9410](https://github.com/vatesfr/xen-orchestra/pull/9410))
- [Site] Update dashboard with new info from endpoint (PR [#8964](https://github.com/vatesfr/xen-orchestra/pull/8964))
- [i18n] Update Czech, Danish, German, Spanish, Persian, Finnish, Italian, Japanese, Korean, Norwegian, Polish, Dutch, Portuguese (Brasil), Russian, Swedish and Ukrainian translations (PR [#9440](https://github.com/vatesfr/xen-orchestra/pull/9440))

### Bug fixes

- [Backup/immutability] Fix typo in sample config file (PR [#9444](https://github.com/vatesfr/xen-orchestra/pull/9444))

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [REST API] Close SSE connections when clients are too slow, to avoid increased memory consumption (PR [#9439](https://github.com/vatesfr/xen-orchestra/pull/9439))
- [REST API] `message` objects are no longer sent via the SSE when subscribing to the`alarm` collection (PR [#9439](https://github.com/vatesfr/xen-orchestra/pull/9439))
- [REST API] Do no longer create an `XO user authentication` task, when using an authentication token (PR [#9439](https://github.com/vatesfr/xen-orchestra/pull/9439))
- [Backup] ensure no snapshot are left unattended after a job (PR [#9434](https://github.com/vatesfr/xen-orchestra/pull/9434))
- [Backup] Fix replication leaving replica after partial incremental replication (PR [#9435](https://github.com/vatesfr/xen-orchestra/pull/9435))
- [REST API] Fix ISO not mounted when creating a VM from `/pools/:id/actions/create_vm` (PR [#9461](https://github.com/vatesfr/xen-orchestra/pull/9461))

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
- @xen-orchestra/rest-api patch
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server patch

<!--packages-end-->
