> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [System] Update system pages layout ([user feedback](https://feedback.vates.tech/posts/37/xo6-ui-very-messy-columns-width-in-vm-system-far-better-in-xo5)) (PR [#9746](https://github.com/vatesfr/xen-orchestra/pull/9746))
- [Encryption] Implement encryption and decryption feature for redis (PR [9735](https://github.com/vatesfr/xen-orchestra/pull/9735))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [REST] Fixed ignored parameters in request body due to a tsoa bug (see https://github.com/lukeautry/tsoa/pull/1858) (PR [#9793](https://github.com/vatesfr/xen-orchestra/pull/9793))
- **XO 5**:
  - [Job] Error while using vm.set with `cpuMask` in job view (PR [#9823](https://github.com/vatesfr/xen-orchestra/pull/9823))

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

- @xen-orchestra/fs minor
- @xen-orchestra/rest-api patch
- @xen-orchestra/web-core minor
- xo-server minor
- xo-server-sdn-controller patch

<!--packages-end-->
