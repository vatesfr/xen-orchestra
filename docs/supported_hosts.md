# Host Compatibility List

This section lists all supported hosts where Xen Orchestra can connect to.

Xen Orchestra is designed to work exclusively on [XCP-ng](https://xcp-ng.org/) and [Citrix Hypervisor](https://www.citrix.com/products/citrix-hypervisor/) (formerly XenServer).

Xen Orchestra should be fully functional with any version of these two virtualization platforms. However, to benefit from the best support quality, our product is tested to work the best with the versions displayed with a ✅.

### Legend

- ✅ Full support
- 🚀 All extra features (eg: RAM enabled backup)
- ❗ Virtualization platform without security updates anymore (upgrade your hosts!)
- ❎ Not all XO features supported

## XCP-ng

:::tip
Xen Orchestra and XCP-ng are mainly edited by the same company ([Vates](https://vates.fr)). That's why you are sure to have the best compatibility with both XCP-ng and XO!
:::

- XCP-ng 8.1 ✅ 🚀
- XCP-ng 8.0 ✅
- XCP-ng 7.6 ✅ ❗
- XCP-ng 7.5 ✅ ❗
- XCP-ng 7.4 ✅ ❗

:::tip
We strongly suggest people to keep using the latest XCP-ng version as far as possible (or N-1).
:::

## Citrix Hypervisor (formerly XenServer)

Backup restore for large VM disks (>1TiB usage) is [broken on old XenServer versions](https://bugs.xenserver.org/browse/XSO-868) (except 7.1 LTS up-to-date and superior to 7.6).

- Citrix Hypervisor 8.1 ✅
- Citrix Hypervisor 8.0 ✅
- XenServer 7.6 ✅ ❗
- XenServer 7.5 ✅ ❗
  - [VDI I/O error](https://bugs.xenserver.org/browse/XSO-873), waiting for Citrix to release our fix
- XenServer 7.4 ✅ ❗
- XenServer 7.3 ✅ ❗
- XenServer 7.2 ✅ ❗
- XenServer 7.1 LTS ✅
- XenServer 7.0 ✅ ❗
- XenServer 6.5 ✅ ❗
  - Random Delta backup issues
- XenServer 6.1 and 6.2 ❎ ❗
  - No Delta backup and CR support
- XenServer 5.x ❎ ❗
  - Basic administration features only

## Others

If you installed Xen hypervisor from your usual Linux distribution, it won't work. Xen Orchestra is **agent-less** and communicate to the host directly using XAPI toolstack. Without this toolstack, it's not possible to make Xen and XO communicate.

See more details in [architecture section](architecture.md).
