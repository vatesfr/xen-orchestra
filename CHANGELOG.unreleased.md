> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Netbox] Add information about a failed request to the error log to help better understand what happened [#5834](https://github.com/vatesfr/xen-orchestra/issues/5834) (PR [#5842](https://github.com/vatesfr/xen-orchestra/pull/5842))
- [VM/console] Ability to rescan ISO SRs (PR [#5841](https://github.com/vatesfr/xen-orchestra/pull/5841))
- [SR/disks] Display base copies' active VDIs (PR [#5826](https://github.com/vatesfr/xen-orchestra/pull/5826))
- [Host] When supported, use pool's default migration network to evacuate host [#5802](https://github.com/vatesfr/xen-orchestra/issues/5802)

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM/disks] Fix `an error has occured` when self service user was on VM disk view (PR [#5841](https://github.com/vatesfr/xen-orchestra/pull/5841))

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

- xo-server-netbox minor
- xo-web minor
- xo-server minor
