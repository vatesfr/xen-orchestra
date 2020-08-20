> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM] Ability to protect VM from accidental shutdown [#4773](https://github.com/vatesfr/xen-orchestra/issues/4773)
- [VM/Network] Ability to set VIF TX checksumming [#5095](https://github.com/vatesfr/xen-orchestra/issues/5095) (PR [#5182](https://github.com/vatesfr/xen-orchestra/pull/5182))
- [Proxy] Improve health check error messages [#5161](https://github.com/vatesfr/xen-orchestra/issues/5161) (PR [#5191](https://github.com/vatesfr/xen-orchestra/pull/5191))
- [VM/network] Ability to change a VIF's locking mode [#4713](https://github.com/vatesfr/xen-orchestra/issues/4713) (PR [#5188](https://github.com/vatesfr/xen-orchestra/pull/5188))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Proxy/deploy] Fix `no such proxy ok` error on a failure trial start (PR [#5196](https://github.com/vatesfr/xen-orchestra/pull/5196))
- [VM/snapshots] Fix redirection when creating a VM from a snapshot (PR [#5213](https://github.com/vatesfr/xen-orchestra/pull/5213))
- [User] Fix `Incorrect password` error when changing password [#5218](https://github.com/vatesfr/xen-orchestra/issues/5218) (PR [#5221](https://github.com/vatesfr/xen-orchestra/pull/5221))
- [Audit] Obfuscate sensitive data in `user.changePassword` action's records [#5219](https://github.com/vatesfr/xen-orchestra/issues/5219) (PR [#5220](https://github.com/vatesfr/xen-orchestra/pull/5220))
- [SDN Controller] Fix `Cannot read property '$network' of undefined` error at the network creation (PR [#5217](https://github.com/vatesfr/xen-orchestra/pull/5217))

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
- xo-server-sdn-controller patch
- xo-server minor
- xo-web minor
