> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Netbox] Synchronize VM tags [#5899](https://github.com/vatesfr/xen-orchestra/issues/5899) [Forum#6902](https://xcp-ng.org/forum/topic/6902) (PR [#6957](https://github.com/vatesfr/xen-orchestra/pull/6957))
- [REST API] Add support for `filter` and `limit` parameters to `backups/logs` and `restore/logs` collections [Forum#64789](https://xcp-ng.org/forum/post/64789)
- [Pool/Advanced] Ability to set a crash dump SR [#5060](https://github.com/vatesfr/xen-orchestra/issues/5060) (PR [#6973](https://github.com/vatesfr/xen-orchestra/pull/6973))
- [Plugin/transport-email] Local hostname can now be configured [Forum#7579](https://xcp-ng.org/forum/topic/7579)

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [LDAP] Mark the _Id attribute_ setting as required
- [Incremental Replication] Fix `TypeError: Cannot read properties of undefined (reading 'uuid') at #isAlreadyOnHealthCheckSr` [Forum#7492](https://xcp-ng.org/forum/topic/7492) (PR [#6969](https://github.com/vatesfr/xen-orchestra/pull/6969))
- [File Restore] Increase timeout from one to ten minutes when restoring through XO Proxy
- [Home/VMs] Filtering with a UUID will no longer show other VMs on the same host/pool
- [Jobs] Fixes `invalid parameters` when editing [Forum#64668](https://xcp-ng.org/forum/post/64668)
- [Smart reboot] Fix cases where VMs remained in a suspended state (PR [#6980](https://github.com/vatesfr/xen-orchestra/pull/6980))
- [Backup/Health dashboard] Don't show mirrored VMs as detached backups (PR [#7000](https://github.com/vatesfr/xen-orchestra/pull/7000))
- [Netbox] Fix `the address has neither IPv6 nor IPv4 format` error [Forum#7625](https://xcp-ng.org/forum/topic/7625) (PR [#6990](https://github.com/vatesfr/xen-orchestra/pull/6990))

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

- @xen-orchestra/backups patch
- @xen-orchestra/mixins minor
- @xen-orchestra/xapi patch
- xen-api patch
- xo-server minor
- xo-server-auth-ldap patch
- xo-server-transport-email minor
- xo-server-netbox minor
- xo-web minor

<!--packages-end-->
