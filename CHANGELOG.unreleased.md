> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [API] `proxy.register` accepts `vmUuid` parameter which can be used when not connected to the XAPI containing the XO Proxy VM
- [Proxy] Can now upgrade proxies in VMs not connected to XO
- [REST API] Expose VM snapshots and templates
- [REST API] Expose VDI snapshots
- [Select license] Display product type in the options (PR [#6512](https://github.com/vatesfr/xen-orchestra/pull/6512))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Pool] Add tooltip on "no XCP-ng Pro support" warning icon (PR [#6505](https://github.com/vatesfr/xen-orchestra/pull/6505))
- [Backup] Respect HTTP proxy setting when connecting to XCP-ng/XenServer pools
- [Dashboard/Health] Fix `an error has occurred` in case of unknown default SR (PR [#6508](https://github.com/vatesfr/xen-orchestra/pull/6508))

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

- xo-server minor
- xo-web minor

<!--packages-end-->
