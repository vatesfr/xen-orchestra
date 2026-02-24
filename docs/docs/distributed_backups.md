# Distributed Backups

Distributed backups let you spread backup and replication workloads across multiple storage targets, treating them as a pool rather than independent destinations.

By default, when a backup job has several remotes or storage repositories (SRs) configured, each VM backup is written to **every** target. With distributed mode enabled, each VM backup is written to **exactly one** target per run, selected automatically based on available space.

This is useful to:

- Pool multiple smaller storage units without duplicating data across them
- Scale backup capacity by simply adding more targets
- Isolate failures: a storage issue on one target only affects the backups stored there

:::warning
Distributed backups are about **capacity spreading**, not redundancy. A VM's backup exists on only one target at a time. This counts as a single copy in a 3-2-1 backup strategy.
:::

## Requirements

- At least **2** backup repositories (for backup distribution) or **2** SRs (for replication distribution)
- All targets must be of the **same storage class**: either all capacity-limited (NFS, Local, SMB) or all unlimited (S3, Azure Blob). Mixing these types in a single pool is not supported.

## Setup

### Distributed backups (remotes)

1. Go to **Backup → New backup job** or edit an existing one.
2. Configure at least two backup repositories in the **Backup repositories** section.
3. In the **Advanced** settings, enable **Distribute backups across backup repositories**.

This applies to both **Full backup** and **Incremental (Delta) backup** job types.

### Distributed replications (SRs)

1. Go to **Backup → New backup job** or edit an existing one.
2. Configure at least two storage repositories in the **Replication** section.
3. In the **Advanced** settings, enable **Distribute replications across storage repositories**.

This applies to both **Disaster Recovery (DR)** and **Continuous Replication (CR)** job types.

## How target storage is selected

At each backup run, Xen Orchestra selects a target for each VM independently using the following logic:

### When all targets report available space (NFS, Local, SMB)

The target with the **most free space** is preferred. If several targets are tied at the same maximum free space, one is selected **at random** among them.

### When no target reports available space (S3, Azure Blob)

Since unlimited or quota-less storage cannot report free space, a target is selected **at random** from all configured targets.

### For incremental backup chains

Incremental backups depend on a chain of delta files. Xen Orchestra enforces chain continuity:

- **Existing chains**: new delta blocks are always written to the **same target** that holds the existing chain for that VM. The target selection algorithm is bypassed for these VMs.
- **New full backup chains**: when starting a new chain (e.g. after retention merges or a forced full backup), the target is selected using the free-space algorithm described above.

This means a VM's incremental chain may migrate to a different target only when a full backup is triggered.

## Retention

Retention is calculated **globally** across all targets combined. When old backups need to be deleted, each backup is removed from the specific target it was stored on. A backup job configured with a retention of 7 will keep the 7 most recent backups in total, regardless of which target holds each one.

## Health checks

When a health check is scheduled, it runs only against the target that holds the specific backup being checked.

## Limitations

| Limitation                         | Details                                                                                                                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cannot mix storage classes         | A pool cannot combine limited-capacity targets (NFS, Local, SMB) with unlimited targets (S3, Azure Blob). Xen Orchestra will throw an error at the start of the backup run. |
| Minimum 2 targets required         | The option is greyed out in the UI unless at least 2 remotes or SRs are selected.                                                                                           |
| Not usable as mirror source        | A job with distributed backup enabled cannot be used as the source for a [Mirror Backup](mirror_backup.md) job.                                                             |
| No duplication                     | Distributed mode and per-target duplication are mutually exclusive in the same job. Each VM backup lands on exactly one target.                                             |
| No cross-target restore dependency | Each VM backup is self-contained on its target. Restoring from one target does not require any other target to be available.                                                |
