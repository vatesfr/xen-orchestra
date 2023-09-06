> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [User] _Forget all connection tokens_ button should not delete other users' tokens, even when current user is an administrator (PR [#7014](https://github.com/vatesfr/xen-orchestra/pull/7014))
- [Settings/Servers] Fix connection to old XenServer hosts using XML-RPC protocol (broken in XO 5.85.0)
- [PIF] Remove empty parenthesis "()" when there's no extra info to show next to the PIF's name

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

- xen-api patch
- xo-server minor
- xo-web patch

<!--packages-end-->
