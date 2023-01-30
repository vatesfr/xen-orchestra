> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Enhancements

> Users must be able to say: “Nice enhancement, I'm eager to test it”

- [REST API] Expose `residentVms` property on hosts objects
- [VM/Advanced] Clarify _Windows Update_ label [#6628](https://github.com/vatesfr/xen-orchestra/issues/6628) (PR [#6632](https://github.com/vatesfr/xen-orchestra/pull/6632))
- [REST API] Add support to destroy VMs and VDIs
- [VM/Advanced] Add configuration flag for _Viridian_ platform [#6572](https://github.com/vatesfr/xen-orchestra/issues/6572) (PR [#6631](https://github.com/vatesfr/xen-orchestra/pull/6631))
- [Licenses] Makes `id` and `boundObjectId` copyable (PR [#6634](https://github.com/vatesfr/xen-orchestra/pull/6634))
- [REST API] The raw content of a VDI can be downloaded directly
- [Kubernetes recipe] Add the possibility to create the cluster with a static network configuration (PR [#6598](https://github.com/vatesfr/xen-orchestra/pull/6598))
- [Network/NBD] Add the possibility to add and change the NBD connection associated to a Network (PR [#6646](https://github.com/vatesfr/xen-orchestra/pull/6646))

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Ova export] Better computation of overprovisioning for very sparse disks (PR [#6639](https://github.com/vatesfr/xen-orchestra/pull/6639))

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

- xo-web minor

<!--packages-end-->
