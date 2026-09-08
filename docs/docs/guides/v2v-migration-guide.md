---
sidebar_label: VMware migration (V2V)
---

# VMware migration (V2V)

## Introduction {#-introduction}

Xen Orchestra 5.110 introduced a new migration backend for moving virtual machines from VMware to XCP-ng (V2V). It replaces the old NFS-based method with `nbdkit` and VMware's VDDK libraries, delivering better performance and reliability.

The whole process is driven from Xen Orchestra, in **Import → VM → From VMware**. XO connects to your vCenter or ESXi host, reads the VM disks directly, and imports them into an XCP-ng storage repository:

<Schema label="XO reads the VM disks from ESXi through nbdkit and the VDDK libraries, and imports them into an XCP-ng pool. The source VM keeps running during most of the transfer" legend={[["#5ac8c8", "VMware"], ["#8e83fe", "XCP-ng"], ["#6aabf0", "XO"]]} maxWidth="640px">
<svg viewBox="0 0 640 240" role="img" aria-label="A VM running on an ESXi host inside a VMware infrastructure is exported by Xen Orchestra using nbdkit and VDDK, then imported into an XCP-ng host in the destination pool, where the migrated VM is ready to boot; the source VM keeps running during the warm phase of the transfer">
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
  <text x="320" y="146" fill="#7a8699" fontSize="9" textAnchor="middle">nbdkit + VDDK</text>
  <text x="320" y="182" fill="#7a8699" fontSize="9" textAnchor="middle">reads only allocated blocks</text>
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

The new backend only reads allocated blocks, which accelerates transfers, and snapshots have minimal impact on performance. There is no longer any need for temporary NFS storage or remote VSAN targets. Very large disks are handled natively: disks bigger than the 2 TB VHD limit are automatically imported in the QCOW2 format, provided the destination storage repository supports it.

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

Make sure your Xen Orchestra instance is up to date. The import page includes an automatic check that verifies the installed versions of `nbdkit`, the VDDK plugin and `nbdinfo`, and highlights errors and warnings before the migration. Errors must be resolved, and warnings should be addressed when possible.

<UiDetail src="/img/xo5/v2v-prerequisite-check.png" alt="The prerequisite check on the import page, listing nbdkit, the VDDK plugin and nbdinfo with their status" width={480} />

### Dependencies

Install the following dependencies:

- `nbdkit`
- The VDDK plugin
- `nbdinfo`

#### Installing `nbdinfo` on Debian

:::warning
This procedure requires an active Internet connection and has only been tested on Debian 12 and 13.

In the future, we plan to include the latest libraries directly in XOA.
:::

To install `nbdinfo` on Debian:

1. Go to the **Import → VM → From VMware** section.
2. Click the button called **install nbdinfo (debian based system)**:

   <UiDetail src="/img/xo5/v2v-install-nbdinfo-button.png" alt="The install nbdinfo (debian based system) button on the From VMware import page" width={620} />

   This starts the install.

3. Keep an eye on the current page to make sure the install goes as planned.
   - The **install nbdinfo** button updates to show the installation progress, and the page displays any warnings in real time as they appear:

     <UiDetail src="/img/xo5/v2v-nbdinfo-progress-import.png" alt="The import page while the nbdinfo installation task is running, with warnings shown in real time" width={620} />

   - Additionally, the **Tasks** screen shows the `nbdinfo` install task, with its name, start date, start time and status indicator:

     <UiDetail src="/img/xo5/v2v-nbdinfo-progress-tasks.png" alt="The Tasks screen showing the running nbdinfo install task with its status indicator" width={620} />

     The task is removed from the list upon completion.

4. Once the installation finishes, the `nbdinfo` install screen updates automatically. It lets you know if everything was completed successfully and flags any warnings that came up during the process:

   <UiDetail src="/img/xo5/v2v-nbdinfo-install-complete.png" alt="The import page after a completed nbdinfo installation, with the final status and warnings" width={620} />

   :::tip
   `nbdkit` and the `nbdkit-plugin-vddk` are installed using the same approach.
   :::

#### Installing the other dependencies

:::warning
You can compile `nbdkit` and `libnbd` from source on GitLab, but the correct dependencies must be in place for `nbdinfo` and VDDK.
:::

##### Installing VDDK

1. Download the VMware Virtual Disk Development Kit (VDDK) from the [Broadcom developer portal](https://developer.broadcom.com/sdks/vmware-virtual-disk-development-kit-vddk/9.0?ref=xen-orchestra.com).
2. Select the _tar.gz_ archive, then drag and drop it directly into the Xen Orchestra interface:

   <UiDetail src="/img/xo5/v2v-upload-vddk.png" alt="The import page with the drop zone used to upload the VDDK tar.gz archive" width={620} />

   An **install button** will appear.

3. Click the button:

   <UiDetail src="/img/xo5/v2v-install-vddk-button.png" alt="The button confirming the installation of the uploaded VDDK archive" width={620} />

   The installation should take just a few seconds. Once it is done, a **transfer form** will appear:

   <UiDetail src="/img/xo5/v2v-transfer-form.png" alt="The transfer form used to connect to VMware and import a VM into Xen Orchestra" width={620} />

:::warning
Filling in this form and clicking the **Connect** button will start the VM import. Make sure your VMware environment is ready first!

Read [Preparing the VMware environment](#-preparing-the-vmware-environment) to know more.
:::

## Preparing the VMware environment {#-preparing-the-vmware-environment}

### Prerequisites

Before starting the migration, make sure your VMware environment meets the following conditions:

#### Network

XO must be able to connect to the vSphere or ESXi host through the port running the web UI (default port: 443) and the VDDK data port (default port: 902). At the time of writing, there is no way to select one network or another, so if possible, keep a single network path from XO to VMware.

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

If applicable:

1. Uninstall VMware Tools from the VM.
2. Verify that the VM can still boot successfully.

#### Create a clean snapshot

Take another snapshot named `vm without tools`.

This snapshot captures the state of the VM without VMware-specific components, and will be used for the initial migration.

## Initial test migration {#-initial-test-migration}

Before making the final switch, **run a test migration first**. This lets you catch any issues before moving to production.

### What happens during the transfer

Understanding the warm migration mechanism helps you follow the progress:

1. If the source VM is running and has no snapshot, XO automatically takes one, named `[V2V] migration to XCP-ng`.
2. XO creates the destination VM (its name ends with `importing...` while the transfer runs) and imports the read-only snapshot chain while the source VM keeps running in production.
3. A snapshot of the destination VM is taken after this first pass, so the process can be resumed safely without creating duplicate VMs.
4. If the `Stop source` option is enabled, XO then powers off the source VM in VMware, transfers only the final delta (the blocks written since the snapshot), and takes a final `complete import from V2V` snapshot.

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

## Troubleshooting migration issues {#-troubleshooting-migration-issues}

If you encounter problems during migration, try these steps to diagnose and resolve them:

- **Check VMware logs**\
  Look for disk access errors in the VMware logs. These may point to issues with the source storage or VM configuration.

- **Update software versions**\
  Ensure `nbdkit` and `nbdinfo` are up to date. Older versions can cause compatibility issues with the VDDK plugin. The [prerequisite check](#update-xen-orchestra) on the import page flags outdated versions.

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

To avoid this, use the `dracut` utility on the source VM prior to migration. For the specific driver injection procedure, refer to the [XCP-ng migration guide](https://docs.xcp-ng.org/installation/migrate-to-xcp-ng/#ova).
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
