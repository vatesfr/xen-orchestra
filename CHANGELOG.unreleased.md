> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [API/backupNg.getLogs] Fix `after` parameter handling when `limit` parameter is not provided
- [New/SR] Fix create button never appearing for `smb iso` SR [#7355](https://github.com/vatesfr/xen-orchestra/issues/7355), [Forum#8417](https://xcp-ng.org/forum/topic/8417) (PR [#7405](https://github.com/vatesfr/xen-orchestra/pull/7405))
- [Editable text] Make sure the text is still clickable/editable if the content is a single white space [Forum#8466](https://xcp-ng.org/forum/topic/8466) (PR [#7411](https://github.com/vatesfr/xen-orchestra/pull/7411))

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

- xo-server patch
- xo-web patch

<!--packages-end-->
