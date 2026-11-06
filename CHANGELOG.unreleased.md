> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Pool/Advanced] Live vCPU scaling (opt-in): VMs created from a template in the pool get a vCPU maximum (16 by default), so vCPUs can be added later while they run, without a shutdown. Capped at creation by the physical cores of the smallest host, so the VMs can start anywhere in the pool even with SMT turned off. Not applied to Windows VMs or to existing VMs. Linux guests must bring added vCPUs online: Ubuntu, Rocky and AlmaLinux do, Debian needs a udev rule. A replica or restore on a pool with smaller hosts keeps the maximum and may not start there
- [VM] Lowering the vCPUs of a running Windows VM is now refused: Windows kept running the removed vCPUs while XAPI reported the lower count
- [REST API] `PATCH /pools/{id}` with `vcpusMaxHeadroom` to set live vCPU scaling
- [XO6/Pool/System] Live vCPU scaling can be viewed and edited, showing the maximum new VMs actually get on this pool
- [XO6/New VM] The vCPUs field says up to how many vCPUs the VM will be able to add while it runs

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [XO6/Pools] Pool side panel now shows the same pool name, UUID and icon as the pools table, and keeps the pool card when the pool is disconnected or unreachable (PR [#10714](https://github.com/vatesfr/xen-orchestra/pull/10714))

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
- @xen-orchestra/acl minor
- @xen-orchestra/backups minor
- @xen-orchestra/qa-test patch
- @xen-orchestra/rest-api minor
- @xen-orchestra/web minor
- @xen-orchestra/web-core minor
- xo-server minor
- xo-web minor

<!--packages-end-->
