> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Dashboad/Health] List all VDIs that need coalescing (PR [#6120](https://github.com/vatesfr/xen-orchestra/pull/6120))
- [Menu] Show a warning icon when some SRs have more than 10 VDIs to coalesce (PR [#6120](https://github.com/vatesfr/xen-orchestra/pull/6120))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Self service] Change identifiers used for VM templates to avoid them from being removed on XCP-ng upgrade

### Packages to release

> Packages will be released in the order they are here, therefore, they should
> be listed by inverse order of dependency.
>
> Rule of thumb: add packages on top.
>
> The format is the following: - `$packageName` `$version`
>
> Where `$version` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> In case of conflict, the highest (lowest in previous list) `$version` wins.

- @vates/predicates major
- @xen-orchestra/mixins minor
- @xen-orchestra/backups patch
- @xen-orchestra/proxy patch
- xo-cli minor
- xo-server minor
- xo-web minor
