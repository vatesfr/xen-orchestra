> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Expose `/rest/v0/proxies` and `/rest/v0/proxies/<proxy-id>` (PR [#8920](https://github.com/vatesfr/xen-orchestra/pull/8920))
- [V2V] Add task to track library installation progress and error (PR [#8927](https://github.com/vatesfr/xen-orchestra/pull/8927))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [XO6/New VM] Display only ISO VDIs for the ISO input (PR [#8922](https://github.com/vatesfr/xen-orchestra/pull/8922))
- [Backups] Display a warning in backup logs when delta replication falls back to a full replication (PR [#8926](https://github.com/vatesfr/xen-orchestra/pull/8926))

- [V2V] fix resuming importing retransfering the full VM (PR [#8928](https://github.com/vatesfr/xen-orchestra/pull/8928))
- [V2V] Fix vddk check icon (PR [#8927](https://github.com/vatesfr/xen-orchestra/pull/8927))

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

- @vates/types minor
- @xen-orchestra/backups patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/vmware-explorer patch
- @xen-orchestra/web patch
- @xen-orchestra/xapi patch
- xo-server minor
- xo-web minor

<!--packages-end-->
