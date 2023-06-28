> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [XO Tasks] Abortion can now be requested, note that not all tasks will respond to it
- [Home/Pool] `No XCP-ng Pro support enabled on this pool` alert is considered a warning instead of an error (PR [#6849](https://github.com/vatesfr/xen-orchestra/pull/6849))
- [Plugin/auth-iodc] OpenID Connect scopes are now configurable and `profile` is included by default
- [Dashboard/Health] Button to copy UUID of an orphan VDI to the clipboard (PR [#6893](https://github.com/vatesfr/xen-orchestra/pull/6893))
- [Kubernetes recipe] Add the possibility to choose the version for the cluster [#6842](https://github.com/vatesfr/xen-orchestra/issues/6842) (PR [#6880](https://github.com/vatesfr/xen-orchestra/pull/6880))
- [New VM] cloud-init drives are now bootable in a Windows VM (PR [#6889](https://github.com/vatesfr/xen-orchestra/pull/6889))
- [Backups] Add setting `backups.metadata.defaultSettings.diskPerVmConcurrency` in xo-server's configuration file to limit the number of disks transferred in parallel per VM, this is useful to avoid transfer overloading remote and Sr (PR [#6787](https://github.com/vatesfr/xen-orchestra/pull/6787))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Home/Host] Fix "isHostTimeConsistentWithXoaTime.then is not a function" (PR [#6896](https://github.com/vatesfr/xen-orchestra/pull/6896))
- [ESXi Import] was depending on an older unmaintened library that was downgrading the global security level of XO (PR [#6859](https://github.com/vatesfr/xen-orchestra/pull/6859))
- [Backup] Fix memory consumption when deleting _VHD directory_ incremental backups
- [Remote] Fix `remote is disabled` error when editing a disabled remote
- [Settings/Servers] Fix connectiong using an explicit IPv6 address
- [Backups/Health check] Use the right SR for health check during replication job (PR [#6902](https://github.com/vatesfr/xen-orchestra/pull/6902))
- [RRD stats] Improve RRD stats performance (PR [#6903](https://github.com/vatesfr/xen-orchestra/pull/6903))

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

- @vates/nbd-client patch
- @vates/task minor
- @xen-orchestra/backups minor
- @xen-orchestra/fs patch
- @xen-orchestra/mixins patch
- @vates/node-vsphere-soap major
- @xen-orchestra/vmware-explorer patch
- xen-api patch
- xo-cli minor
- xo-server minor
- xo-server-auth-oidc minor
- xo-server-perf-alert patch
- xo-web minor

<!--packages-end-->
