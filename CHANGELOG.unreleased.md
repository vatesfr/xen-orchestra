> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Backups] Health check eligibility, full/incremental scheduling, and mirror job VM selection can now be driven by complex-matcher expressions (PR [#10064](https://github.com/vatesfr/xen-orchestra/pull/10064))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [REST API] Fix `/users/:id/authentication_tokens` sometimes did not return the token used to make the request (PR [#10233](https://github.com/vatesfr/xen-orchestra/pull/10233))
- [XO server] Fix a random behavior regarding `coresPerSocket` update (PR [#10201](https://github.com/vatesfr/xen-orchestra/pull/10201))

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
- @xen-orchestra/backup-archive patch
- @xen-orchestra/backups minor
- @xen-orchestra/web patch
- xo-server minor

<!--packages-end-->
