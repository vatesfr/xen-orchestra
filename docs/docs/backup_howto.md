# Backup strategy guide

This guide explains how to design and implement a backup strategy in Xen Orchestra.  

Instead of a simple list of questions and answers, it walks you through **key decisions** and **best practices** before, during, and after setting up backups.

---

## Glossary

This part explains the terminology of backup types and features.

- **Backup sequence**: A feature that allows you to chain multiple backup jobs to run one after the other, automatically. 
- [**File restore**](./backups#restore-a-file): A feature that allows you to restore individual files from a VM backup without restoring the full VM.
- [**Full backup**](./full_backups): Copies the entire VM to  backup repositories each time, regardless of previous backups. 
- [**Full replication**](./full_replication): Creates a replica of a VM on other storage repositories (on the same pool or on another) by copying it completly on each run.
- [**Incremental backup**](./incremental_backups): Transfer and stores only the changes since the last backup to a backup repositories , reducing storage and network needs. The first transfer transfers the VM completly.
- [**Incremental replication**](./incremental_replication): Transfer and stores only the changes since the last backup to a stroage repositories (on the same pool or on another), reducing network needs. The first transfer transfers the VM completly.
- [**Long-term retention**](./backups#long-term-backup-retention-with-gfs-strategy): Keeps backups over extended periods (weeks, months, or years) for compliance or archival purposes.
- [**Mirror backup**](./mirror_backup): Mirror a backup repository to another. Retention and encryption of source and destination can be different.
- [**Remote**](./backups#remotes): A storage location for backups. For instance: 
    - Local storage (not recommended)
    - NFS
    - SMB
    - Amazon S3 and compatible
    - Microsoft Azure
    - Azurite

---

## What should I do before setting up my backup?

Before creating your first backup job in Xen Orchestra, consider the following:

### Remote
Choose and configure your remote storage.  
- Supported types: NFS, SMB/CIFS, S3-compatible object storage, Microsoft Azure, or local storage.  
- Ensure proper permissions and network connectivity.  
- Test write/read performance before relying on it.

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

---

## What kind of backup should I set up?

Below are the main backup and replication types available in Xen Orchestra.

### Full backup
**Pros:**
- Complete independent copy each time  
- Simplifies restore process
- only the allocated blocs are transfered
- can be compressed from xcp 8.2 (not sure of the exact version) 

**Cons:**
- Requires the most storage and network bandwidth  
- Slower than incremental options

**Limitations and extensions:**
- Can be combined with long-term retention  
- No deduplication between runs

**First steps:**
1. Configure a reliable remote with sufficient capacity  
2. Schedule during low I/O periods

---

### Delta backup
**Pros:**
- Saves only modified blocks after the first full run  
- Faster and more storage-efficient than full backups

**Cons:**
- Restore requires the initial full backup plus subsequent deltas  
- Slightly more complex restore process

**Limitations and extensions:**
- Requires initial full backup  
- Can be combined with long-term retention

**First steps:**
1. Run an initial full backup  
2. Schedule regular delta backups

---

### Incremental replication
**Pros:**
- only transfer the modified data blocks since last replication 
- Rapid failover to replicated VM

**Cons:**
- Requires a secondary host or pool  
- Not suitable for long-term retention

**Limitations and extensions:**
- Must keep the chain short ( < 10): Not intended as an archival method

**First steps:**
1. Configure target host or pool  
2. Ensure compatible storage and network settings

---

### Full replication
**Pros:**
- Creates a complete VM copy on another host/pool  
- Ideal for disaster recovery

**Cons:**
- Longer replication times than incremental  
- Requires more bandwidth and storage

**Limitations and extensions:**
- Run less frequently than incremental replication  
- Suitable for DR plans

**First steps:**
1. Configure DR target host or pool  
2. Test failover procedures

---

### Pros
**Advantages:**
- Allows chaining multiple jobs in order  
- Useful for complex backup and replication workflows

**Cons:**
- Increases job complexity  
- Requires careful planning

**Limitations and extensions:**
- Limited by the capabilities of individual job types

**First steps:**
1. Identify required job order  
2. Create and test sequence on non-critical VMs

---

### Mirror backup
**Pros:**
- Always keeps the latest backup version  
- Saves storage by not retaining old backups

**Cons:**
- No historical versions available  
- Risk of losing previous state

**Limitations and extensions:**
- Best for non-critical or temporary workloads
- You can mirror incremental backups or full backups

**First steps:**
1. Set up a dedicated remote  
2. Test restore from latest mirror

---

## What settings are available?

### Advanced settings
- **Smart mode**: Automatically decides whether to run a full or delta backup based on circumstances (such as storage conditions or snapshot issues)
- **Compression**: Reduces backup size at the cost of CPU usage and backup speed.
- **Encryption**: Protects backup data at rest
- **Concurrency**: Controls how many VMs run in parallel in this backup job
- **Retention policy**: Fine-tunes how many backups to keep over certain periods of time

---

## Restore options

### VM restore
- Restore a VM to the same host/pool or another location  
- Choose full or delta restore, depending on backup type

### File restore
- Access individual files within a VM backup  
- Ideal for quick recovery of deleted or corrupted files without a full VM restore

---

## Long-term retention strategy

- Define retention periods based on compliance and operational needs  
- Regularly test restore from long-term backups

:::warning
To prevent backup duplication, do not mix long-term retention with schedule retention.
:::

---

## Putting it all together

When designing your backup strategy with Xen Orchestra:
1. Assess criticality and resources.  
2. Choose backup types that match your RPO/RTO goals.  
3. Configure remotes and test them.  
4. Set up schedules to avoid peak loads.  
5. Apply retention policies.  
6. Test restores regularly.

---

## How to ensure XOA is always available

Making sure XOA is always available should be a top priority for every administrator. Here’s how you can maximize its reliability:

Since XOA runs as a virtual machine, you can apply standard VM protection measures:
- Back up regularly (full or incremental).
- Replicate the VM (full disaster recovery or incremental replication).
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