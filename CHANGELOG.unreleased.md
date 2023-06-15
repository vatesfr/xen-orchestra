> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [XO Tasks] Abortion can now be requested, note that not all tasks will respond to it
- [Home/Pool] `No XCP-ng Pro support enabled on this pool` alert is considered a warning instead of an error (PR [#6849](https://github.com/vatesfr/xen-orchestra/pull/6849))
- [Plugin/auth-iodc] OpenID Connect scopes are now configurable and `profile` is included by default
- [Dashboard/Health] Button to copy UUID of an orphan VDI to the clipboard (PR [#6893](https://github.com/vatesfr/xen-orchestra/pull/6893))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Home/Host] Fix "isHostTimeConsistentWithXoaTime.then is not a function" (PR [#6896](https://github.com/vatesfr/xen-orchestra/pull/6896))

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
- xo-server-perf-alert patch
- xo-web minor

<!--packages-end-->
