---
sidebar_label: VMware migration (V2V)
---

# VMware migration (V2V)

## Introduction {#-introduction}

Xen Orchestra 5.110 introduced a new migration backend for moving virtual machines from VMware to XCP-ng (V2V). It replaces the old NFS-based method with `vectura`, a standalone reader of VMware's NFC protocol, delivering better performance and reliability without any VMware-provided library.

The whole process is driven from Xen Orchestra, in **Import → VM → From VMware**. XO connects to your vCenter or ESXi host, reads the VM disks directly, and imports them into an XCP-ng storage repository:

<Schema label="XO reads the VM disks from ESXi through vectura, and imports them into an XCP-ng pool. The source VM keeps running during most of the transfer" legend={[["#5ac8c8", "VMware"], ["#8e83fe", "XCP-ng"], ["#6aabf0", "XO"]]} maxWidth="640px">
<svg viewBox="0 0 640 240" role="img" aria-label="A VM running on an ESXi host inside a VMware infrastructure is exported by Xen Orchestra using vectura, then imported into an XCP-ng host in the destination pool, where the migrated VM is ready to boot; the source VM keeps running during the warm phase of the transfer">
  <rect x="16" y="40" width="192" height="168" rx="8" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5" />
  <text x="28" y="62" fill="#c6d2e1" fontSize="12">VMware</text>
  <text x="28" y="78" fill="#7a8699" fontSize="10">source infrastructure</text>
  <rect x="32" y="92" width="160" height="100" rx="6" fill="rgba(255,255,255,0.04)" stroke="#5ac8c8" />
  <text x="112" y="110" fill="#c6d2e1" fontSize="10" textAnchor="middle">ESXi host</text>
  <rect x="54" y="122" width="116" height="46" rx="6" fill="rgba(90,200,200,0.12)" stroke="#5ac8c8" />
  <text x="112" y="141" fill="#c6d2e1" fontSize="12" textAnchor="middle">VM</text>
  <text x="112" y="157" fill="#7a8699" fontSize="9" textAnchor="middle">keeps running</text>
  <line x1="194" y1="134" x2="252" y2="134" stroke="#5ac8c8" strokeWidth="2" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="262,134 252,128 252,140" fill="#5ac8c8" />
  <text x="228" y="122" fill="#5ac8c8" fontSize="9" textAnchor="middle">export</text>
  <rect x="266" y="108" width="108" height="52" rx="6" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="320" y="129" fill="#c6d2e1" fontSize="11" textAnchor="middle">Xen Orchestra</text>
  <text x="320" y="146" fill="#7a8699" fontSize="9" textAnchor="middle">vectura</text>
  <text x="320" y="182" fill="#7a8699" fontSize="9" textAnchor="middle">reads only used blocks (CBT)</text>
  <line x1="378" y1="134" x2="430" y2="134" stroke="#56c288" strokeWidth="2" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="440,134 430,128 430,140" fill="#56c288" />
  <text x="404" y="122" fill="#56c288" fontSize="9" textAnchor="middle">import</text>
  <rect x="432" y="40" width="192" height="168" rx="8" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5" />
  <text x="444" y="62" fill="#c6d2e1" fontSize="12">XCP-ng pool</text>
  <text x="444" y="78" fill="#7a8699" fontSize="10">destination</text>
  <rect x="448" y="92" width="160" height="100" rx="6" fill="rgba(255,255,255,0.04)" stroke="#8e83fe" />
  <text x="528" y="110" fill="#c6d2e1" fontSize="10" textAnchor="middle">XCP-ng host</text>
  <rect x="470" y="122" width="116" height="46" rx="6" fill="rgba(86,194,136,0.12)" stroke="#56c288" />
  <text x="528" y="141" fill="#c6d2e1" fontSize="12" textAnchor="middle">VM</text>
  <text x="528" y="157" fill="#7a8699" fontSize="9" textAnchor="middle">ready to boot</text>
</svg>
</Schema>

This guide walks you through the entire migration process:

- Preparing your Xen Orchestra environment
- Preparing your VMware environment
- Running a test migration
- Executing the final cutover
- Preparing the guest to boot on XCP-ng with the [automatic guest repair](#-guest-repair)

You will also find troubleshooting advice and best practices to maximize speed and minimize downtime.

:::note
The V2V import is currently available in the XO 5 interface. The new XO 6 web UI does not expose it yet: even if you use XO 6 daily, switch to the XO 5 interface for the migration itself.
:::

## Benefits {#-benefits}

### In short

The new V2V backend replaces the old approach, and delivers:

- Warm migration for all ESXi versions
- Improved performance
- A cleaner design for easier maintenance

### Detailed benefits

#### Ease of use and compatibility

When Changed Block Tracking (CBT) is enabled on the source VM, the new backend only reads the blocks changed since the previous pass and, on VMFS datastores, only the blocks the disks use for the first pass, which accelerates transfers, and snapshots have minimal impact on performance. Without CBT, the whole disk is read: runs of zeros are not sent over the network, but the ESXi host still reads them (see [Changed Block Tracking](#changed-block-tracking-cbt)). There is no longer any need for temporary NFS storage or remote VSAN targets. Very large disks are handled natively: disks bigger than the 2 TB VHD limit are automatically imported in the QCOW2 format, provided the destination storage repository supports it.

#### UI improvements

The interface has also seen significant improvements: a **progress bar** is now visible from the start of the migration, **speed metrics** are recorded in the VDI, and **snapshots** are created at each step. This allows you to pause and resume the process safely without creating multiple VMs. The import is **cancellable**, and the connection settings are remembered by your browser between sessions.

Additionally, UEFI VMs are no longer forced into Secure Boot mode, which resolves previous boot issues.

Recent releases keep improving the workflow: since XO 6.6, a CD-ROM drive present on the source is recreated on the destination VM, and a two-step transfer (a first warm pass followed by a final run) tells you upfront whether the next run will be a full or a delta transfer.

#### Performance gains

Performance gains can be significant, though results depend on the environment:

- **In the best case**, when using VMs with many snapshots or mostly empty disks, migrations can be up to 100 times faster. In our high-performance lab, we measured around 150 MB/s per disk and up to 500 MB/s total, which means an infrastructure with 10 TB of data could be migrated in a single day, with less than five minutes of downtime per VM.

- **In less favorable situations**, such as a fully allocated disk with no snapshots and a powered-off VM, improvements are smaller, mainly due to compression between XO and ESXi. In general, the limiting factor is the import speed on the XCP-ng side, which scales well until the storage is saturated. Most of the transfer occurs while the VM is running, so production data remains safe.

## Preparing the XO environment {#-preparing-the-xo-environment}

### Update Xen Orchestra

Make sure your Xen Orchestra instance is up to date. The import page includes an automatic check that verifies that `vectura`, shipped with your Xen Orchestra, runs on this system. Errors must be resolved before the migration can start.

<UiDetail src="/img/xo5/v2v-prerequisite-check.png" alt="The prerequisite check on the import page, showing the status of vectura" width={480} />

### Dependencies

The only dependency is `vectura`, a single binary that reads VMware disks over the NFC protocol. It
is shipped with Xen Orchestra and runs from there: there is nothing to install, nothing to download
from VMware or Broadcom, and nothing to compile. It needs a Linux x86-64 system with glibc 2.31 or
later, such as Debian 11 or Ubuntu 20.04.

Go to the **Import → VM → From VMware** section. Once the check passes, a **transfer form** appears:

<UiDetail src="/img/xo5/v2v-transfer-form.png" alt="The transfer form used to connect to VMware and import a VM into Xen Orchestra" width={620} />

:::warning
Filling in this form and clicking the **Connect** button will start the VM import. Make sure your VMware environment is ready first!

Read [Preparing the VMware environment](#-preparing-the-vmware-environment) to know more.
:::

## Preparing the VMware environment {#-preparing-the-vmware-environment}

### Prerequisites

Before starting the migration, make sure your VMware environment meets the following conditions:

#### Network

XO must be able to connect to the ESXi host, or to the vCenter, through the port running the web UI (default port: 443), and to the ESXi host holding the VM through the NFC data port (default port: 902), even when going through a vCenter. At the time of writing, there is no way to select one network or another, so if possible, keep a single network path from XO to VMware.

#### Changed Block Tracking (CBT) {#changed-block-tracking-cbt}

Enable CBT on the source VMs before migrating them. XO asks the ESXi host which blocks the disks use and, for the final delta, which blocks changed since the first pass. Without CBT, every disk is read entirely, which is much slower for large disks that are mostly empty.

With CBT, the final delta only reads the blocks changed since the first pass, whatever the datastore. For the first pass, the host lists the blocks the disk uses on VMFS datastores. On NFS datastores, it may list the whole disk: the first pass then reads every block, and only the runs of zeros are left out of the transfer from ESXi.

CBT is enabled in the advanced configuration parameters of the VM (**Edit Settings → VM Options → Advanced → Configuration Parameters**): set `ctkEnabled` to `TRUE`, and `scsiX:Y.ctkEnabled` to `TRUE` for each disk (for example `scsi0:0.ctkEnabled`). It only takes effect at the next power on, or when a snapshot is taken or removed.

:::warning
A snapshot taken before CBT was enabled cannot be used to compute a delta. Remove the existing snapshots once CBT is enabled: XO then takes its own snapshot when the migration starts.
:::

#### VMware Tools

Keep the VMware Tools (or open-vm-tools) installed and running on the source VMs. XO uses them to:

- shut the guest down cleanly when the `Stop source` option is enabled, instead of powering it off;
- read the IP addresses of each network card, which the [guest repair](#-guest-repair) needs for Windows VMs with several network cards in static addressing.

With the guest repair, there is no need to remove the VMware Tools before the migration: the repair disables them on the migrated VM.

#### VMware disk support

##### Supported

- **Native snapshots** are supported. To migrate these:
  1. Shut them down completely.
  2. Remove all snapshots before attempting the migration.
- **Warm migration** is supported. If a warm migration fails:
  1. Stop the VM.
  2. Remove any snapshots.

##### Unofficial support {#-unofficial-support}

VSAN configurations have not been fully tested, but they are expected to work.

##### Unsupported {#-unsupported}

The following VMware disk types are not supported:

- RDM (Raw Device Mapping)
- Independent disks
- Physical compatibility mode RDMs
- Encrypted virtual disks (unless you have the correct credentials)

:::warning
Starting with Xen Orchestra 5.110, NFS-based migration and VSAN exports are no longer available.
:::

### Step-by-step procedure

Here is the "surefire method" to prepare your VMware environment.

It involves a lot of manual steps, but it lets you detect and fix issues without impacting production.

:::tip
There is also a "fire-and-forget" approach: launch the migration with the `Stop source` option enabled, then start the VM once the migration is complete.

This method is only recommended for non-critical VMs, and only after the first few migrations have gone smoothly.
:::

Once the [prerequisites](#prerequisites) are met, follow these steps to prepare the source VM:

#### Optimize the source VM {#optimize-the-source-vm}

1. Remove all existing snapshots from the VM.
2. Take a new snapshot named `vm starting point` to serve as a baseline.

#### Clean up VMware

Skip this step if you use the [guest repair](#-guest-repair): it disables the VMware Tools on the migrated VM, and needs them on the source.

Otherwise, if applicable:

1. Uninstall VMware Tools from the VM.
2. Verify that the VM can still boot successfully.

#### Create a clean snapshot

Without the guest repair, take another snapshot named `vm without tools`.

This snapshot captures the state of the VM without VMware-specific components, and will be used for the initial migration.

## Initial test migration {#-initial-test-migration}

Before making the final switch, **run a test migration first**. This lets you catch any issues before moving to production.

### What happens during the transfer

Understanding the warm migration mechanism helps you follow the progress:

1. If the source VM is running and has no snapshot, XO automatically takes one, named `[V2V] migration to XCP-ng`.
2. XO creates the destination VM (its name ends with `importing...` while the transfer runs) and imports the read-only snapshot chain while the source VM keeps running in production.
3. A snapshot of the destination VM is taken after this first pass, so the process can be resumed safely without creating duplicate VMs.
4. If the `Stop source` option is enabled, XO then shuts the source VM down through its VMware Tools, transfers only the final delta (the blocks written since the snapshot), and takes a final `complete import from V2V` snapshot. When the VMware Tools do not run, or the guest does not shut down within 10 minutes, the VM is powered off instead, and the task reports it.
5. If the [guest repair](#-guest-repair) is enabled and the import is complete, XO boots the destination VM on the repair ISO, which prepares the guest to run on XCP-ng.

As long as the import is partial (the source VM is still live), XO blocks the destination VM from starting normally, to prevent both copies from running at once.

### Perform the first migration attempt

1. **Start the V2V migration** in Xen Orchestra, without enabling the `Stop source` option.\
   This will transfer the VM data up to the snapshot named `vm without tools`.
   :::tip
   You can safely close your browser while the migration runs.
   :::
2. **Monitor the migration progress** using one of these methods:
   - Check the VM status in Xen Orchestra (its name should show `importing...`).
   - Follow the disk transfer progress indicators.

### Testing the migrated VM

Once the migration is complete:

1. Start the migrated VM copy on your XCP-ng environment. Since the source VM is still running, XO protects the partially synced copy: confirm the force start when prompted.

   :::tip
   - Use an **isolated network** to avoid IP conflicts.
   - The **VM state** might be slightly inconsistent since memory and cache data aren't fully synced.
   :::

2. Check the following during testing:
   - The VM boots up without issues.
   - Network connectivity is working properly.
   - Xen Tools installs and runs correctly.

3. Document any fixes or adjustments required to stabilize the VM.

### Remove the test copy

Once you have finished your checks and taken notes, delete the test VM. This will free up resources and prevent any confusion before the final migration.

## Final migration {#-final-migration}

### Run the production migration

When you're ready for the final migration:

- Shut down the source VM completely.
- Start the V2V migration in Xen Orchestra with the `Stop source` option enabled.\
  This ensures the final sync happens while the VM is powered off, and prevents any inconsistencies.

### Post-migration tasks

Once the migration is complete:

- Apply any fixes or tweaks you identified during the test migration, and install the Xen guest tools if you have not already.
- The migrated VM includes the snapshots taken during the import, which you can use for rollback. If needed, create additional snapshots before making further changes.

## Guest repair {#-guest-repair}

A VM imported from VMware does not always boot on XCP-ng as is: its initramfs may lack the Xen drivers, its network interfaces are renamed, the VMware Tools fail without their virtual hardware, and the XCP-ng guest tools are missing. The guest repair takes care of it, before the guest OS ever boots on XCP-ng.

### How it works

Once the import is complete, XO:

1. inserts the repair ISO in the CD drive of the destination VM, and attaches the guest tools ISO of the pool as a read-only disk;
2. boots the VM on the ISO in `diagnose` mode: it inspects the disks and reports what it would change, without writing anything. A blocking problem stops the repair at this point;
3. boots it again in `repair` mode, which applies the changes, then powers the VM off;
4. detaches both ISOs and restores the boot order, so the VM boots on its disks.

The import snapshot taken before the repair is the rollback path. A failed repair does not fail the import: the task reports it as a warning, with the reason.

The repair is off by default. It is available through the API: the `repair` parameter of `vm.importFromEsxi` and `vm.importMultipleFromEsxi`, and the `repair` option of `POST /rest/v0/v2v/actions/start`. It is not exposed in the XO 5 import form yet.

With the `startVm` option as well, XO then starts the VM and follows its first boot on XCP-ng:

1. Linux boots directly. Windows runs its first-boot phases: it installs the PV drivers and the management agent, and restarts on its own. When the first boot does not complete within 45 minutes, or gives up, XO stops the VM and boots the repair ISO again to read the state and the log of the first boot, which the task then reports.
2. XO waits for the guest agent to report.
3. If the source VM had Secure Boot enabled, XO enables it again and restarts the VM to check that it boots. If it does not, Secure Boot is disabled again, and the task reports it. Secure Boot needs the UEFI certificates of the pool to be installed.

### Requirements

- **The repair ISO** must be deployed on the destination pool, in an ISO storage repository, under the name its build gives it, `xo-repair-<date>-<commit>.iso`. Each version of Xen Orchestra uses the build it was tested with, and checks the version the ISO reports before modifying anything. Several builds can be deployed side by side; the `isoVersion` repair option selects another build (its date, `YYYYMMDD`).
- **A complete import**: the source VM is powered off before the migration, or the `Stop source` option is enabled. A partial import of a running VM is not repaired. The REST API refuses this combination.
- **A clean shutdown of Windows**: a Windows VM that was powered off, rather than shut down from the guest, cannot be repaired (`ntfs_unclean`): its volumes are left in a state that cannot be written offline. Keep the VMware Tools running so that `Stop source` shuts it down cleanly, or shut it down from Windows before the migration. Hibernation and Fast Startup are blocking too.
- **A running source for Windows with several network cards in static addressing**: the static configuration of each old adapter is moved to the network card with the same MAC address, matched through the IP addresses that the VMware Tools report while the VM runs. Start the migration with the source VM running, its VMware Tools up, and the `Stop source` option enabled. Otherwise these adapters fall back to DHCP, and the task reports it. A single network card, or DHCP, does not need it, and neither does Linux.
- **The guest tools ISO** of the pool, used to install the XCP-ng guest agent and the Windows PV drivers. Without it, the repair still runs, without the guest agent.

### What the repair changes

| Guest | Changes |
| --- | --- |
| Linux | Xen drivers (`xen-blkfront`, `xen-netfront`) in the initramfs, `/etc/fstab` entries rewritten to stable names, VMware Tools disabled, network interfaces pinned to their former names (`ens192` stays `ens192`), XCP-ng guest agent installed, kdump initrd rebuilt, SELinux relabel when needed |
| Windows | Boot on the emulated disk enabled, VMware services disabled, static IP configuration of the old adapters captured and reapplied on the new ones at first boot (DNS included), XCP-ng PV drivers and management agent installed at first boot |
| UEFI (all) | Fallback boot loader (`\EFI\BOOT\BOOTX64.EFI`) installed, since the boot entries of the VMware NVRAM are lost |

The network configuration of the guest itself is never modified: static and DHCP interfaces stay as they are, and the network cards keep their VMware MAC addresses, so DHCP reservations keep working.

### Supported systems

"Validated" means installed on ESXi 8 with the VMware defaults, imported, repaired, then booted on XCP-ng with no manual step, on PV disk and network, with the guest agent reporting.

| Family | Validated versions |
| --- | --- |
| Debian | 13 (BIOS, UEFI) |
| Ubuntu | 22.04, 24.04, 26.04 |
| RHEL family | CentOS 7.3, Rocky Linux 8.10, 9.8, 10.2, Oracle Linux 9.8 (UEK and RHCK kernels). RHEL itself is expected to behave like Rocky Linux, but is not tested |
| SUSE | SLES 15 SP7, SLES 16.0, openSUSE Leap 15.6 |
| Arch Linux | rolling (experimental) |
| Windows | Server 2016, 2019, 2022, 2025 |

Also validated: BIOS and UEFI, SELinux enforcing, btrfs with snapper, LVM over several disks, `/boot` and `/usr` on their own disks, two network cards with static addresses, DHCP, kdump.

#### Partially supported

| Guest | Limitation |
| --- | --- |
| Windows 7 SP1, 8.1, Server 2008 R2 SP1, Server 2012 R2 | The VM is repaired and boots on emulated devices, but the XCP-ng PV drivers do not support these versions: no PV drivers, no management agent |
| Transactional systems with a read-only root (SL Micro) | Nothing is written offline. The VM boots when its initramfs already has the Xen drivers; the guest agent must be installed after the first boot |
| Linux without systemd, or with a package manager the guest tools do not support | No guest agent: install it after the first boot |
| Linux without systemd-udevd | Network interfaces are not pinned to their former names |
| Linux kernel without `xen-blkfront` | The VM boots on the emulated disk, without PV disk |

#### Not supported

- Encrypted volumes (LUKS, BitLocker): detected, not repaired.
- Windows dynamic disks, hibernated Windows, Fast Startup.
- Windows volumes not cleanly shut down (`ntfs_unclean`).
- Windows older than 7 SP1 / Server 2008 R2 SP1.
- Other systems (BSD…).

### After the repair

- **Without `startVm`, the VM is left powered off.** Start it: Linux boots directly. Windows runs its first-boot phases, installs the PV drivers and the management agent, and restarts on its own once.
- **Secure Boot** is disabled during the repair, since the repair ISO is not signed. Without `startVm`, if the source VM had Secure Boot enabled, enable it again once the VM has booted, with the pool certificates installed.
- **The VMware Tools** stay installed on the migrated VM, disabled. Remove them when convenient.
- **The reports** of both runs are stored on the VM, in `other_config['xo:v2v:repair']`. The full report and log of the repair are in the guest: `/var/log/xo-repair/` on Linux, `C:\xo-repair\` on Windows (with the first-boot and installation logs).

## Troubleshooting migration issues {#-troubleshooting-migration-issues}

If you encounter problems during migration, try these steps to diagnose and resolve them:

- **Check VMware logs**\
  Look for disk access errors in the VMware logs. These may point to issues with the source storage or VM configuration.

- **Update software versions**\
  Keep your Xen Orchestra up to date: `vectura` ships with it. The [prerequisite check](#update-xen-orchestra) on the import page tells whether it runs on this system.

- **Remove active snapshots**\
  Make sure no active snapshots remain on the source VM. Snapshots can disrupt migration consistency.

- **Verify destination storage**\
  Confirm the XCP-ng storage repository has enough free space for the migrated VM.

- **Test network connectivity**\
  Ensure stable network connectivity between the VMware environment, Xen Orchestra, and XCP-ng hosts.

- **Retry with cold migration**\
  If warm migration fails, power off the VM, remove all snapshots, and try again.

## Need more help? {#-need-more-help}

### Booting issues when importing VMs

:::tip
When migrating a VM from VMware, the system may fail to boot if the required Xen drivers are not pre-installed.

The [guest repair](#-guest-repair) adds them automatically. Without it, use the `dracut` utility on the source VM prior to migration. For the specific driver injection procedure, refer to the [XCP-ng migration guide](https://docs.xcp-ng.org/installation/migrate-to-xcp-ng/#ova).
:::

## Boosting migration performance {#-boosting-migration-performance}

Migration speed depends on several factors. By identifying bottlenecks and optimizing your setup, you can significantly improve performance.

### Common bottlenecks

The V2V migration process can be slowed down by:

- XAPI ingestion speed limits
- Network throughput between Xen Orchestra and VMware
- Network throughput between Xen Orchestra and the XCP-ng host
- ESXi host export speed

### Optimizing network performance

For the best results:

#### Xen Orchestra to XCP-ng connection

- Run Xen Orchestra directly within the target XCP-ng pool to reduce network hops and latency.
- Use the highest available bandwidth, ideally 10Gbps or faster.

#### Xen Orchestra to VMware connection

Ensure a dedicated 10Gbps+ connection with low latency to your vCenter or ESXi hosts.

### Storage recommendations

Use **fast SSD storage** for both the XCP-ng storage repository and Xen Orchestra's working directory.
This speeds up the initial migration and enables smoother live migrations afterward.

### CPU and compute resources

If CPU becomes a bottleneck:

- **Allocate high-performance CPUs** to your Xen Orchestra appliance.
- For large environments, consider **parallel migrations** using multiple Xen Orchestra instances, but balance this with your network capacity.

### Migration strategy

- Schedule migrations during off-peak hours to minimize performance issues.
- If migrating multiple VMs, **stagger start times** and monitor XAPI performance to avoid bottlenecks.
