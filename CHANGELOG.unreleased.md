> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Ability to pass a cloud configuration when creating VM (For Cloud-Init template) (PR [#8070](https://github.com/vatesfr/xen-orchestra/pull/8070))
- [New/VM] cloud-init template variable `%` is replaced by `{index}` to avoid interfering with [Jinja templating](https://jinja.palletsprojects.com/) [Forum#84696](https://xcp-ng.org/forum/post/84696)
  - To avoid breaking existing workflows, `%` still works when _Multiple VMs_ is enabled but is deprecated.
- [Settings/ACLs] Ability to filter objects by tags (PR [#8068](https://github.com/vatesfr/xen-orchestra/pull/8068))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [V2V] Fix failing transfer at the power off phase (PR [#7839](https://github.com/vatesfr/xen-orchestra/pull/7839))

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

- @vates/task minor
- @xen-orchestra/web-core minor
- @xen-orchestra/xapi minor
- xen-api minor
- xo-server minor
- xo-web minor

<!--packages-end-->
