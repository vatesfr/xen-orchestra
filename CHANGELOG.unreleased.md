> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [RPU/Host] Ask for confirmation when start an RPU, shutdown/reboot an host or restart host toolstack with running backups on the pool (PR [6232](https://github.com/vatesfr/xen-orchestra/pull/6232))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

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
>
> The `gen-deps-list` script can be used to generate this list of dependencies
> Run `scripts/gen-deps-list.js --help` for usage

<!--packages-start-->

- @xen-orchestra/xapi major
- @xen-orchestra/mixins major
- xo-server minor
- @xen-orchestra/proxy patch
- xo-web minor
<!--packages-end-->
