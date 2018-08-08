# Xen Orchestra compatibility

Xen Orchestra is designed to work exclusively on [XCP-ng](https://xcp-ng.org/) and [Citrix XenServer](https://xenserver.org/) hypervisor (any version). Xen Orchestra should be fully functional with any version of these two hypervisors. However, to benefit from the best support quality, our product is tested to work the best with the following versions:

## Citrix XenServer (Citrix hypervisor)

Backup restore for large VM disks (>1TiB usage) is [broken on all XenServer versions](https://bugs.xenserver.org/browse/XSO-868) until Citrix release a fix.

* XenServer 7.5
  * [VDI I/O error](https://bugs.xenserver.org/browse/XSO-873), waiting for Citrix to release our fix
* XenServer 7.4
* XenServer 7.3 
* XenServer 7.2
* XenServer 7.1
* XenServer 7.0
* XenServer 6.5
  * Random Delta backup issues
* XenServer 6.1 and 6.2
  * No Delta backup and CR support
* XenServer 5.x
  * Basic administration features


## XCP-ng

All the pending fixes are already integrated in the latest XCP-ng version. We strongly suggest people to keep using the latest XCP-ng version as far as possible.

* XCP-ng 7.5
* XCP-ng 7.4.1
