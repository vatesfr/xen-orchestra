> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Backup/Restore] Button to open the raw log in the REST API (PR [#6936](https://github.com/vatesfr/xen-orchestra/pull/6936))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Incremental Backup & Replication] Attempt to work around HVM multiplier issues when creating VMs on older XAPIs (PR [#6866](https://github.com/vatesfr/xen-orchestra/pull/6866))
- [REST API] Fix VDI export when NBD is enabled
- [XO Config Cloud Backup] Improve wording about passphrase (PR [#6938](https://github.com/vatesfr/xen-orchestra/pull/6938))
- [Pool] Fix IPv6 handling when adding hosts

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

- @vates/fuse-vhd major
- @vates/nbd-client major
- @vates/node-vsphere-soap major
- @xen-orchestra/backups minor
- @xen-orchestra/fs patch
- @xen-orchestra/vmware-explorer minor
- @xen-orchestra/xapi major
- complex-matcher patch
- xen-api patch
- xo-server patch
- xo-server-transport-xmpp patch
- xo-server-audit patch
- xo-web minor

<!--packages-end-->
