# Host Compatibility List

This section lists all supported hosts where Xen Orchestra can connect to.

Xen Orchestra is designed to work exclusively on [XCP-ng](https://xcp-ng.org/) and [Citrix Hypervisor](https://www.citrix.com/products/citrix-hypervisor/) (formerly XenServer).

Xen Orchestra should be fully functional with any version of these two virtualization platforms. However, to benefit from the best support quality, our product is tested to work the best with the versions displayed with a ✅.

### Legend

- ✅ Full support
- 🚀 All extra features (eg: RAM enabled backup)
- ☠️ Virtualization platform without security updates anymore (upgrade your hosts!)
- ❎ Not all XO features supported

## XCP-ng

:::tip
Xen Orchestra and XCP-ng are mainly edited by the same company ([Vates](https://vates.tech)). That's why you are sure to have the best compatibility with both XCP-ng and XO! Also, we strongly suggest people to keep using the latest XCP-ng LTS version as far as possible (or N-1).
:::

- XCP-ng 8.3 ✅ 🚀
- XCP-ng 8.2 LTS ✅ 🚀
- XCP-ng 8.1 ✅ ☠️
- XCP-ng 8.0 ✅ ☠️
- XCP-ng 7.6 ✅ ☠️
- XCP-ng 7.5 ✅ ☠️
- XCP-ng 7.4 ✅ ☠️

## XenServer (formerly Citrix Hypervisor)

- XenServer 8 ✅
- Citrix Hypervisor 8.2 LTS ✅
- Citrix Hypervisor 8.1 ✅ ☠️
- Citrix Hypervisor 8.0 ✅ ☠️
- XenServer 7.6 ✅ ☠️
- XenServer 7.5 ✅ ☠️
  - [VDI I/O error](https://bugs.xenserver.org/browse/XSO-873), waiting for Citrix to release our fix
- XenServer 7.4 ✅ ☠️
- XenServer 7.3 ✅ ☠️
- XenServer 7.2 ❎ ☠️
  - Issues with JSON-RPC which may leads to `INTERNAL_ERROR((Failure "Expected float, got 'I(1)'"))` during _Incremental Replication_ and _Incremental Backup_ restorations
- XenServer 7.1 LTS ✅ ☠️
- XenServer 7.0 ✅ ☠️
- XenServer 6.5 ✅ ☠️
  - Random Delta backup issues
- XenServer 6.1 and 6.2 ❎ ☠️
  - **No official support** due to missing JSON-RPC (only XML, too CPU intensive)
  - Not compatible with Delta backup and CR
- XenServer 5.x ❎ ☠️
  - Basic administration features only, **no official support**

:::warning
Backup restore for large VM disks (>1TiB usage) is [broken on old XenServer versions](https://bugs.xenserver.org/browse/XSO-868) (except 7.1 LTS up-to-date and superior to 7.6).
:::

## Others

If you installed Xen hypervisor from your usual Linux distribution, it won't work. Xen Orchestra is **agent-less** and communicate to the host directly using XAPI toolstack. Without this toolstack, it's not possible to make Xen and XO communicate.

See more details in [architecture section](architecture.md).
