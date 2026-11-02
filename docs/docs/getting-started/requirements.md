---
sidebar_position: 1
---

# Requirements

Before [deploying XOA](installation/xoa.md), check that your hosts are supported and plan the resources you give to the appliance.

Installing from source? The host compatibility list below applies too, and the build itself has [its own requirements](installation/install-from-sources.md#requirements).

## XOA specifications {#xoa-vm-specifications}

The deploy form on [vates.tech/deploy](https://vates.tech/deploy/) lets you size the VM at deployment, with three presets:

| Preset | vCPUs | RAM | Typical usage |
| --- | --- | --- | --- |
| Small | 2 | 4 GiB | A few pools, no backup jobs, no V2V |
| Medium | 4 | 8 GiB | Enterprise usage: backup jobs, V2V, more pools |
| **Large** (default) | 8 | 16 GiB | Large infrastructures with backup jobs |

The VM also needs 20 GiB of free SR space (2 GiB on a thin-provisioned SR).

### Sizing your XOA {#sizing}

The default preset targets large infrastructures running backup jobs, which is what most production deployments look like. A few rules of thumb:

- **4 GiB and 2 vCPUs** is enough for a few pools without backups or V2V. 2 GiB is the strict minimum, for labs only.
- As soon as you run backup jobs or V2V, use at least **8 GiB and 4 vCPUs**.
- **16 GiB and 8 vCPUs** for large infrastructures or a heavy backup load: transfers and compression are parallel workloads, so they benefit from more vCPUs.
- You can always give more, but **measure** afterwards to check the improvement is real before going further.

You can resize the VM at any time: shut it down, change its vCPUs and RAM, and start it again. Since Xen Orchestra 6.8, `xo-server` sets its own memory limit to 70% of the VM's RAM at each start, so there is nothing else to change. If you deployed with another method, the VM starts with 2 vCPUs and 2 GiB: resize it right after deployment.

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
