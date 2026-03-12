> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [MCP] Support token authentication via `XO_TOKEN` environment variable as an alternative to username/password (PR [#9577](https://github.com/vatesfr/xen-orchestra/pull/9577))
- [Replication] Reuse the same VM as an incremental replication target (PR [#9524](https://github.com/vatesfr/xen-orchestra/pull/9524))
- [S3] add configuration for max/minPartSize and maxPartNumber in the API (PR [#9561](https://github.com/vatesfr/xen-orchestra/pull/9561))
- [REST API] Expose `/rest/v0/vms/:id/actions/clone` (PR [#9453](https://github.com/vatesfr/xen-orchestra/pull/9453))
- [REST API] Expose `DELETE /rest/v0/srs/:id` (PR [#9464](https://github.com/vatesfr/xen-orchestra/pull/9464))
- 
### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup] Reduce backup memory consumption (PR [#9557](https://github.com/vatesfr/xen-orchestra/pull/9557))
- [VM/New] VCPU was ignored [Forum#11954](https://xcp-ng.org/forum/topic/11954/unable-to-define-count-of-cpus-during-vm-create) (PR [#9591](https://github.com/vatesfr/xen-orchestra/pull/9591))

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

- @vates/generator-toolbox patch
- @vates/types minor
- @xen-orchestra/backups minor
- @xen-orchestra/disk-transform patch
- @xen-orchestra/fs minor
- @xen-orchestra/mcp minor
- @xen-orchestra/rest-api minor
- @xen-orchestra/web patch
- @xen-orchestra/xapi minor
- xo-server minor

<!--packages-end-->
