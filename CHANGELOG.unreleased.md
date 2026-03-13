> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [VM] Add possibility to remove a snapshot on snapshot tab (PR [#9749](https://github.com/vatesfr/xen-orchestra/pull/9749))
- [Pool/Hosts] Management IP is now always shown first and the IP column is renamed to "Management IP" (PR [#9747](https://github.com/vatesfr/xen-orchestra/pull/9747))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [xo-server] Fix VM-template still visible after deletion (PR [#9760](https://github.com/vatesfr/xen-orchestra/pull/9760))
- [xo-server-sdn-controller] Better traffic-rules synchronization related to VM lifecycle (PR [#9518](https://github.com/vatesfr/xen-orchestra/pull/9518))

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

- @xen-orchestra/web minor
- xo-server patch
- xo-server-sdn-controller minor

<!--packages-end-->
