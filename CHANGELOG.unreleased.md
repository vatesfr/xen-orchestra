> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Delta Backup] Use [NBD](https://en.wikipedia.org/wiki/Network_block_device) to download disks (PR [#6461](https://github.com/vatesfr/xen-orchestra/pull/6461))
- [License] Possibility to bind XCP-ng license to hosts at pool level (PR [#6453](https://github.com/vatesfr/xen-orchestra/pull/6453))
- [New VM] Ability to destroy the cloud configuration disk after the first boot [#6438](https://github.com/vatesfr/xen-orchestra/issues/6438) (PR [#6486](https://github.com/vatesfr/xen-orchestra/pull/6486))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Licenses] Remove "Bind license" button for proxies whose corresponding VM cannot be found (PR [#6472](https://github.com/vatesfr/xen-orchestra/pull/6472))

### Packages to release

> When modifying a package, add it here with its release type.
>
> The format is the following: - `$packageName` `$releaseType`
>
> Where `$releaseType` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> Keep this list alphabetically ordered to avoid merge conflicts

<!--packages-start-->

- xo-web minor

<!--packages-end-->
