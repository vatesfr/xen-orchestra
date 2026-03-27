> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [QA Test] Add end-to-end QA test suite `@xen-orchestra/qa-test` for VM, backup and export testing (PR [#9626](https://github.com/vatesfr/xen-orchestra/pull/9626))
- [Netbox] Use platform hierarchy to assign versioned OS names (e.g. "Debian 12" instead of "Debian") when the major version is known (requires Netbox >= 4.4) #7773 (PR [#9644](https://github.com/vatesfr/xen-orchestra/pull/9644))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

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

- xo-server-netbox minor

<!--packages-end-->
