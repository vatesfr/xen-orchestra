> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM/network] VIF's locking mode: improve tooltip messages [#4713](https://github.com/vatesfr/xen-orchestra/issues/4713) (PR [#5227](https://github.com/vatesfr/xen-orchestra/pull/5227))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Remotes/S3] Fix S3 backup of 50GB+ files [#5197](https://github.com/vatesfr/xen-orchestra/issues/5197) (PR[ #5242](https://github.com/vatesfr/xen-orchestra/pull/5242) )
- [New SR] Fix `Cannot read property 'trim' of undefined` error (PR [#5212](https://github.com/vatesfr/xen-orchestra/pull/5212))

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

- @xen-orchestra/fs patch
- xo-web minor
- xo-server patch
