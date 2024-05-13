> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Support exporting VM in OVA format

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Console] Fix support of consoles behind an HTTP/HTTPS proxy [Forum#76935](https://xcp-ng.org/forum/post/76935')
- [Rolling Pool Update] Fixed RPU failing to install patches on hosts (and still appearing as successfull) (PR [#7640](https://github.com/vatesfr/xen-orchestra/pull/7640))

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

<!--packages-end-->
