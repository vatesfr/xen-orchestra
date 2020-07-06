> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Backup] Better resolution of the "last run log" quick access (PR [#5141](https://github.com/vatesfr/xen-orchestra/pull/5141))
- [Patches] Don't check patches on halted XCP-ng hosts (PR [#5140](https://github.com/vatesfr/xen-orchestra/pull/5140))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Proxy] Don't use configured HTTP proxy to connect to XO proxy
- [Smart backup/edit] Fix "Excluded VMs tags" being reset to the default ones (PR [#5136](https://github.com/vatesfr/xen-orchestra/pull/5136))

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

- xo-server patch
- xo-web minor
