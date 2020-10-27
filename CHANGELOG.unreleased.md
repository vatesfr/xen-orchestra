> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Host/Advanced] Display installed certificates [#5134](https://github.com/vatesfr/xen-orchestra/issues/5134) (PR [#5319](https://github.com/vatesfr/xen-orchestra/pull/5319))
- [VM/network] Allow Self Service users to change a VIF's network [#5020](https://github.com/vatesfr/xen-orchestra/issues/5020) (PR [#5203](https://github.com/vatesfr/xen-orchestra/pull/5203))
- [New SSH key] Show warning when the SSH key already exists (PR [#5329](https://github.com/vatesfr/xen-orchestra/pull/5329))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Host] Fix power state stuck on busy after power off [#4919](https://github.com/vatesfr/xen-orchestra/issues/4919) (PR [#5288](https://github.com/vatesfr/xen-orchestra/pull/5288))
- [VM/Network] Don't allow users to change a VIF's locking mode if they don't have permissions on the network (PR [#5283](https://github.com/vatesfr/xen-orchestra/pull/5283))
- [Backup/overview] Add tooltip on the running backup job button (PR [#5325 ](https://github.com/vatesfr/xen-orchestra/pull/5325))
- [VM] Show snapshot button in toolbar for Self Service users (PR [#5324](https://github.com/vatesfr/xen-orchestra/pull/5324))

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
- @xen-orchestra/audit-core minor
- xo-server-audit minor
- xo-web minor
- xo-server minor
