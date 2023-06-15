> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [XO Tasks] Abortion can now be requested, note that not all tasks will respond to it
- [Home/Pool] `No XCP-ng Pro support enabled on this pool` alert is considered a warning instead of an error (PR [#6849](https://github.com/vatesfr/xen-orchestra/pull/6849))
- [Plugin/auth-iodc] OpenID Connect scopes are now configurable and `profile` is included by default
- [Home/Host, Pool] Add tooltip on alert icons (PR [#6895](https://github.com/vatesfr/xen-orchestra/pull/6895))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

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
- @vates/task minor
- xo-server-auth-oidc minor
- xo-web minor

<!--packages-end-->
