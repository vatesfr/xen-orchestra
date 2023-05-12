> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Import/VM/From VMware] Fix `Property description must be an object: undefined` [Forum#61834](https://xcp-ng.org/forum/post/61834) [Forum#61900](https://xcp-ng.org/forum/post/61900)
- [Sorted table] In collapsed actions, a spinner is displayed during the action time

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

- @vates/task patch
- xo-server minor
- xo-web patch

<!--packages-end-->
