> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Import/VMWare] Fix `Error: task has been destroyed before completion` with XVA import [Forum#70513](https://xcp-ng.org/forum/post/70513)
- [Import/VM] Fix `UUID_INVALID(VM, OpaqueRef:...)` error when importing from URL
- [Proxies] Fix `xapi.getOrWaitObject is not a function` is not a function during deployment
- [REST API] Fix empty object's tasks list
- [REST API] Fix incorrect `href` in `/:collection/:object/tasks`

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

- @xen-orchestra/immutable-backups patch
- @xen-orchestra/xva patch
- xo-server patch

<!--packages-end-->
