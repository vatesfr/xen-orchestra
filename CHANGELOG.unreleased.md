> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Ability to delete a user (PR [#8283](https://github.com/vatesfr/xen-orchestra/pull/8283))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Plugin/audit] Do not log getBiosInfo and getSmartctlHealth API calls [Forum#89777](https://xcp-ng.org/forum/post/89777) (PR [#8353](https://github.com/vatesfr/xen-orchestra/pull/8353))

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

- @vates/types patch
- xo-server minor
- xo-server-audit patch

<!--packages-end-->
