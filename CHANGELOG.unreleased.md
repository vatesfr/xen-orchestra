> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [VM/Advanced] Warning message when enabling Windows update tools [#6627](https://github.com/vatesfr/xen-orchestra/issues/6627) (PR [#6681](https://github.com/vatesfr/xen-orchestra/issues/6681))
- [Continuous Replication] : add HealthCheck support to Continuous Replication (PR [#6668](https://github.com/vatesfr/xen-orchestra/pull/6668))
- [Plugin/auth-oidc] [OpenID Connect](<https://en.wikipedia.org/wiki/OpenID#OpenID_Connect_(OIDC)>) authentication plugin [#6641](https://github.com/vatesfr/xen-orchestra/issues/6641) (PR [#6684](https://github.com/vatesfr/xen-orchestra/issues/6684))
- [REST API] Possibility to start, shutdown, reboot and snapshot VMs
- [Import VM] Ability to import a VM from ESXi (PR [#6663](https://github.com/vatesfr/xen-orchestra/pull/6663))
- [Backup Metadata] Add pool selection to metadata restoration (PR [#6670](https://github.com/vatesfr/xen-orchestra/pull/6670))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [xo-cli] Fix `write EPIPE` error when used with piped output is closed (e.g. like `| head`) [#6680](https://github.com/vatesfr/xen-orchestra/issues/6680)
- [VM] Show distro icon for openSUSE [Forum#6965](https://xcp-ng.org/forum/topic/6965)
- [ESXI import] Handle listing more than 100 VMs

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

- @xen-orchestra/backups minor
- @xen-orchestra/fs patch
- @xen-orchestra/vmware-explorer minor
- xo-cli minor
- xo-server minor
- xo-server-auth-oidc minor
- xo-web minor

<!--packages-end-->
