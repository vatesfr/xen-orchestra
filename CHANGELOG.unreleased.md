> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Health] Do not take as consideration duplicated mac address from CR VM's (PR [#5916](https://github.com/vatesfr/xen-orchestra/pull/5916))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [SSH keys] Allow SSH key to be broken anywhere to avoid breaking page formatting (Thanks @tstivers1990!) [#5891](https://github.com/vatesfr/xen-orchestra/issues/5891) (PR [#5892](https://github.com/vatesfr/xen-orchestra/pull/5892))
- [Netbox] Handle nested prefixes by always assigning an IP to the smallest prefix it matches (PR [#5908](https://github.com/vatesfr/xen-orchestra/pull/5908))
- [Netbox] Better handling and error messages when encountering issues due to UUID custom field not being configured correctly [#5905](https://github.com/vatesfr/xen-orchestra/issues/5905) [#5806](https://github.com/vatesfr/xen-orchestra/issues/5806) [#5834](https://github.com/vatesfr/xen-orchestra/issues/5834) (PR [#5909](https://github.com/vatesfr/xen-orchestra/pull/5909))

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

- vhd-lib minor
- xo-server-netbox patch
- xo-server patch
- xo-web patch
