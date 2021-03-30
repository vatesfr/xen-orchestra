> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

- [Host/Load-balancer] Add a new anti-affinity mode (PR [#5652](https://github.com/vatesfr/xen-orchestra/pull/5652))
- [Plugins/perf-alert] Ability to choose all hosts, VMs and SRs [#2987](https://github.com/vatesfr/xen-orchestra/issues/2987) (PR [#5692](https://github.com/vatesfr/xen-orchestra/pull/5692))

### Bug fixes

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

- @xen-orchestra/xapi minor
- @xen-orchestra/backups minor
- xo-server-load-balancer minor
- xo-server-perf-alert minor
- xo-server patch
- xo-web minor
