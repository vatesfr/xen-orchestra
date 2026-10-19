---
sidebar_position: 1
---

# Requirements

Before [deploying XOA](installation.md), check that your hosts are supported and plan the resources you give to the appliance.

## XOA specifications {#xoa-vm-specifications}

By default, the deployed VM is configured with:

- 2 vCPUs
- 2 GiB of RAM
- 20 GiB of free SR space (2 GiB on thin provisioned SR)

### Sizing your XOA {#sizing}

The right size depends on what you ask of it:

| Usage                                                       | vCPUs  | RAM                    |
| ----------------------------------------------------------- | ------ | ---------------------- |
| A few pools, no backup jobs, no V2V                         | 2      | 2 GiB (strict minimum) |
| Enterprise usage (backup jobs, V2V, more pools)             | 4      | 4 GiB minimum          |
| Working at scale (large infrastructure, heavy backup load)  | 4 to 8 | 8 GiB                  |

A few rules of thumb:

- **2 GiB and 2 vCPUs is the strict minimum**, fine for a few pools without backups or V2V.
- As soon as you use XOA in an enterprise context, **4 GiB and 4 vCPUs** should be your baseline.
- **8 GiB** is better when working at scale, and **8 vCPUs** can bring extra speed when you run a lot of backups (transfers and compression are parallel workloads).
- You can always give more, but **measure** afterwards to check the improvement is real before going further.

## Host compatibility list

Xen Orchestra connects to hosts running [XCP-ng](https://xcp-ng.org/) or [XenServer](https://www.xenserver.com/) (formerly Citrix Hypervisor), and only those: XO is **agent-less** and talks to the XAPI toolstack directly, so a Xen hypervisor installed from a regular Linux distribution will not work (see the [architecture section](../core-concepts/architecture.md)).

Xen Orchestra should be functional with any version of these two platforms. For the best support quality, use the versions marked with full support below.

| Badge | Meaning |
|:---:|---|
| ✅ | Full support |
| 🚀 | All extra features (for example RAM-enabled backup) |
| ☠️ | Platform without security updates anymore: upgrade your hosts! |
| ❎ | Not all XO features supported |

### XCP-ng

Xen Orchestra and XCP-ng are built by the same company ([Vates](https://vates.tech)) and ship together as [Vates VMS](https://docs.vates.tech/): one subscription covers the XCP-ng licenses for all your hosts and your Xen Orchestra Appliance, and each monthly release is tested as a stack. If you run the bundle and keep it updated, XO and XCP-ng compatibility is a given.

The table below matters if you run XO from the sources, manage a mixed estate, or still have pools on older XCP-ng releases:

<HostCompatTable rows={[
  {version: 'XCP-ng 8.3 LTS', status: '✅ 🚀', notes: 'Recommended: LTS since June 2025, all XO features', highlight: true},
  {version: 'XCP-ng 8.2 LTS', status: '✅ ☠️', eol: true, notes: 'EOL since September 16, 2025'},
  {version: 'XCP-ng 8.1', status: '✅ ☠️', eol: true},
  {version: 'XCP-ng 8.0', status: '✅ ☠️', eol: true},
  {version: 'XCP-ng 7.6', status: '✅ ☠️', eol: true},
  {version: 'XCP-ng 7.5', status: '✅ ☠️', eol: true},
  {version: 'XCP-ng 7.4', status: '✅ ☠️', eol: true},
]} />

:::note
The next major branch, XCP-ng 9.x, is in development for both x86 and ARM; its releases will appear here as they ship. Follow the [XCP-ng blog](https://xcp-ng.org/blog/) for announcements.
:::

### XenServer (formerly Citrix Hypervisor)

:::note
XenServer versioning changed over the years: the product was renamed Citrix Hypervisor for the 8.0 to 8.2 era, then back to XenServer. Since XenServer 8 there are no public point releases: versions are plain "XenServer 8" and "XenServer 9", each updated continuously through Early Access and Normal update channels.
:::

<HostCompatTable rows={[
  {version: 'XenServer 9', status: '✅', notes: 'Released July 2026, vendor support until July 31, 2031', highlight: true},
  {version: 'XenServer 8', status: '✅', notes: 'Vendor support until November 30, 2028', highlight: true},
  {version: 'Citrix Hypervisor 8.2 LTS', status: '✅ ☠️', eol: true, notes: 'Vendor EOL since June 25, 2025'},
  {version: 'Citrix Hypervisor 8.1', status: '✅ ☠️', eol: true},
  {version: 'Citrix Hypervisor 8.0', status: '✅ ☠️', eol: true},
  {version: 'XenServer 7.6', status: '✅ ☠️', eol: true},
  {version: 'XenServer 7.5', status: '✅ ☠️', eol: true, notes: 'VDI I/O error (Citrix ticket XSO-873), fix never released by Citrix'},
  {version: 'XenServer 7.4', status: '✅ ☠️', eol: true},
  {version: 'XenServer 7.3', status: '✅ ☠️', eol: true},
  {version: 'XenServer 7.2', status: '❎ ☠️', eol: true, notes: 'JSON-RPC issues: possible INTERNAL_ERROR during incremental replication and incremental backup restore'},
  {version: 'XenServer 7.1 LTS', status: '✅ ☠️', eol: true},
  {version: 'XenServer 7.0', status: '✅ ☠️', eol: true},
  {version: 'XenServer 6.5', status: '✅ ☠️', eol: true, notes: 'Random delta backup issues'},
  {version: 'XenServer 6.1 and 6.2', status: '❎ ☠️', eol: true, notes: 'No official support (XML-RPC only, too CPU intensive); no incremental backup, no incremental replication'},
  {version: 'XenServer 5.x', status: '❎ ☠️', eol: true, notes: 'Basic administration only, no official support'},
]} />
