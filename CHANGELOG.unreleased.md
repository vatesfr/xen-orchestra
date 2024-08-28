> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Add backup repository, storage repository, alarms, backups jobs and backups issues information in the `/rest/v0/dashboard` endpoint (PR [#7882](https://github.com/vatesfr/xen-orchestra/pull/7882), [#7904](https://github.com/vatesfr/xen-orchestra/pull/7904), [#7914](https://github.com/vatesfr/xen-orchestra/pull/7914), [#7908](https://github.com/vatesfr/xen-orchestra/pull/7908), [#7919](https://github.com/vatesfr/xen-orchestra/pull/7919))
- [SR/Disks] Show and edit the use of CBT (Change Block Tracking) [#7786](https://github.com/vatesfr/xen-orchestra/issues/7786) (PR [#7888](https://github.com/vatesfr/xen-orchestra/pull/7888))
- [Home] Add possibility to sort VMs by install time [#7902](https://github.com/vatesfr/xen-orchestra/issues/7902) (PR [#7910](https://github.com/vatesfr/xen-orchestra/pull/7910))
- **XO 6**:
  - [Tree view] Display running VMs count on pool and host items (PR [#7873](https://github.com/vatesfr/xen-orchestra/pull/7873))
  - [Dashboard] Add backup jobs statuses, backup repository information, storage repository information and patches statuses (PR [#7926](https://github.com/vatesfr/xen-orchestra/pull/7926), [#7927](https://github.com/vatesfr/xen-orchestra/pull/7927), [#7929](https://github.com/vatesfr/xen-orchestra/pull/7929), [#7930](https://github.com/vatesfr/xen-orchestra/pull/7930))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Self] Remove unit in CPU usage total count (PR [#7894](https://github.com/vatesfr/xen-orchestra/pull/7894))
- [Home/SR] Fix _Shared/Not shared_ sort
- [Home/VM] When sorted by _Start time_, move VMs with no value at the end
- [Import/VM Ware] Shows only SRs and networks of the selected pool (PR [#7905](https://github.com/vatesfr/xen-orchestra/pull/7905))
- [Backups] Work around XAPI not automatically updating VM's `allowed_operations` after backups [Forum#81327](https://xcp-ng.org/forum/post/81327) (PR [#7924](https://github.com/vatesfr/xen-orchestra/pull/7924))
- [REST API] Fix VDI export in raw format broken in XO 5.96.0
- [Import/VM Ware] Use the template settings from static_memory

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
- @xen-orchestra/lite minor
- @xen-orchestra/proxy patch
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server minor
- xo-web minor

<!--packages-end-->
