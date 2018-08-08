# Xen Orchestra compatibility

Xen Orchestra is designed to work exclusively on [XCP-ng](https://xcp-ng.org/) and [Citrix XenServer](https://xenserver.org/) hypervisor (any version). Theorically, Xen Orchestra is fully functionnal with any version of these two hypervisor. However, to benefit from the best support quality, our product is tested to work the best with the following versions:

## Citrix XenServer (Citrix hypervisor)

* XenServer 7.5
  * VDI I/O error affecting XS 7.5: https://bugs.xenserver.org/browse/XSO-873
  * VHD >1TiB affecting all versions of XS and XCP-ng before 7.5: https://bugs.xenserver.org/browse/XSO-868

* XenServer 7.4
* XenServer 7.3 
* XenServer 7.2
* XenServer 7.1
* XenServer 7.0


## XCP-ng

* XCP-ng 7.5
* XCP-ng 7.4.1
