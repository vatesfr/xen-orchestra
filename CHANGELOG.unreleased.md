> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [New network] Ability for pool's admin to create a new network within the pool (PR [#5873](https://github.com/vatesfr/xen-orchestra/pull/5873))
- [Netbox] Synchronize primary IPv4 and IPv6 addresses [#5633](https://github.com/vatesfr/xen-orchestra/issues/5633) (PR [#5879](https://github.com/vatesfr/xen-orchestra/pull/5879))
- [Host] Add warning in case of unmaintained host version [#5840](https://github.com/vatesfr/xen-orchestra/issues/5840) (PR [#5847](https://github.com/vatesfr/xen-orchestra/pull/5847))
- [Backup] Use default migration network if set when importing/exporting VMs/VDIs (PR [#5883](https://github.com/vatesfr/xen-orchestra/pull/5883))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM/network] Fix an issue where multiple IPs would be displayed in the same tag when using old Xen tools. This also fixes Netbox's IP synchronization for the affected VMs. (PR [#5860](https://github.com/vatesfr/xen-orchestra/pull/5860))
- [LDAP] Handle groups with no members (PR [#5862](https://github.com/vatesfr/xen-orchestra/pull/5862))
- Fix empty button on small size screen (PR [#5874](https://github.com/vatesfr/xen-orchestra/pull/5874))
- [Host] Fix `Cannot read property 'other_config' of undefined` error when enabling maintenance mode (PR [#5875](https://github.com/vatesfr/xen-orchestra/pull/5875))

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

- xen-api minor
- @xen-orchestra/xapi minor
- @xen-orchestra/backups minor
- @xen-orchestra/fs minor
- @xen-orchestra/log minor
- @xen-orchestra/mixins patch
- xo-server-auth-ldap patch
- xo-server-netbox minor
- xo-server minor
- xo-web minor
