> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [REST API/V2V] `POST /rest/v0/v2v/actions/inventory` reads the inventory of a vCenter or ESXi (datacenters, clusters, hosts, datastores, networks and VMs with their disks and network cards), and `POST /rest/v0/v2v/actions/start` imports a list of VMs into a pool, resuming partial imports with a delta. Restricted to administrators, credentials are never stored

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

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
- @xen-orchestra/rest-api minor
- @xen-orchestra/vmware-explorer minor
- @xen-orchestra/web-core minor
- xo-server minor

<!--packages-end-->
