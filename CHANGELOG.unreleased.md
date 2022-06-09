> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- Show raw errors to administrators instead of _unknown error from the peer_ (PR [#6260](https://github.com/vatesfr/xen-orchestra/pull/6260))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [New SR] Fix `method.startsWith is not a function` when creating an _ext_ SR
- Import VDI content now works when there is a HTTP proxy between XO and the host (PR [#6261](https://github.com/vatesfr/xen-orchestra/pull/6261))
- [Backup] Fix `undefined is not iterable (cannot read property Symbol(Symbol.iterator))` on XS 7.0.0
- [Backup] Ensure a warning is shown if a target preparation step fails (PR [#6266](https://github.com/vatesfr/xen-orchestra/pull/6266))
- [OVA Export] Avoid creating a zombie task (PR [#6267](https://github.com/vatesfr/xen-orchestra/pull/6267))
- [OVA Export] Increase speed by lowering compression to acceptable level (PR [#6267](https://github.com/vatesfr/xen-orchestra/pull/6267))

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

<!--packages-start-->

- @xen-orchestra/backups minor
- @xen-orchestra/proxy-cli minor
- xen-api patch
- xo-cli minor
- @xen-orchestra/xapi minor
- xo-vmdk-to-vhd patch
- xo-server minor
- xo-web patch

<!--packages-end-->
