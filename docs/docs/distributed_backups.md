# Distributed backups

Distributed backups let you spread backup and replication workloads across multiple storage targets, treating them as a pool rather than independent destinations.

By default, when a backup job has several backup repositories (BR) or storage repositories (SRs) configured, each VM backup is written to **every** target. With distributed mode enabled, each VM backup is written to **exactly one** target per run, selected automatically based on available space.

<Schema label="Distributed mode: one backup job, and each VM backup lands on a single BR, picked for its free space at run time" legend={[["#56c288", "VM backup"], ["#5ac8c8", "Transfer"], ["#e0a94a", "BR"]]} maxWidth="640px">
<svg viewBox="0 0 640 220" role="img" aria-label="Three VMs in one backup job each send their backup to exactly one of three backup repositories of different sizes, instead of every backup going to every target">
  <text x="32" y="26" fill="#c6d2e1" fontSize="12">Backup job</text>
  <rect x="24" y="34" width="170" height="170" rx="10" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5" />
  <rect x="40" y="54" width="138" height="36" rx="6" fill="rgba(255,255,255,0.04)" stroke="#56c288" />
  <text x="109" y="76" fill="#c6d2e1" fontSize="12" textAnchor="middle">VM 1</text>
  <rect x="40" y="104" width="138" height="36" rx="6" fill="rgba(255,255,255,0.04)" stroke="#56c288" />
  <text x="109" y="126" fill="#c6d2e1" fontSize="12" textAnchor="middle">VM 2</text>
  <rect x="40" y="154" width="138" height="36" rx="6" fill="rgba(255,255,255,0.04)" stroke="#56c288" />
  <text x="109" y="176" fill="#c6d2e1" fontSize="12" textAnchor="middle">VM 3</text>
  <text x="440" y="26" fill="#c6d2e1" fontSize="12">Backup repositories (BR)</text>
  <rect x="440" y="34" width="120" height="44" rx="6" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="500" y="53" fill="#c6d2e1" fontSize="12" textAnchor="middle">BR 1</text>
  <text x="500" y="68" fill="#7a8699" fontSize="10" textAnchor="middle">500 GiB free</text>
  <rect x="440" y="94" width="180" height="52" rx="6" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="530" y="116" fill="#c6d2e1" fontSize="12" textAnchor="middle">BR 2</text>
  <text x="530" y="132" fill="#7a8699" fontSize="10" textAnchor="middle">2 TiB free (most)</text>
  <rect x="440" y="160" width="150" height="44" rx="6" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="515" y="179" fill="#c6d2e1" fontSize="12" textAnchor="middle">BR 3</text>
  <text x="515" y="194" fill="#7a8699" fontSize="10" textAnchor="middle">1.2 TiB free</text>
  <line x1="178" y1="72" x2="428" y2="112" stroke="#5ac8c8" strokeWidth="1.5" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="437,113 427,109 428,119" fill="#5ac8c8" />
  <line x1="178" y1="122" x2="428" y2="178" stroke="#5ac8c8" strokeWidth="1.5" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="437,180 427,175 428,185" fill="#5ac8c8" />
  <line x1="178" y1="172" x2="428" y2="60" stroke="#5ac8c8" strokeWidth="1.5" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="437,56 427,55 429,65" fill="#5ac8c8" />
  <text x="308" y="46" fill="#7a8699" fontSize="10" textAnchor="middle">1 VM backup, 1 target</text>
  <text x="308" y="216" fill="#7a8699" fontSize="10" textAnchor="middle">default mode: every backup goes to every target</text>
</svg>
</Schema>

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

### Distributed backups (backup repositories) {#distributed-backups-remotes}

1. Go to **Backup → New backup job** or edit an existing one.
2. Configure at least two backup repositories in the **Backup repositories** section.
3. In the **Advanced** settings, enable **Distribute backups across backup repositories**.

This applies to both **Full backup** and **Incremental (Delta) backup** job types.

### Distributed replications (SRs)

1. Go to **Backup → New backup job** or edit an existing one.
2. Configure at least two storage repositories in the **Replication** section.
3. In the **Advanced** settings, enable **Distribute replications across storage repositories**.

This applies to both **Full replication** and **Incremental replication** job types (the XO 5 interface still labels them **Disaster Recovery** and **Continuous Replication**).

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
| Minimum 2 targets required         | The option is greyed out in the UI unless at least 2 BRs or SRs are selected.                                                                                           |
| Not usable as mirror source        | A job with distributed backup enabled cannot be used as the source for a [Mirror Backup](./mirror_backup.md) job.                                                             |
| No duplication                     | Distributed mode and per-target duplication are mutually exclusive in the same job. Each VM backup lands on exactly one target.                                             |
| No cross-target restore dependency | Each VM backup is self-contained on its target. Restoring from one target does not require any other target to be available.                                                |
