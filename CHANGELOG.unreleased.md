> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

- Ensure password is not logged in error messages when adding hosts to a pool (PR [#8369](https://github.com/vatesfr/xen-orchestra/pull/8369))

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Ability to delete a user (PR [#8283](https://github.com/vatesfr/xen-orchestra/pull/8283))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [xo-cli] Fix timeouts when using the legacy JSON-RPC API (e.g. exporting a VM)

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
- xen-api patch
- xo-cli patch
- xo-server minor

<!--packages-end-->
