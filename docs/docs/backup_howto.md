# Backup strategy guide

This guide explains how to design and implement a backup strategy in Xen Orchestra.

Instead of a simple list of questions and answers, it walks you through **key decisions** and **best practices** before, during, and after setting up backups.


## Glossary

This part explains the terminology of backup types and features.

- [**Backup sequence**](xo5/backups.md#sequences): A feature that allows you to chain multiple backup jobs to run one after the other, automatically.
- [**Backup repository (BR)**](xo5/backups.md#remotes): Formerly called _Remote_. A storage location for backups. For instance:
  - Local storage (not recommended)
  - NFS
  - SMB
  - Amazon S3 and compatible
  - Microsoft Azure
  - Azurite
- [**File restore**](xo5/backups.md#restore-a-file): A feature that allows you to restore individual files from a VM backup without restoring the full VM.
- [**Full backup**](full_backups.md): Copies the entire VM to backup repositories each time, regardless of previous backups.
- [**Full replication**](full_replication.md): Creates a replica of a VM on other storage repositories (on the same pool or on another) by copying it completely on each run.
- [**Incremental backup**](xo5/incremental_backups.md): Transfers and stores only the changes since the last backup to backup repositories, reducing storage and network needs. The first run transfers the VM completely.
- [**Incremental replication**](xo5/incremental_replication.md): Transfers and stores only the changes since the last backup to storage repositories (on the same pool or on another), reducing network needs. The first run transfers the VM completely.
- [**Long-term retention**](xo5/backups.md#long-term-backup-retention-with-gfs-strategy): Keeps backups over extended periods (weeks, months, or years) for compliance or archival purposes.
- [**Mirror backup**](mirror_backup.md): Mirror a backup repository to another. Retention and encryption of source and destination can be different.
- [**Distributed backup and replication**](distributed_backups.md): Distribute the backups and replications across multiple targets.


## What should I do before setting up my backup?

Before creating your first backup job in Xen Orchestra, consider the following:

### Backup repository {#remote}

Choose and configure your backup repository (BR).

- Supported types: NFS, SMB/CIFS, S3-compatible object storage, Microsoft Azure, or local storage.
- Ensure proper permissions and network connectivity.
- Test write/read performance before relying on it.
- If you're using block storage, check whether your solution supports encryption (for data-at-rest protection) and immutability (to prevent backups from being modified or deleted, even by mistake or maliciously).

### Resources available

- **Storage**: Calculate how much space will be required based on your backup type and retention.
- **Network**: Backups are network-intensive; ensure sufficient bandwidth.
- **Compute**: Avoid backup schedules that overlap with heavy VM workloads.

### Criticality

Identify which VMs are business-critical. These should have more frequent backups and possibly replications for minimal downtime.

### Retention

Determine how long backups should be kept. This depends on:

- Compliance requirements
- Recovery Point Objective (RPO)
- Recovery Time Objective (RTO)
- Storage capacity


## What kind of backup should I set up?

Here is the whole toolbox at a glance. Most infrastructures combine several of these: for example incremental backups for everything, plus incremental replication for the critical VMs, plus a mirror to an offsite repository.

| Type                                                       | What you get                                | Storage & network cost      | Restore                          | Typical use                            |
| ---------------------------------------------------------- | ------------------------------------------- | --------------------------- | -------------------------------- | -------------------------------------- |
| [Rolling snapshots](rolling_snapshots.md)                | Instant restore points, on the same storage | SR space only               | Instant revert                   | Oops protection, before risky changes  |
| [Full backup](full_backups.md)                           | Complete standalone archive on a BR         | High, every run             | Simple, anywhere                 | Small fleets, simplicity first         |
| [Incremental backup](xo5/incremental_backups.md)             | Compact archives after the first full       | Low per run                 | Whole VM or single files         | The default choice for most VMs        |
| [Full replication (DR)](full_replication.md)             | Boot-ready copy on another host/SR          | High, every run             | Start the copy                   | DR with a modest RPO                   |
| [Incremental replication (CR)](xo5/incremental_replication.md) | Boot-ready copy, updated by deltas        | Low per run                 | Clone and start                  | Low-RPO DR for critical VMs            |
| [Mirror backup](mirror_backup.md)                        | A second copy of a backup repository        | Follows the source          | Same as the source backups       | 3-2-1 strategies, offsite archives     |
| [Metadata backup](xo5/metadata_backup.md)                    | XO config and pool metadata                 | Tiny                        | Rebuild your orchestration       | Always: it protects the tool itself    |

:::note The two replication modes have been renamed
**Full replication** used to be called **Disaster Recovery (DR)**, and **incremental replication** used to be called **Continuous Replication (CR)**. Only the names changed. The old ones are kept in parentheses here because you will still meet them: the XO 5 interface labels the two buttons **Disaster Recovery** and **Continuous Replication**, and XO tags replicas accordingly. XO 6 uses the current names.
:::

### Rolling snapshots

Scheduled snapshots with a retention, kept on the VM's own storage.

- **Pros**: instant creation and instant revert, no repository needed.
- **Watch out**: snapshots live on the same storage as the VM. Lose the SR, lose the snapshots: this is **not** a backup on its own.
- **First steps**: schedule a nightly snapshot with a retention of 7 on the VMs you touch often.

### Full backup

A complete export of each VM to a backup repository, on every run.

- **Pros**: each archive is independent and self-contained, restores are trivial, only allocated blocks are transferred, and Zstd compression is available (XCP-ng 8.1 and newer).
- **Watch out**: the most storage- and bandwidth-hungry option; no deduplication between runs.
- **First steps**: configure a reliable repository with generous capacity, and schedule runs during low I/O periods.

### Incremental backup

After an initial full, only the changed blocks are exported.

- **Pros**: fast runs, small transfers, restore to any date, [file-level restore](xo5/backups.md#file-level-restore), works well at high frequency.
- **Watch out**: restores rely on a chain (full + deltas): set a [full backup interval](xo5/incremental_backups.md#key-backup-interval) to keep chains short, or enable health checks.
- **First steps**: this is the right default for most VMs; start here if in doubt.

### Full replication (formerly Disaster Recovery, DR) {#full-replication-dr}

A complete, boot-ready copy of the VM on another host or SR, refreshed on each run.

- **Pros**: the standby VM is ready to start; ideal for straightforward disaster recovery.
- **Watch out**: full transfer each time: run it less frequently than incremental replication, and mind SR space on the destination.
- **First steps**: configure the destination storage (same pool or another), then **test the failover** for real.

### Incremental replication (formerly Continuous Replication, CR) {#incremental-replication-cr}

The same standby copy, kept up to date by sending only the deltas.

- **Pros**: low RPO (down to minutes), quick failover, no vendor lock-in, no intermediate storage.
- **Watch out**: needs a secondary host or pool; keep the chain short (full backup interval < 10); not an archival method.
- **First steps**: reserve it for the VMs whose data loss tolerance is measured in minutes.

### Mirror backup

Replicates an existing backup repository to another one, possibly with different retention, encryption or compression.

- **Pros**: the natural building block of a [3-2-1 strategy](#long-term-retention-strategy); the second copy can live on slower, cheaper storage.
- **Watch out**: one job mirrors either full or incremental backups, not both: two jobs if your source repository holds both.
- **First steps**: set up a dedicated destination repository, then test a restore from the mirror itself.

### Sequence

Not a backup type, but the way to chain the jobs above: a [sequence](xo5/backups.md#sequences) runs several schedules one after the other, in a fixed order.

- **Pros**: deterministic ordering (backup first, then replication), no overlapping jobs competing for resources.
- **First steps**: identify the right order, and test the sequence on non-critical VMs first.

## What settings are available?

### Advanced settings

- **Compression**: Reduces backup size at the cost of CPU usage and backup speed.
- **Encryption**: Protects backup data at rest.
- **Concurrency**: Controls how many VMs run in parallel in this backup job.
- **Retention policy**: Fine-tunes how many backups to keep over certain periods of time.
- **Full backup interval**: Defines the maximum backup chain size (only for delta backups and incremental replications).

:::tip

- **Compression** is configured at the backup job level, and applies only to full backups. For full backups, prefer [Zstandard (Zstd)](https://en.wikipedia.org/wiki/Zstd) if your host supports it.
- **Encryption** is configured at the backup repository level, not per individual backup job. To use encryption with incremental backups, the **use VHD blocks** setting must be enabled.
- Setting a **Full backup interval** prevents infinite backup chains, which may degrade resilience against block corruption over time. We recommend either defining a regular interval or enabling health checks for your incremental backup and incremental replication jobs.
:::


## Restore options

### VM restore

- Restore a VM to the same host/pool or another location.
- When restoring, Xen Orchestra can attempt a **differential restore**, which reuses the current VM disk to speed up the process.

### File restore

- Access individual files within a VM backup
- Ideal for quick recovery of deleted or corrupted files without a full VM restore

### Limitations

The file restore feature includes the following constraints:

- **Supported partition types** are limited to those compatible with Debian systems and NTFS. ReFS and Windows dynamic disks are not supported.
- **LVM support** is limited and may fail in certain edge cases.
- File restore is designed for **small file sets** and is not suitable for large-scale recovery.

:::tip
For **advanced scenarios**, you can use the `fuse-vhd` helper script to manually mount backup chains as raw disks and perform partition discovery:
[View fuse-vhd on GitHub](https://github.com/vatesfr/xen-orchestra/tree/master/%40vates/fuse-vhd).
:::


## Long-term retention strategy

For compliance or archival needs, you rarely want *every* daily backup kept for years: you want something like 7 dailies, 4 weeklies, 12 monthlies, a few yearlies. This is the **GFS (Grandfather-Father-Son)** scheme, configured directly in the retention settings of a backup job: see [Long-term backup retention with GFS](xo5/backups.md#long-term-backup-retention-with-gfs-strategy).

- Define retention periods based on compliance and operational needs
- Size the required storage with the [retention calculator](calculator.md)
- Regularly test restore from long-term backups

:::warning
To prevent backup duplication, do not mix long-term retention with multiple schedules.
:::


## Putting it all together

When designing your backup strategy with Xen Orchestra:

1. Assess criticality and resources.
2. Choose backup types that match your RPO/RTO goals.
3. Configure backup repositories and test them.
4. Set up schedules to avoid peak loads.
5. Apply retention policies.
6. Test restores regularly.


## How to ensure XOA is always available

Making sure XOA is always available should be a top priority for every administrator. Here’s how you can maximize its reliability:

Since XOA runs as a virtual machine, you can apply standard VM protection measures:

- Back up regularly (full or incremental).
- Replicate the VM (full replication or incremental replication).
- Take snapshots for quick rollback if needed.

### Specific steps for the XOA VM

- **Back up XO backup metadata:** This is the most efficient way to ensure you can quickly restore your XOA environment. If you lose your XOA VM: download and install a new XOA, restore the XO backup metadata, and you’ll be able to restore all other backups and settings.
- Use the **XO Config** feature to back up your XOA settings. This lets you restore them to any XOA VM if necessary.

### Managing the loss of your XOA VM

If you lose the host running your XOA VM:

- **If the XOA VM was on shared storage**, you can restart it on another host in your pool.
- **If the XOA VM was stored locally** or your host was alone in its pool, deploy a new XOA VM. You can do this proactively, as there’s no limit to the number of XOA VMs in your infrastructure. Register the new VM with the same Vates account, update it, and migrate your XOA license from the old VM if needed.
- **If you are running XCP-ng 8.3**, you can use XO-lite by connecting to your master host’s IP address to manage your VMs.

:::warning
Avoid using multiple XOAs to back up the same VMs, as this can cause backup failures.
:::
