> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [OVA import] improve OVA import error reporting (PR [#5797](https://github.com/vatesfr/xen-orchestra/pull/5797))
- [Backup] Distinguish error messages between cancelation and interrupted HTTP connection
- [Jobs] Add `host.emergencyShutdownHost` to the list of methods that jobs can call (PR [#5818](https://github.com/vatesfr/xen-orchestra/pull/5818))
- [Host/Load-balancer] Log vm and host names when a VM is migrated + category (density, performance, ...) (PR [#5808](https://github.com/vatesfr/xen-orchestra/pull/5808))
- [VM/disks] Ability to rescan ISO SRs (PR [#5814](https://github.com/vatesfr/xen-orchestra/pull/5814))
- [VM/snapshots] Identify VM's current snapshot with an icon next to the snapshot's name (PR [#5824](https://github.com/vatesfr/xen-orchestra/pull/5824))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [IPs] Handle space-delimited IP address format provided by outdated guest tools [5801](https://github.com/vatesfr/xen-orchestra/issues/5801) (PR [5805](https://github.com/vatesfr/xen-orchestra/pull/5805))
- [API/pool.listPoolsMatchingCriteria] fix `unknown error from the peer` error (PR [5807](https://github.com/vatesfr/xen-orchestra/pull/5807))
- [Backup] Limit number of connections to hosts, which should reduce the occurences of `ECONNRESET`
- [Plugins/perf-alert] All mode: only selects running hosts and VMs (PR [5811](https://github.com/vatesfr/xen-orchestra/pull/5811))
- [New VM] Fix summary section always showing "0 B" for RAM (PR [#5817](https://github.com/vatesfr/xen-orchestra/pull/5817))
- [Backup/Restore] Fix _start VM after restore_ [5820](https://github.com/vatesfr/xen-orchestra/issues/5820)
- [Netbox] Fix a bug where some devices' IPs would get deleted from Netbox (PR [#5821](https://github.com/vatesfr/xen-orchestra/pull/5821))

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

- vhd-lib feat
- vhd-cli feat
- @xen-orchestra/backups feat
- xo-server-netbox patch
- xo-server-perf-alert patch
- xo-server-load-balancer minor
- xo-server patch
- xo-web minor
