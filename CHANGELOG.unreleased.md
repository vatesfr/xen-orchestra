> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [BACKUPS] Add merged size in cleanVm task log (PR [#9679](https://github.com/vatesfr/xen-orchestra/pull/9679))
- [Pool] Add new Network creation forms (normal, Bonded and Internal) (PR [#9629](https://github.com/vatesfr/xen-orchestra/pull/9629))
- [MCP] Add `?markdown=true` output format to REST API and simplify MCP tools with declarative registry (PR [#9624](https://github.com/vatesfr/xen-orchestra/pull/9624))
- [OpenMetrics] Add per-VDI disk size metrics: `xcp_vdi_virtual_size_bytes` and `xcp_vdi_physical_usage_bytes` (PR [#9680](https://github.com/vatesfr/xen-orchestra/pull/9680))
- [i18n] Update Chinese (Simplified Han script), Czech, Danish, Dutch, Finnish, German, Italian, Korean, Norwegian, Persian, Polish, Portuguese, Portuguese (Brasil), Russian, Slovak and Spanish translations (PR [#9649](https://github.com/vatesfr/xen-orchestra/pull/9649))
- [OpenMetrics] Add 9 missing host RRD metrics: `hostload`, `memory_reclaimed`, `memory_reclaimed_max`, `running_vcpus`, `pif_aggr_rx`, `pif_aggr_tx`, `iops_total`, `io_throughput_total`, `latency` per SR (PR [#9696](https://github.com/vatesfr/xen-orchestra/pull/9696))
- [Netbox] Use platform hierarchy to assign versioned OS names (e.g. "Debian 12" instead of "Debian") when the major version is known (requires Netbox >= 4.4) [#7773](https://github.com/vatesfr/xen-orchestra/issues/7773) (PR [#9644](https://github.com/vatesfr/xen-orchestra/pull/9644))
- [Backups] Backups no longer use their own task system, but instead use the same system as XO Task. This will help improve loading times in the future (PR [#9734](https://github.com/vatesfr/xen-orchestra/pull/9734))
- [OpenMetrics] Add VM status (`xcp_vm_status`) and VM uptime (`xcp_vm_uptime_seconds`) metrics [#9684](https://github.com/vatesfr/xen-orchestra/pull/9684)
- [REST API] Fix the `href` property in collection responses when the request URL has a trailing slash. (PR [#9741](https://github.com/vatesfr/xen-orchestra/pull/9741))
- [REST API] Expose `POST /vifs/:id/actions/connect` and `POST /vifs/:id/actions/disconnect` (PR [#9643](https://github.com/vatesfr/xen-orchestra/pull/9643))
- [VM] Add possibility to remove a VIF on network tab (PR [#9601](https://github.com/vatesfr/xen-orchestra/pull/9601))
- [VM] Add possibility to remove a VDI on VDI tab (PR [#9689](https://github.com/vatesfr/xen-orchestra/pull/9689))
- [VM] Add possibility to remove a VBD on VDI tab (PR [#9698](https://github.com/vatesfr/xen-orchestra/pull/9698))
- [VDI] Add chainPhysicalUsage to have a proper usage linked to the complete chain (PR [#9708](https://github.com/vatesfr/xen-orchestra/pull/9708))

- **XO 5**:
  - [Settings/Servers] Add info tip to remind users to only add pool masters

### Bug fixes

> Users must be able to say: “I had this issue, happy to know it's fixed”

- [Header] Fix `Unable to connect to XO server` falshing every 30 secondes (PR [#9681](https://github.com/vatesfr/xen-orchestra/pull/9681))
- [Backups] Fix regression on cleanVM speed (PR [#9692](https://github.com/vatesfr/xen-orchestra/pull/9692))
- [REST API] Fix memory leak on SSE (PR [#9707](https://github.com/vatesfr/xen-orchestra/pull/9707))
- [xo-server] Fix memory leak with secure session (PR [#9725](https://github.com/vatesfr/xen-orchestra/pull/9725))
- [REST API] Fix `other_config` being ignored when creating a new VDI with `POST /rest/v0/vdis` (PR [#9695](https://github.com/vatesfr/xen-orchestra/pull/9695))
- **XO 5**:
  - [VM/Copy]: Fix compression not used when copying a VM to another pool (PR [#9699](https://github.com/vatesfr/xen-orchestra/pull/9699))
  - [Icons] Fix display of RHEL 10 icons in vm list (PR [#9766](https://github.com/vatesfr/xen-orchestra/pull/9766))

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

<!--packages-end-->
