> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM] Show distro icon for opensuse-microos [Forum#6965](https://xcp-ng.org/forum/topic/6965) (PR [#6746](https://github.com/vatesfr/xen-orchestra/pull/6746))
- [Backup] Display the VM name label in the log even if the VM is not currently connected
- [Backup] Display the SR name label in the log even if the SR is not currently connected
- [Import VM] Ability to import multiple VMs from ESXi (PR [#6718](https://github.com/vatesfr/xen-orchestra/pull/6718))
- [Backup/Advanced setting] Ability to add transfer limit per job (PRs [#6737](https://github.com/vatesfr/xen-orchestra/pull/6737), [#6728](https://github.com/vatesfr/xen-orchestra/pull/6728))
- [License] Show Pro Support status icon at host level (PR [#6633](https://github.com/vatesfr/xen-orchestra/pull/6633))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Backup/Restore] Fix restore via a proxy showing as interupted (PR [#6702](https://github.com/vatesfr/xen-orchestra/pull/6702))
- [REST API] Backup logs are now available at `/rest/v0/backups/logs` and `/rest/v0/restore/logs`
- [ESXI import] Fix failing imports when using non default datacenter name [Forum#59543](https://xcp-ng.org/forum/post/59543) PR [#6729](https://github.com/vatesfr/xen-orchestra/pull/6729)
- [Backup] Fix backup worker consuming too much memory and being killed by system during full VM backup to S3 compatible remote PR [#6732](https://github.com/vatesfr/xen-orchestra/pull/6732)
- [REST API] Backup jobs are now available at `/rest/v0/backups/jobs`
- [Plugin/perf-alert] Ignore special SRs (e.g. *XCP-ng Tools*, *DVD drives*, etc) as their usage is always 100% (PR [#6755](https://github.com/vatesfr/xen-orchestra/pull/6755))
- [S3 remote] Relax bucket checks in browser to improve experience on S3 compatible remote [Forum#60426](https://xcp-ng.org/forum/post/60426) (PR [#6757](https://github.com/vatesfr/xen-orchestra/pull/6757))

### Packages to release

> When modifying a package, add it here with its release type.
>
> The format is the following: `- $packageName $releaseType`
>
> Where `$releaseType` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> Keep this list alphabetically ordered to avoid merge conflicts

<!--packages-start-->

- @xen-orchestra/fs patch
- @xen-orchestra/vmware-explorer patch
- @xen-orchestra/backups minor
- xo-cli patch
- xo-server minor
- xo-server-perf-alert patch
- xo-web minor

<!--packages-end-->
