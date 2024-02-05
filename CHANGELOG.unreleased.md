> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Add `/groups` collection [Forum#70500](https://xcp-ng.org/forum/post/70500)
- [REST API] Add `/groups/:id/users` and `/users/:id/groups` collection [Forum#70500](https://xcp-ng.org/forum/post/70500)
- [REST API] Expose messages associated to XAPI objects at `/:collection/:object/messages`

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Import/VMWare] Fix `(Failure \"Expected string, got 'I(0)'\")` (PR [#7361](https://github.com/vatesfr/xen-orchestra/issues/7361))
- [Plugin/load-balancer] Fixing `TypeError: Cannot read properties of undefined (reading 'high')` happening when trying to optimize a host with performance plan [#7359](https://github.com/vatesfr/xen-orchestra/issues/7359) (PR [#7362](https://github.com/vatesfr/xen-orchestra/pull/7362))
- Changing the number of displayed items per page should send back to the first page [#7350](https://github.com/vatesfr/xen-orchestra/issues/7350)

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

- xo-server minor
- xo-server-load-balancer patch
- xo-web patch

<!--packages-end-->
