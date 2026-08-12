---
sidebar_label: Features and settings
---

# Backup features and settings

<InterfaceNote>This page describes the backup configuration in the XO 5 interface. XO 6 already shows your jobs, their runs and each VM's protection status; creating, editing and restoring still happens here.</InterfaceNote>

This section is dedicated to all general concepts about Xen Orchestra backups.

:::note Replication modes have been renamed
The two replication job types now have clearer names, but the XO 5 screens below still show the former ones:

| Current name                                                       | Former name, still shown in XO 5 |
| ------------------------------------------------------------------ | -------------------------------- |
| [Full replication](../full_replication.md)                          | Disaster Recovery (DR)           |
| [Incremental replication](incremental_replication.md)               | Continuous Replication (CR)      |

Nothing changed in behaviour: only the labels differ. XO 6 uses the current names, and the tags XO puts on replicas (`Disaster Recovery`, `Continuous Replication`) kept the former ones.
:::

## Interface

### Overview

This is the welcome panel for the backup view. It recaps all existing scheduled jobs. This is also where the backup logs are displayed.

### Logs

All the scheduled operations (backup, snapshots and even replication) are displayed in the main backup view.

A successful backup task will be displayed in green, a faulty one in red. You can click on the arrow to see each entry detail.

You also have a filter to search anything related to these logs.

:::tip
Logs are not "live" tasks. If you restart XOA during a backup, the log associated with the job will stay in orange (in progress), because it wasn't finished. It will stay forever unfinished because the job was cut in the middle.
:::

#### Send XO logs to an external syslog server

##### About syslog

Syslog is a standard protocol used for logging system messages in a network. It allows devices such as servers, routers, firewalls and applications to send log or event messages to a centralized log server, called a **syslog server** or syslog daemon.

This protocol simplifies log analysis and eliminates the need to connect to each machine individually. It's particularly useful for identifying common patterns and correlations among events, greatly aiding in debugging issues. Additionally, since logs are sent to a remote location, they remain intact on the destination machine even if deleted locally, which is beneficial in the event of intrusions.

##### Log format

A typical syslog message is a structured line of text that includes several components (typically in this order): **priority**, **timestamp**, **hostname**, **process name**, **PID**, and the **actual message**.

Here's an example:

`<34>Jun 24 14:32:01 server1 CRON[1234]: (root) CMD (/usr/bin/backup.sh)`

##### Using syslog with Xen Orchestra

You can send all your XO logs to an external syslog server.

To enable syslog, add this to your configuration file (`/etc/xo-server/config.toml`):

```toml
[logs.transport.syslog]
target = 'tcp://syslog.example.org:514'
```

All logs viewable from `journalctl -u xo-server` will now be sent to your central syslog server.

##### Compatibility

This setup is compatible with any syslog server, such as [Rsyslog](https://www.rsyslog.com/windows-agent/about-rsyslog-windows-agent/), [Splunk](https://www.splunk.com/en_us/blog/learn/log-management.html), [Logstash](https://www.elastic.co/logstash), [Graylog](https://graylog.org/about/), and more.

### Backups execution

Each backup job execution is identified by a `runId`. You can find this `runId` in its detailed log.

<UiDetail src="/img/xo5/backup-log-run-id.png" alt="Detailed log of a backup run: the runId is displayed next to the job name, with the copy and report-a-bug buttons" width={480} />

## Backup encryption

Xen Orchestra ensures robust data security for backups stored remotely, by leveraging advanced encryption algorithms. Here's a closer look at how encryption works and the technology behind it:

### Authentication

The encryption algorithms are authenticated, meaning additional metadata is appended to the end of each saved file. During restoration, this metadata ensures that the restored data matches the original encrypted data, allowing the system to detect issues like bit rot or tampering by an attacker without the encryption key. However, it's important to note that this is not a recoverable error: if the verification fails, the file will be unusable.

### Configuring encryption

Encryption is opt-in and requires configuring an encryption key on the backup repository.

:::warning

- Encryption is only compatible with block-based backup repositories: incremental backups sent to an encrypted repository must be stored as multiple data blocks, not as a whole VHD file.
- Encryption cannot be changed (such as enabling, disabling or changing the encryption key) if a backup repository contains any backup.

:::

1. Go to the **Settings → Remotes** menu.
2. Go to the section called **New file system remote**, or edit an existing backup repository.
3. In the subsection called **Encrypt all new data sent to this remote** you will find a text area. Enter your encryption key there.
4. Click the **Save configuration** button to finish the encryption setup.

### `ChaCha20-Poly1305`

Since February 2025, Xen Orchestra encrypts backup repositories with the [`ChaCha20-Poly1305`](https://en.wikipedia.org/wiki/ChaCha20-Poly1305) algorithm. This update addresses the file size limitations of `AES-256-GCM` while maintaining a high level of security and compliance with ANSSI guidelines.

Backup repositories that were encrypted with `AES-256-GCM` remain accessible, to ensure a smooth transition.

### `AES-256-GCM`

> This algorithm was the default before February 2025 and has now been replaced by [`ChaCha20-Poly1305`](#chacha20-poly1305).

#### What is AES-256-GCM?

Backups on repositories encrypted before February 2025 use the [`AES-256-GCM`](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard) encryption algorithm. While this is a highly secure option, it has a file size limitation of 64 GiB. This isn't an issue when working with incremental backups, as the data is split into smaller blocks, making it fully compatible with any backup repository (S3-compatible or file-based).

Full backups create one file per backup with all the data, which can go over 64 GiB, even with XCP-ng zstd compression enabled.

#### Compliance

The `AES-256-GCM` algorithm is fully compliant with [ANSSI guidelines (in French)](https://cyber.gouv.fr/sites/default/files/2021/03/anssi-guide-selection_crypto-1.0.pdf).

### Switching to the new encryption algorithm

If you see an exclamation mark next to the encryption icon on a backup repository, it means the encryption algorithm isn't the recommended one.

To switch to `ChaCha20-Poly1305`, follow these steps:

1. Make sure the backup repository doesn't contain any backups encrypted with the old algorithm.
2. If the repository has `AES-256-GCM` backups, create a new backup repository and do a full backup to that location.
3. Once all backups with the old encryption are gone, set up encryption on the repository with the new algorithm.
4. The exclamation mark should disappear.

If the warning icon is still there, double-check that no encrypted backups remain before switching algorithms.

## Exclude disks

During a backup job, you can avoid saving all disks of the VM. To do that is trivial: just edit the VM disk name so it contains `[NOBAK]` somewhere, eg: `data-disk` will become `data-disk [NOBAK]` or perhaps `[NOBAK] data-disk` (with a space or not, doesn't matter).

The disks marked with `[NOBAK]` will be now ignored in all following backups.

:::tip
To exclude a whole VM from every backup job, give the VM the `xo:no-bak` tag instead. See [backup modifier tags](#backup-modifier-tags).
:::

## Schedule

### Introduction

Automating your backups is key to ensuring the safety and recoverability of your virtual machines.

By scheduling regular backups, you protect your infrastructure from accidental deletions, system failures, or data corruption. Xen Orchestra lets you easily set up flexible schedules for your backup jobs, making sure they run automatically at times and frequencies that work best for you.

### Viewing schedules for a backup job

To see the schedules associated with a specific backup job:

1. Navigate to the **Backup** menu.\
   A list of backup jobs will be displayed.
2. For the backup job you're interested in, click the **pencil** icon in the **Notes** column.\
   This will open the backup job details screen.
3. In the **Schedules** section of the details screen, you'll find the list of schedules for that backup job:

<UiShot light="/img/xo5/backup-schedule-list.png" alt="An incremental replication job in edit mode, with the Schedules section highlighted on the right" url="https://your-xo/v5/#/backup" />

### Creating a schedule

To set up a schedule for a backup job:

1. Navigate to the details page of your backup job (refer to the previous section, "Viewing schedules for a backup job").
2. In the **Schedules** section of your backup job, click the **Add a schedule** button, represented by a plus icon.\
   A form for creating a schedule will appear:

   <UiDetail src="/img/xo5/create-backup-schedule.png" alt="The Schedule creation form: name, retention, health check, force full backup, then the month/day/hour/minute pickers, timezone, cron pattern and run preview" width={480} />

3. Use the form to configure your schedule.\
   Here's a list of the parameters you can adjust:

| Parameter                 | Description                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Name**                  | A label to identify your schedule. Useful when managing multiple jobs.                                                               |
| **Backup retention**      | Number of backups to keep on the backup repository (shown for _Backup_ and _Delta Backup_ jobs). Older backups beyond this count are automatically removed. |
| **Replication retention** | Number of replicated VMs to keep on the target SR (shown for _DR_ and _CR_ jobs). Older copies beyond this count are automatically removed. |
| **Snapshot retention**    | Number of rolling snapshots to keep on the VM itself (shown when _Rolling Snapshot_ is enabled).                                     |
| **Pool retention**        | Number of pool metadata backups to keep (metadata backup jobs only).                                                                 |
| **XO retention**          | Number of XO configuration backups to keep (metadata backup jobs only).                                                              |
| **Health check**          | If enabled, a VM [health check](#backup-health-check) is performed after the backup to detect issues early (e.g., boot errors).      |
| **Force full backup**     | Forces a full backup at every run of this schedule, even if the job is incremental (delta jobs only).                                |
| **Month(s)**              | Select specific months during which the schedule should run.                                                                         |
| **Day(s)**                | Select days of the month for the job to execute. You can choose specific dates or all days.                                          |
| **Hour**                  | Choose the hour of the day the backup job should start.                                                                              |
| **Minute**                | Choose the exact minute the job should start.                                                                                        |
| **Timezone**              | Determines the timezone in which the schedule should apply. You can also use your browser's local timezone.                          |
| **Cron Pattern**          | Automatically generated from your selections to define when the job will run.                                                        |
| **Preview**               | A list of upcoming executions based on your current configuration. Useful to verify the setup.                                       |

:::tip

Depending on your backup type, not all settings may be visible, particularly those related to retention.

:::

4. Click the **OK** button.\
   Your schedule will be created and applied to the backup job.

## Backup sequences {#sequences}

By default, every schedule fires on its own cron: two jobs planned at the same time will run in parallel and compete for resources. A **sequence** chains existing schedules instead: pick the schedules to include, order them, and give the sequence its own cron. When it fires, the schedules run **one after the other**, in the order you defined.

To create one, go to the **Backup** view, open the **Sequences** tab and click **New sequence**: name it, add the schedules in the desired order, and set when the sequence itself runs.

Typical use: run the backup job first, then the replication job on the same VMs, without guessing how long the first one takes.

## Smart backup {#smart-backup}

There are two ways to select which VMs will be backed up:

1. Manually selecting multiple VMs
1. Smart backup

Picking VMs manually can be a limitation if your environment moves fast (i.e. new VMs to protect are created often). In that situation you would previously need to constantly go back and edit the backup job to add the new VMs.

Thanks to _smart backup_, you have more flexibility: instead of specific VMs, you select criteria (power state, pool placement, tags), and the job resolves them **at the time the backup job is executed**. Let's see some examples!

### Backup all VMs on a pool

This job will back up all VMs on the pool "Lab Pool" when scheduled:

<UiDetail src="/img/xo5/smart-backup-pool.png" alt="Smart mode in a backup job: VMs statuses set to All and Resident on set to Lab Pool" width={620} />

It means: **every VM existing on this pool at the time of the backup job will be backed up**. Doesn't matter if you create a new VM, it will be backed up too without editing any backup job.

**You now have the ability to intelligently backup VMs in production pools!**

Want to narrow the job a bit? See below.

### Backup filters

Smart mode offers the following criteria, evaluated at each run:

- **VMs statuses**: back up all VMs, only running VMs, or only halted VMs
- **Pools**: only VMs resident on the selected pools, with an optional exclusion list (**Not resident on**)
- **Tags**: only VMs carrying at least one of the selected tags, with an optional list of excluded tags

:::tip
XO pre-fills the excluded tags with `Continuous Replication`, `Disaster Recovery` and the XO proxy tag, so a smart backup job doesn't back up the replicas created by your own replication jobs. Those two tag values kept the former names of the incremental and full replication modes, and XO still writes them as such on the replicas. VMs tagged `xo:no-bak` are always excluded, whatever the job configuration.
:::

Remember the prod VMs? I added a tag "prod" to each of them:

<UiDetail src="/img/xo5/vm-prod-tag.png" alt="The Home view with four VMs, each carrying the prod tag" width={620} />

Now if you do this:

<UiDetail src="/img/xo5/smart-backup-pool-tag.png" alt="Smart mode combining Resident on Lab Pool with the prod tag" width={420} />

It means any VMs on "Lab Pool" with the "prod" tag will be backed up.

## RAM enabled backup

:::tip
This feature is **only compatible** with XCP-ng 8.0 or more recent. Citrix Hypervisor never merged our changes, even though we contributed them to their code directly.
:::

XCP-ng modified XAPI is able to create VMs in a `Suspended` state with a `suspend_VDI` property set. When a VM is suspended, all of its memory contents are written into a disk called `suspend_VDI`. When the VM is restored, the `suspend_VDI` is read to recreate the memory of the VM. Once the resuming is done it's as if the VM was never suspended.

In practice, a RAM enabled backup takes a **checkpoint** of the VM: a snapshot that includes both the disks and the memory contents. You can enable it per job with the snapshot mode setting, or per VM with the `xo-memory-backup` tag (see [backup modifier tags](#backup-modifier-tags)).

### Use cases

It is already possible to snapshot a VM with its RAM, however when restoring a VM, the VM was created in the `Halted` state so it wasn't possible to restore the VM with its RAM. With our XAPI modification a VM can now be created in a `Suspended` state with preset memory contents, so when snapshotting a VM with RAM, the snapshotted VM will also have the RAM contents set.

This can be very useful when you're running a VM that needs RAM coherence to run:

- For instance, snapshotting a Windows VM used to be very tricky for this reason. The Citrix VSS script previously answered part of this problem, when snapshotted, the VM flushed its cache but if it happened that the snapshot had coherence issues, the restored VM would be broken. And the VSS script is no longer available.
- VMs running databases could also need such a feature in order to keep transient transactions.
- A VM can be restored on a different host, now the RAM can be as well.

In a nutshell this functionality can be seen as _hot copy_, similar to _hot migration_ but the original VM is not deleted.

### Incremental replication with RAM {#continuous-replication-with-ram}

This feature allows you to regularly send a copy of a VM to a target SR. The copied VM will be `Suspended` and ready to be resumed if the original VM encounters issues. As the copied VM is `Suspended`, no reboot will be required, resuming it is much faster.

For instance, if an hourly incremental replication is configured on a VM, if the VM is lost, you can quickly resume a running VM with a memory loss of one hour tops.

:::warning
In order to use this functionality, the CPU of the host the VM is restored on should be the same or more recent than the CPU of the host the VM was originally running on.
:::

## Consistent backup

:::warning
Quiesced (VSS) snapshots are gone: the feature was removed from XCP-ng and Citrix Hypervisor, and Xen Orchestra no longer attempts them. Use [RAM enabled backup](#ram-enabled-backup) instead when you need consistency beyond a plain disk snapshot.
:::

All backup types rely on snapshots. But what about data consistency? Older XenServer releases could take a **quiesced snapshot** of a Windows VM: with the guest tools and the extra VSS provider installed, the operating system was notified and flushed its caches to disk before the snapshot, making backups of services like MS SQL or Exchange consistent. Xen Orchestra used to try a quiesced snapshot first and fall back to a normal snapshot when it wasn't possible.

Since the VSS provider was removed from the guest tools and the `snapshot_with_quiesce` capability was dropped from the platform, this mechanism no longer exists. Xen Orchestra now always takes normal snapshots, and offers two ways to get a stronger consistency level per VM:

- [RAM enabled backup](#ram-enabled-backup) (checkpoint): the memory is captured together with the disks, so caches and transient transactions are preserved.
- Offline snapshot or offline backup: the VM is cleanly shut down before the export, guaranteeing on-disk consistency.

Both can be applied per VM with [backup modifier tags](#backup-modifier-tags). Old quiesced snapshots taken before the removal are still identified by an "info" icon in the VM's Snapshots tab.

## Backup repositories (BR) {#remotes}

Backup repositories (BR), formerly called _remotes_, are places where your _backup_ and _delta backup_ files will be stored.

To add one, go to the **Settings/Remotes** menu (the XO 5 screens still use the former name).

Supported backup repository types:

- Local (any folder in XOA filesystem)
- NFS
- SMB (CIFS)
- Amazon S3 and S3-compatible object storage
- Microsoft Azure Blob Storage

:::warning

- The initial "/" or "\\" is automatically added.
- For disks larger than **2 TiB**, store backups on **block-based backup repositories**. Since QCOW2 reached general availability in XCP-ng, a single disk can grow up to **16 TiB**, so this matters more than ever.
- For **qcow2** disks, enable [NBD](./incremental_backups.md#nbd-enabled-backups) for incremental backups: without it, each run falls back to a full backup.

:::

### NFS

On your NFS server, authorize XOA's IP address and permissions for subfolders. That's all!

### SMB

We support SMB storage on _Windows Server 2012 R2_ and later.

:::warning
For continuous delta backup, SMB is **NOT** recommended (or only for small VMs, eg < 50GB)
:::

Also, read the UI twice when you add an SMB store. If you have:

- `192.168.1.99` as SMB host
- `Backups` as folder
- no subfolder

You'll have to fill it like this:

<UiDetail src="/img/xo5/smb-remote-settings.png" alt="New file system remote form for SMB: host and share on the first field, the optional path field left empty, then username, password and domain" width={480} />

:::warning
PATH TO BACKUP is only needed if you have subfolders in your share.
:::

### Local

:::warning
**This is for advanced users**. Using the local XOA filesystem without extra mounts/disks will **use the default system disk of XOA**.
:::

If you need to mount an unsupported store (FTP for example), you can always do it manually:

1. mount your storage inside the XOA filesystem manually, e.g in `/media/myStore`
2. in the web interface, select a "local" store and point it to your `/media/myStore` folder.

Any Debian Linux mount point could be supported this way, until we add further options directly in the web interface.

### Amazon S3

Xen Orchestra supports Amazon S3 storage and other S3-compatible providers, so you can back up your data to a variety of cloud storage services.

:::warning

- Not all S3-compatible providers adhere perfectly to Amazon S3 standards. Check the [supported object storage providers](../object-storage-support.md) list and its support tiers, and test your setup before trusting it with critical backups.
- Losing your encryption key means your backups will be permanently inaccessible. If you enable encryption, make sure your key is stored securely, and outside of the backed up infrastructure, as there's no way to recover your data without it.

:::

:::note
XO identifies itself to object storage providers with a `User-Agent: Xen Orchestra FS <version>` header, which helps S3-compatible services (Wasabi and others) with compatibility tracking.
:::

<UiDetail src="/img/xo5/s3-remote-settings.png" alt="New file system remote form with the Amazon Web Services S3 type selected: endpoint, region, bucket, directory, credentials and the optional encryption key" width={620} />

### Microsoft Azure

Xen Orchestra supports Microsoft Azure Blob Storage as a backup repository, as well as [Azurite](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azurite) (the Azure Storage emulator) for testing purposes.

To configure an Azure backup repository, you'll need:

- **Storage account name**, used as the username
- **Access key**, used as the password
- **Container**, the first segment of the path, used as the Blob container name

:::tip

- When using Azurite instead of real Azure, select the **Azurite** type and provide the emulator's host/port.
- Container names must be **lowercase**.

:::

<UiDetail src="/img/xo5/azure-remote-settings.png" alt="New file system remote form with the Azure type selected: host, account name, key, container and path" width={620} />

### Inspect and repair a BR from the command line {#backups-cli}

The `xo-backups` CLI (from the [`@xen-orchestra/backups-cli`](https://www.npmjs.com/package/@xen-orchestra/backups-cli) package) lets you explore the contents of a backup repository, verify backup sets and repair issues from a terminal, without going through the web interface:

<Terminal shell title="check and clean the VM backups of a repository">{`
npm install --global @xen-orchestra/backups-cli
xo-backups clean-vms --merge xo-vm-backups/*
`}</Terminal>

It also works against a whole repository URL (including S3, Azure or encrypted ones) with `--remote=<BR URL>`. Run `xo-backups --help` for the full command list.

## Restore a backup

All your scheduled backups are accessible in the "Restore" view in the backup section of Xen Orchestra.

1. Search the VM Name and click on the blue button with a white arrow
2. Choose the backup you want to restore
3. Select the SR where you want to restore it and click "OK"

:::tip
You can restore your backup even on a brand new host/pool and on brand new hardware.
:::

## Differential restore

Differential restores come in handy when you need to restore a VM to a storage unit that already contains your original VM, with **optimal restoration time**.

### How it works

Instead of performing a full restore, Xen Orchestra leverages the existing VM disk or snapshot as a foundation and restores only the differential data to a new disk. This method significantly cuts down on restore time, especially for large VMs. For instance, with a transfer rate of 60 MiB/s and a 200 GiB VM, a typical restore would take around an hour. However, with a differential restore, even a 600 GiB disk can be restored in just minutes.

Most importantly, this process prioritizes **data integrity**. The original VM disk remains untouched throughout the restore; we simply read from the latest snapshot to use it as a foundation for creating the new VM and disk.

### Step-by-step guide

:::warning

**Prerequisites**

Make sure the following conditions are met in order to do a differential restore:

- Restore the VM to the **same Storage Repository** that contains the VM to be restored.
- The backup you're restoring must be a **delta backup** (not a full backup).
- The delta chain, from the original snapshot to the backup you're restoring (excluding the base VM), must be **uninterrupted**.

:::

To perform a differential restore:

1. Go to the **Backup → Restore** menu.\
   A list of VMs appears.
2. Choose the VM you want to restore from the list. In the last column, click the **Restore** icon.\
   A pop-up window with a drop-down list appears.
3. Choose the backup you want to restore from the drop-down list.\
   More parameters appear, including a drop-down list for your destination Storage Repository (SR).
4. From that drop-down list, choose your destination SR.
5. Activate the switch called **Use differential restore**:

   <UiDetail src="/img/xo5/use-differential-restore.png" alt="The Restore VM modal with the Use differential restore switch enabled" width={620} />

6. Click **OK** to start the restore.

## File level restore

You can also restore specific files and directories inside a VM. It works with all your existing delta backups.

:::warning

- File level restore **is only possible on incremental backups**. Also, due to some technical limitations, you won't be able to do file level restore if you have a chain longer than 99 (ie retention longer than 99 records without any full between). Take a look at the [key backup interval section](./incremental_backups.md#key-backup-interval) to set this correctly.
- File level restore **is only possible on a single VDI**, it does not support LVM Volume Groups that span multiple VDIs.
- The following Microsoft solutions are **not supported**:
  - [Data Deduplication](https://learn.microsoft.com/en-us/windows-server/storage/data-deduplication/overview)
  - [Logical Disk Manager](https://en.wikipedia.org/wiki/Logical_Disk_Manager) (LDM)
  - [Resilient File System](https://learn.microsoft.com/en-us/windows-server/storage/refs/refs-overview) (ReFS)

:::

### Restore a file

1. Go to the **Backup → File restore** section:

   <UiShot light="/img/xo5/file-level-restore-list.png" alt="The File restore tab lists the VMs with available backups and their last backup date" url="https://your-xo/v5/#/backup/file-restore" />

2. Choose the VM whose files you want to restore and click the **Restore** icon at the corresponding line.
3. Follow the instructions as shown below:

   <UiDetail src="/img/xo5/file-level-restore-modal.png" alt="The Restore file modal: pick a backup, a disk, browse to the file, then choose the export format (tar+gzip or ZIP)" width={620} />

That's it! Your chosen file will be restored.

Alternatively, administrators can also restore files with the command-line interface. See [this guide](https://github.com/vatesfr/xen-orchestra/blob/master/%40vates/fuse-vhd/README.md#restore-a-file-from-a-vhd-using-fuse-vhd-cli) to know more.

## About backup compression

By default, _Backups_ are compressed (using GZIP or zstd, done on host side). There is no absolute rule but in general uncompressed backups are faster than GZIP backups (but sometimes much larger).

Citrix Hypervisor uses Gzip compression, which is:

- slow (single threaded)
- space efficient
- consumes less bandwidth (helpful if your NFS share is far away)

However, XCP-ng is using `zstd`, which is far better.

:::tip
If you have compression on your NFS share (or destination filesystem like ZFS), you can disable compression in Xen Orchestra.
:::

## Add a disk for local backups

If you want to use XOA to locally store all your backups, you need to attach a large disk to it. This can be done live.

First, after your disk is attached to XOA, you'll have to find the new disk name with `fdisk -l`. It's probably `xvdb`.

Then, create a filesystem on it:

<Terminal shell title="Format the new disk">{`mkfs.ext4 /dev/xvdb`}</Terminal>

If you already have backups done, you can move them to the new disk. The original backups folder is in `/var/lib/xoa-backups`.

To make the mount point persistent in XOA, edit the `/etc/fstab` file, and add:

```
/dev/xvdb /var/lib/xoa-backups ext4 defaults 0 0
```

This way, without modifying your previous scheduled snapshot, they will be written to this new local mountpoint!

## HA behavior

XCP-ng takes replicated VMs into account for High Availability. To avoid the resulting trouble (HA trying to restart your replicas), XO disables HA on the replicated VMs and adds a tag indicating this change.

A full replication replica, carrying the `Disaster Recovery` and `HA disabled` tags:

<UiDetail src="/img/xo5/disabled-dr-ha-tag.png" alt="A full replication replica: the VM carries the Disaster Recovery and HA disabled tags" width={620} />

An incremental replication replica, carrying the `Continuous Replication` and `HA disabled` tags:

<UiDetail src="/img/xo5/disabled-cr-ha-tag.png" alt="An incremental replication replica: the VM carries the Continuous Replication and HA disabled tags" width={620} />

:::tip
The tag won't be automatically removed by XO on the replicated VMs, even if HA is re-enabled.
:::

## Backup concurrency

Xen Orchestra 5.20 introduced new tools to manage backup concurrency. Below is an overview of the backup process and ways you can control concurrency in your own environment.

### Backup process

#### 1. Snapshot creation

When you perform a backup in XCP-ng/XenServer, the first operation performed is to "freeze" the data at a specific time - this is done by **making a snapshot**. This operation is pretty quick, only a few seconds in general. However it uses a lot of I/O on your storage, therefore more I/O activity means longer times to snapshot. Still, the order of magnitude is seconds per VM.

#### 2. Export

Xen Orchestra will fetch the content of the snapshot made in step 1. This operation can be very long, obviously depending on the size of the snapshot to export: exporting 1TiB of data will take far longer than exporting 1GiB!

#### 3. Snapshot removal

When it's done exporting, we'll remove the snapshot. Note: this operation will trigger a coalesce on your storage in the near future (a coalesce is required every time a snapshot is removed).

### Concurrency

Concurrency is a parameter that lets you define how many VMs your backup job will manage simultaneously.

:::tip

- Default concurrency value is 2 if left empty.

:::

Let's say you want to backup 50 VMs (each with 1x disk) at 3:00 AM. There are **2 different strategies**:

1. backup VM #1 (snapshot, export, delete snapshots) **then** backup VM #2 -> _fully sequential strategy_
2. snapshot all VMs, **then** export all snapshots, **then** delete all snapshots for finished exports -> _fully parallel strategy_

The first purely sequential strategy will lead to the fact that: **you can't predict when a snapshot of your data will occur**. Because you can't predict the first VM export time (let's say 3 hours), then your second VM will have its snapshot taken 3 hours later, at 6 AM.

:::tip
If you need your backup to be done at a specific time you should consider creating a specific backup task for this VM.
:::

Strategy number 2 is to parallelise: all the snapshots will be taken at 3 AM. However **it's risky without limits**: it means potentially doing 50 snapshots or more at once on the same storage. **Since XCP-ng/XenServer doesn't have a queue**, it will try to do all of them at once. This is also prone to race conditions and could cause crashes on your storage.

By default the _parallel strategy_ is, on paper, the most logical one. But you need to be careful and give it some limits on concurrency.

:::danger
High concurrency could impact your dom0 and network performances.
:::

You should be aware of your hardware limitation when defining the best concurrency for your XCP-ng infrastructure, never put concurrency too high or you could impact your VMs performances.
The best way to define the best concurrency for you is by increasing it slowly and watching the result on backup time.

So to summarize, if you set your concurrency at 6 and you have 20 VMs to backup the process will be the following:

- We start the backup of the first 6 VMs.
- When one VM backup has ended we will launch the next VM backup.
- We keep launching new VM backups until the 20 VMs are finished, keeping 6 backups running.

Removing the snapshot will trigger the coalesce process for the first VM, this is an automated action not triggered directly by the backup job.

## Backup modifier tags

When a backup job is configured using Normal snapshot mode, it's possible to use VM tags to apply a different snapshot mode to individual VMs.

- **xo-offline-backup** to apply offline snapshotting mode (VM will be shut down prior to snapshot, then restarted)
- **xo-memory-backup** to apply RAM-enabled snapshotting (checkpoint, see [RAM enabled backup](#ram-enabled-backup))
- **xo-backup-health-check-xenstore** to use a script during [backup health check](#backup-health-check)
- **xo:no-health-check** (or **xo:no-health-check=reason**) to ignore this VM during [backup health check](#backup-health-check)
- **xo:no-bak** (or **xo:no-bak=reason**) to exclude this VM from **all** backup jobs, even if it's explicitly selected. XO itself uses `xo:no-bak=Health Check` on the ephemeral VMs restored during health checks.

For example, you could have a regular backup job with 10 VMs configured with Normal snapshotting, including two which are database servers. Since database servers are generally more sensitive to being restored from snapshots, you could apply the **xo-memory-backup** tag to those two VMs and only those will be backed up in RAM-enabled mode. This will avoid the need to manage a separate backup job and schedule.

## Retention and scheduling

Just a refresher/summary: You can select multiple backup methods for the same job:

- Full: _Backup_ and _Full replication_ (the XO 5 button still reads _Disaster Recovery_)
- Deltas: _Delta Backup_ and _Incremental replication_ (the XO 5 button still reads _Continuous Replication_)

The Full and Delta options are mutually exclusive; Rolling Snapshots are compatible with both. The Backup and Delta Backup go to a backup repository (e.g. NFS); both replication modes write to another XCP-ng storage repository (i.e., not the one on which the VMs being backed up reside). In the Schedule configuration, you will have the option to select the number of "Backup Retention" if your backup includes a _Backup_ (or _Delta Backup_); you will have the option to select the number "Replication Retention" if you have selected a replication mode in the backup configuration.

### Rolling snapshots

This feature is close to Backups, but it creates a snapshot when planned to do so. It also handles the retention (to remove the oldest snapshot).

:::warning
Snapshots are not backups. They help to roll back to a previous state, but all snapshots are on the same Storage than their original disk. If you lose the original VDI (or the SR), you'll **lose all your snapshots**.
:::

Vates recommends keeping the Rolling Snapshots retention to a minimum; if you check **Dashboard → Health**, you'll see a table for 'Too Many Snapshots', which shows VMs that have more than 5 snapshots saved. This includes the snapshots used for any kind of backup, not simply the rolling snapshots.

To know more, read this [blog article](https://xen-orchestra.com/blog/xen-orchestra-4-2/#schedulerollingsnapshots).

### Retention of backups and replications {#retention-of-backups-and-cr-dr}

If your backup includes both a (Delta) Backup _and_ a replication, you will have the option to select the number you wish for both "Backup retention" and "Replication retention" in the Schedule configuration; make sure to assign the number you want to the correct retention.

If you need to restore a (Delta) Backup (or clone and spin up a VM from a replica), you will be able to select all the available backups or VMs, regardless of the retention or delta scheme. If you have multiple backup jobs backing up the same VM, you'll see all the backups in the restore list, sorted by date.

### Decreasing retention frequency with age

It is often a good idea to configure retention of older backups with decreasing frequency. For example, you may want a nightly backup, but you don't want 365 backups to be able to restore from a year ago. The solution is to set several different schedules/retention policies for the same backup job. A reasonable approach might be to schedule...

- a nightly backup, except on Sunday (retaining 6)
- a weekly backup on Sunday (retaining 4)
- a monthly backup (retaining 12)

Again, all of these can be assigned to the same backup job. Note that if you do a weekly and a monthly backup, at some point, these will fall on the same day. Xen Orchestra is designed to fail gracefully (with an error message) if a backup job for a VM is already running. For this reason, you will want to set the time on the monthly job to run before the weekly job so that if one fails, it will be the weekly rather than the monthly one; if the weekly one fails, the monthly will be there for that spot in the retention plan; if the monthly one fails, the weekly one will only be retained for 4 weeks, and then there will be a gap in the monthly retention.

### Long-term backup retention with GFS strategy

Xen Orchestra supports the **Grandfather-Father-Son (GFS)** backup retention strategy, providing an efficient way to manage long-term backups. Backups are organized into daily, weekly, monthly and yearly intervals, optimizing storage while keeping important recovery points over time.

<Schema label="GFS on a month of nightly runs, with 7 daily, 4 weekly and 1 monthly restore points kept" legend={[["#56c288", "daily"], ["#6aabf0", "weekly"], ["#e0a94a", "monthly"], ["#7a8699", "rotated out"]]} maxWidth="640px">
<svg viewBox="0 0 640 232" role="img" aria-label="A calendar of 28 nightly backups: the last 7 are kept as daily restore points, the first backup of each week is kept as a weekly one, the first of the month as a monthly one, and every other backup is rotated out">
  <g fontSize="11" fill="#7a8699">
    <text x="24" y="69">week 1</text>
    <text x="24" y="111">week 2</text>
    <text x="24" y="153">week 3</text>
    <text x="24" y="195">week 4</text>
  </g>
  {/* Rotated-out runs (dim) */}
  <g opacity="0.35">
    <g fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.28)">
      <rect x="156" y="50" width="40" height="28" rx="4"/><rect x="222" y="50" width="40" height="28" rx="4"/><rect x="288" y="50" width="40" height="28" rx="4"/><rect x="354" y="50" width="40" height="28" rx="4"/><rect x="420" y="50" width="40" height="28" rx="4"/><rect x="486" y="50" width="40" height="28" rx="4"/>
      <rect x="156" y="92" width="40" height="28" rx="4"/><rect x="222" y="92" width="40" height="28" rx="4"/><rect x="288" y="92" width="40" height="28" rx="4"/><rect x="354" y="92" width="40" height="28" rx="4"/><rect x="420" y="92" width="40" height="28" rx="4"/><rect x="486" y="92" width="40" height="28" rx="4"/>
      <rect x="156" y="134" width="40" height="28" rx="4"/><rect x="222" y="134" width="40" height="28" rx="4"/><rect x="288" y="134" width="40" height="28" rx="4"/><rect x="354" y="134" width="40" height="28" rx="4"/><rect x="420" y="134" width="40" height="28" rx="4"/><rect x="486" y="134" width="40" height="28" rx="4"/>
    </g>
    <g fontSize="12" fill="#c6d2e1" textAnchor="middle">
      <text x="176" y="68">2</text><text x="242" y="68">3</text><text x="308" y="68">4</text><text x="374" y="68">5</text><text x="440" y="68">6</text><text x="506" y="68">7</text>
      <text x="176" y="110">9</text><text x="242" y="110">10</text><text x="308" y="110">11</text><text x="374" y="110">12</text><text x="440" y="110">13</text><text x="506" y="110">14</text>
      <text x="176" y="152">16</text><text x="242" y="152">17</text><text x="308" y="152">18</text><text x="374" y="152">19</text><text x="440" y="152">20</text><text x="506" y="152">21</text>
    </g>
  </g>
  {/* Weekly keeps: first backup of each week */}
  <g fill="rgba(106,171,240,0.14)" stroke="#6aabf0" strokeWidth="1.5">
    <rect x="90" y="50" width="40" height="28" rx="4" fill="rgba(224,169,74,0.16)" stroke="#e0a94a"/>
    <rect x="90" y="92" width="40" height="28" rx="4"/>
    <rect x="90" y="134" width="40" height="28" rx="4"/>
  </g>
  <text x="110" y="42" fontSize="10" fill="#e0a94a" textAnchor="middle">monthly</text>
  {/* Daily keeps: the last 7 runs */}
  <g fill="rgba(86,194,136,0.14)" stroke="#56c288" strokeWidth="1.5">
    <rect x="90" y="176" width="40" height="28" rx="4" strokeWidth="2.4" stroke="#6aabf0" fill="rgba(86,194,136,0.14)"/>
    <rect x="156" y="176" width="40" height="28" rx="4"/><rect x="222" y="176" width="40" height="28" rx="4"/><rect x="288" y="176" width="40" height="28" rx="4"/><rect x="354" y="176" width="40" height="28" rx="4"/><rect x="420" y="176" width="40" height="28" rx="4"/><rect x="486" y="176" width="40" height="28" rx="4"/>
  </g>
  <g fontSize="12" fill="#c6d2e1" textAnchor="middle">
    <text x="110" y="68">1</text>
    <text x="110" y="110">8</text>
    <text x="110" y="152">15</text>
    <text x="110" y="194">22</text><text x="176" y="194">23</text><text x="242" y="194">24</text><text x="308" y="194">25</text><text x="374" y="194">26</text><text x="440" y="194">27</text><text x="506" y="194">28</text>
  </g>
  <text x="560" y="194" fontSize="11" fill="#56c288">today</text>
  <text x="320" y="224" fontSize="10.5" fill="#7a8699" textAnchor="middle">day 1 counts as monthly and weekly · day 22 counts as weekly and daily</text>
</svg>
</Schema>

#### FAQ

- **What happens if I change my GFS retention policy?**\
  Excess backups will be deleted during the next job execution to match the updated retention settings.

- **Is GFS retention applied globally or per repository?**\
  GFS retention is applied on a per-repository basis, allowing you to manage retention independently for different storage locations.

- **How does Xen Orchestra decide which backups to retain?**\
  The oldest backup within each retention period (daily, weekly, monthly or yearly) is preserved. For example, the first backup of the week is saved as the weekly backup.

:::warning

- **Definition of a week:**\
  The start of the week is computed with the timezone set in the schedule.
- **What GFS isn't:**\
  GFS in Xen Orchestra stands for Grandfather-Father-Son. It's a backup strategy, and is not related to the file system called GFS2 (or Global File System 2), supported by XenServer.
- GFS retention is defined per schedule. For example, if a backup has two schedules, two independent GFS backups will be created. This is why we recommend using a single schedule for any job utilizing GFS long-term retention.

:::

#### Enabling GFS retention

To enable GFS retention:

1. Go to the **Backup** menu.
2. Create a new backup job or open an existing one.
3. Click the **Backup** or **Delta Backup** button.\
   The section called **Long-term retention of backups** appears.
4. In that section, you can define the following:

- **Daily backups**: The number of daily backups to keep.
- **Weekly backups**: The number of weekly backups to keep.
- **Monthly backups**: The number of monthly backups to keep.
- **Yearly backups**: The number of yearly backups to keep.

5. Click the **Save** button.

During each backup run, Xen Orchestra evaluates existing backups and removes any excess backups based on the configured policy.

### Implementation in Xen Orchestra

To enable GFS retention, configure the settings in the backup job's "Long-term retention of backups" section. During each backup run, Xen Orchestra evaluates existing backups and removes any excess backups based on the configured policy.

## Backup health check

Backup health check ensures the backups are ready to be restored: after a run, XO restores the backup for real, boots it, and only marks it healthy if the guest comes up.

<Schema label="Health check: every step a real restore would take, run automatically" legend={[["#e0a94a", "backup"], ["#6aabf0", "test VM"], ["#56c288", "verified"]]} maxWidth="640px">
<svg viewBox="0 0 640 140" role="img" aria-label="A backup stored on the backup repository is restored as a test VM, booted until the guest tools respond, then the test VM is deleted and the backup run is marked healthy">
  <rect x="14" y="38" width="132" height="58" rx="8" fill="rgba(224,169,74,0.12)" stroke="#e0a94a"/>
  <text x="80" y="63" fontSize="12.5" fill="#c6d2e1" textAnchor="middle">backup on BR</text>
  <text x="80" y="81" fontSize="10" fill="#7a8699" textAnchor="middle">or replica on SR</text>
  <g className="schema-flow" stroke="#6aabf0" strokeWidth="1.5" strokeDasharray="5 4">
    <line x1="146" y1="67" x2="176" y2="67"/>
  </g>
  <polygon points="182,67 174,63 174,71" fill="#6aabf0"/>
  <text x="163" y="54" fontSize="9.5" fill="#6aabf0" textAnchor="middle">restore</text>
  <rect x="184" y="38" width="118" height="58" rx="8" fill="rgba(106,171,240,0.12)" stroke="#6aabf0"/>
  <text x="243" y="63" fontSize="12.5" fill="#c6d2e1" textAnchor="middle">test VM</text>
  <text x="243" y="81" fontSize="10" fill="#7a8699" textAnchor="middle">on the chosen SR</text>
  <g className="schema-flow" stroke="#6aabf0" strokeWidth="1.5" strokeDasharray="5 4">
    <line x1="302" y1="67" x2="332" y2="67"/>
  </g>
  <polygon points="338,67 330,63 330,71" fill="#6aabf0"/>
  <text x="319" y="54" fontSize="9.5" fill="#6aabf0" textAnchor="middle">boot</text>
  <rect x="340" y="38" width="158" height="58" rx="8" fill="rgba(106,171,240,0.12)" stroke="#6aabf0"/>
  <text x="419" y="58" fontSize="12.5" fill="#c6d2e1" textAnchor="middle">guest tools up</text>
  <text x="419" y="74" fontSize="10" fill="#7a8699" textAnchor="middle">within 10 minutes</text>
  <text x="419" y="89" fontSize="10" fill="#7a8699" textAnchor="middle">or your script's verdict</text>
  <g className="schema-flow" stroke="#56c288" strokeWidth="1.5" strokeDasharray="5 4">
    <line x1="498" y1="67" x2="524" y2="67"/>
  </g>
  <polygon points="530,67 522,63 522,71" fill="#56c288"/>
  <rect x="532" y="38" width="94" height="58" rx="8" fill="rgba(86,194,136,0.14)" stroke="#56c288"/>
  <text x="579" y="63" fontSize="12.5" fill="#56c288" textAnchor="middle">healthy ✓</text>
  <text x="579" y="81" fontSize="10" fill="#7a8699" textAnchor="middle">test VM deleted</text>
  <text x="320" y="122" fontSize="10.5" fill="#7a8699" textAnchor="middle">a VM without guest tools fails the check · failures show up in the job report</text>
</svg>
</Schema>

### Different level of checking

#### Check for boot

XO will restore the VM, either by downloading it for a delta/full backup or by cloning it for a full or incremental replication, start it, and then wait for the guest tools to be loaded before the end of a timeout of 10 minutes (boot + guest tools).

A VM without guest tools will fail its health check.

The restored VM is then deleted.

#### Execute a script

If a VM has the tag **xo-backup-health-check-xenstore** during a backup health check, then XO will wait for a script to change the value of the xenstore `vm-data/xo-backup-health-check` key to be either `success` or `failure`.

In case of `failure`, it will mark the health check as failed, and will show the (optional) message contained in `vm-data/xo-backup-health-check-error`.

The script needs to be planned on boot. It can check if the record `vm-data/xo-backup-health-check` of the local xenstore contains `planned`
to differentiate a normal boot and a boot during health check.
On success it must write `success` in `vm-data/xo-backup-health-check`.
On failure it must write `failure` in `vm-data/xo-backup-health-check`, and may optionally add details in `vm-data/xo-backup-health-check-error`.

The total timeout of a backup health check (boot + guest tools + scripts) is 10 minutes.

The restored VM is then deleted.

An example script in shell is available in the repository: [`@xen-orchestra/backups/docs/healthcheck/example.sh`](https://github.com/vatesfr/xen-orchestra/blob/master/%40xen-orchestra/backups/docs/healthcheck/example.sh)

### Running health checks

#### Checking a backup

Go to **Backup → Restore** and click on the tick icon to launch a health check.

<UiShot light="/img/xo5/restore-health-check.png" alt="The Restore tab: each backup row ends with the health check (tick), restore and delete buttons" url="https://your-xo/v5/#/backup/restore" />

Then, you will select the backup to be checked and a destination SR, which must have enough space for the full restore.

#### Scheduling health check after backups

Go to **Backup → Overview** and edit your job.

Then edit the schedule and check the **Health check** box.

<UiDetail src="/img/xo5/schedule-health-check.png" alt="The Schedule form with Health check enabled: optional VM tags filter and the SR used for the test restore" width={620} />

You will then need to select the SR used, which must have enough space to restore the VMs. Health check will be done after each VM backup, before starting the next one.

You can filter the VMs list by providing tags, only the VMs with these tags will be checked.
