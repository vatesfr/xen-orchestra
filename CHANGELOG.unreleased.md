> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [About] Show commit instead of version numbers for source users (PR [#6045](https://github.com/vatesfr/xen-orchestra/pull/6045))
- [Health] Display default SRs that aren't shared [#5871](https://github.com/vatesfr/xen-orchestra/issues/5871) (PR [#6033](https://github.com/vatesfr/xen-orchestra/pull/6033))
- [Pool,VM/advanced] Ability to change the suspend SR [#4163](https://github.com/vatesfr/xen-orchestra/issues/4163) (PR [#6044](https://github.com/vatesfr/xen-orchestra/pull/6044))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Tables/actions] Fix collapsed actions being clickable despite being disabled (PR [#6023](https://github.com/vatesfr/xen-orchestra/pull/6023))
- [Continuous Replication] Fix `could not find the base VM`

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

- xo-web minor
