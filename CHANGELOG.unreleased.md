> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [REST API] Expose `GET /backup-repositories/:id/health` and `POST /backup-repositories/:id/actions/benchmark` routes (PR [#9847](https://github.com/vatesfr/xen-orchestra/pull/9847))
- [sdn-controller] Add `POST /rest/v0/plugins/sdn-controller/networks/:id/actions/update_traffic_rule` and `POST /rest/v0/plugins/sdn-controller/vifs/:id/actions/update_traffic_rule` (PR [#9936](https://github.com/vatesfr/xen-orchestra/pull/9936))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Backups/replication] Fix error MEMORY_CONSTRAINT_VIOLATION_ORDER during replication (PR [#10034](https://github.com/vatesfr/xen-orchestra/pull/10034))

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
- @xen-orchestra/backups patch
- @xen-orchestra/proxy minor
- @xen-orchestra/rest-api minor
- xo-server minor
- xo-server-sdn-controller minor


<!--packages-end-->
