> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [i18n] Add Arabic and update Czech, Dutch, Finnish, Portuguese (Brasil), Slovak and Swedish translations (PR [#10181](https://github.com/vatesfr/xen-orchestra/pull/10181))
- [XO6/Backups] Add header title on backup job detail page (PR [#10303](https://github.com/vatesfr/xen-orchestra/pull/10303))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [sdn-controller] Fix `update_traffic_rule` keeping the previous port: `newRule` is a partial update and a field sent as `null` is now removed from the rule (PR [#10307](https://github.com/vatesfr/xen-orchestra/pull/10307))
- [Backup] No longer create a `cache.json.gz` file on immutable/S3 remote during cleanup, which could not be deleted afterwards and stayed billed forever


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

- @vates/types major
- @xen-orchestra/backup-archive minor
- @xen-orchestra/backups patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server-sdn-controller minor

<!--packages-end-->
