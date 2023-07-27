> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [Backup/Restore] Button to open the raw log in the REST API (PR [#6936](https://github.com/vatesfr/xen-orchestra/pull/6936))
- [Netbox] New major version. BREAKING: in order for this new version to work, you need to assign the type `virtualization > vminterface` to the custom field `UUID` in your Netbox instance. [See documentation](https://xen-orchestra.com/docs/advanced.html#netbox). [#6038](https://github.com/vatesfr/xen-orchestra/issues/6038) [#6135](https://github.com/vatesfr/xen-orchestra/issues/6135) [#6024](https://github.com/vatesfr/xen-orchestra/issues/6024) [#6036](https://github.com/vatesfr/xen-orchestra/issues/6036) [Forum#6070](https://xcp-ng.org/forum/topic/6070) [Forum#6149](https://xcp-ng.org/forum/topic/6149) [Forum#6332](https://xcp-ng.org/forum/topic/6332) [Forum#6902](https://xcp-ng.org/forum/topic/6902) (PR [#6950](https://github.com/vatesfr/xen-orchestra/pull/6950))
  - Synchronize VM description
  - Synchronize VM platform
  - Fix duplicated VMs in Netbox after disconnecting one pool
  - Migrating a VM from one pool to another keeps VM data added manually
  - Fix largest IP prefix being picked instead of smallest
  - Fix synchronization not working if some pools are unavailable
  - Better error messages

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Incremental Backup & Replication] Attempt to work around HVM multiplier issues when creating VMs on older XAPIs (PR [#6866](https://github.com/vatesfr/xen-orchestra/pull/6866))
- [REST API] Fix VDI export when NBD is enabled
- [XO Config Cloud Backup] Improve wording about passphrase (PR [#6938](https://github.com/vatesfr/xen-orchestra/pull/6938))
- [Pool] Fix IPv6 handling when adding hosts
- [New SR] Send provided NFS version to XAPI when probing a share
- [Backup/exports] Show more information on error ` stream has ended with not enough data (actual: xxx, expected: 512)` (PR [#6940](https://github.com/vatesfr/xen-orchestra/pull/6940))

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
- @xen-orchestra/mixins minor
- @xen-orchestra/vmware-explorer minor
- @xen-orchestra/xapi major
- @vates/read-chunk minor
- complex-matcher patch
- xen-api patch
- xo-server patch
- xo-server-transport-xmpp patch
- xo-server-audit patch
- xo-server-netbox major
- xo-web minor

<!--packages-end-->
