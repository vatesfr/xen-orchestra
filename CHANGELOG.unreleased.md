> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [i18n] Add Persian translation (based on the contribution made by [@Jokar-xen](https://github.com/Jokar-xen)) (PR [#7775](https://github.com/vatesfr/xen-orchestra/pull/7775))
- [i18n] Improve Russian translation (Thanks [@TristisOris](https://github.com/TristisOris)!) (PR [#7807](https://github.com/vatesfr/xen-orchestra/pull/7807))
- [REST API] Expose XO6 dashboard informations at the `/rest/v0/dashboard` endpoint (PR [#7823](https://github.com/vatesfr/xen-orchestra/pull/7823))
- [VM/Advanced] Possibility to manually [_Coalesce Leaf_](https://docs.xenserver.com/en-us/xenserver/8/storage/manage.html#reclaim-space-by-using-the-offline-coalesce-tool) [#7757](https://github.com/vatesfr/xen-orchestra/issues/7757) (PR [#7810](https://github.com/vatesfr/xen-orchestra/pull/7810))
- [i18n] Add Swedish translation (Thanks [@cloudrootab](https://github.com/cloudrootab)!) [#7844](https://github.com/vatesfr/xen-orchestra/pull/7844)
- [Plugin/backup-reports] Show more information of backups, including NBD and CBT usage (PR [#7815](https://github.com/vatesfr/xen-orchestra/pull/7815))
- [Backups] Adding an option to avoid sending reports for skipped backups (e.g. no matching VMs, unhealthy VDI chains, etc.) (PR [#7832](https://github.com/vatesfr/xen-orchestra/pull/7832))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [VM/Advanced] Fix `not enough permission` when attaching PCIs [#9260](https://xcp-ng.org/forum/topic/9260/attach-pcis-not-enough-permissions) (PR [#7793](https://github.com/vatesfr/xen-orchestra/pull/7793))
- [V2V] Fix `Cannot read properties of undefined (reading 'committed')` when listing importable VM (PR [#7840](https://github.com/vatesfr/xen-orchestra/pull/7840))

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

- @xen-orchestra/vmware-explorer patch
- @xen-orchestra/xapi minor
- xen-api minor
- xo-server minor
- xo-server-backup-reports minor
- xo-web minor

<!--packages-end-->
