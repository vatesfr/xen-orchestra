> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Auth/OIDC] Fix sign in with providers whose ID token only carries the minimal claims, as the OpenID specification requires once an access token is issued (e.g. SimpleSAMLphp, SATOSA): the username and the groups are then read from the userinfo endpoint (PR [#9648](https://github.com/vatesfr/xen-orchestra/pull/9648))

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
- @xen-orchestra/backups minor
- @xen-orchestra/qa-test patch
- @xen-orchestra/rest-api patch
- @xen-orchestra/web patch
- @xen-orchestra/web-core minor
- xo-server minor
- xo-server-auth-oidc patch
- xo-web minor

<!--packages-end-->
