# Backup strategy guide

This guide explains how to design and implement a backup strategy in Xen Orchestra.  

Instead of a simple list of questions and answers, it walks you through **key decisions** and **best practices** before, during, and after setting up backups.

---

## Glossary

This part explains the terminology of backup types & features.

- [**Full backup**](./full_backups): Copies the entire VM each time, regardless of previous backups. 
- [**Incremental backup**](./incremental_backups): Saves only the changes since the last backup, reducing storage needs. 
- [**Incremental replication**](./incremental_replication): Keeps a near-real-time copy of a VM on another host or pool.  
- [**Full replication**](./full_replication): Creates a complete replica of a VM on another host or pool.  
- [**Mirror backup**](./mirror_backup): Keeps an exact mirror of the VM backup set, with no retention — only the latest copy is kept.  
- **Backup sequence**: A feature that allows you to chain multiple backup jobs to run one after the other, automatically. 
- [**Long-term retention**](./backups#long-term-backup-retention-with-gfs-strategy): Keeps backups over extended periods (weeks, months, or years) for compliance or archival purposes.  
- [**Remote**](./backups#remotes): A storage location for backups (for instance: NFS, SMB, or Amazon S3).  
- [**File restore**](./backups#restore-a-file): A feature that allows you to restore individual files from a VM backup without restoring the full VM.

---

## 1. What should I do before setting up my backup?

Before creating your first backup job in Xen Orchestra, consider the following:

### Remote
Choose and configure your remote storage.  
- Supported types: NFS, SMB/CIFS, S3-compatible object storage, XOSAN, or local storage.  
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
- Recovery objectives (RPO/RTO)  
- Storage capacity

---

## 2. What kind of backup should I set up?

Below are the main backup and replication types available in Xen Orchestra.

### Full backup
**Advantages:**
- Complete independent copy each time  
- Simplifies restore process

**Disadvantages:**
- Requires the most storage and network bandwidth  
- Slower than incremental options

**Limitations & extensions:**
- Can be combined with long-term retention  
- No deduplication between runs

**First steps:**
1. Configure a reliable remote with sufficient capacity  
2. Schedule during low I/O periods

---

### Delta backup
**Advantages:**
- Saves only modified blocks after the first full run  
- Faster and more storage-efficient than full backups

**Disadvantages:**
- Restore requires the initial full backup plus subsequent deltas  
- Slightly more complex restore process

**Limitations & extensions:**
- Requires initial full backup  
- Can be combined with long-term retention

**First steps:**
1. Run an initial full backup  
2. Schedule regular delta backups

---

### Incremental replication
**Advantages:**
- Near-continuous protection  
- Rapid failover to replicated VM

**Disadvantages:**
- Requires a secondary host or pool  
- Not suitable for long-term retention

**Limitations & extensions:**
- Works best over low-latency connections  
- Not intended as an archival method

**First steps:**
1. Configure target host or pool  
2. Ensure compatible storage and network settings

---

### Full replication
**Advantages:**
- Creates a complete VM copy on another host/pool  
- Ideal for disaster recovery

**Disadvantages:**
- Longer replication times than incremental  
- Requires more bandwidth and storage

**Limitations & extensions:**
- Run less frequently than incremental replication  
- Suitable for DR plans

**First steps:**
1. Configure DR target host or pool  
2. Test failover procedures

---

### Sequence
**Advantages:**
- Allows chaining multiple jobs in order  
- Useful for complex backup/replication workflows

**Disadvantages:**
- Increases job complexity  
- Requires careful planning

**Limitations & extensions:**
- Limited by the capabilities of individual job types

**First steps:**
1. Identify required job order  
2. Create and test sequence on non-critical VMs

---

### Mirror backup
**Advantages:**
- Always keeps the latest backup version  
- Saves storage by not retaining old backups

**Disadvantages:**
- No historical versions available  
- Risk of losing previous state

**Limitations & extensions:**
- Best for non-critical or temporary workloads

**First steps:**
1. Set up a dedicated remote  
2. Test restore from latest mirror

---

## 3. What options are available to me?

### Advanced settings
- **Smart mode** – Automatically decides whether to run a full or delta backup based on circumstances (e.g., storage conditions, snapshot issues).  
- **Compression** – Reduces backup size at the cost of CPU usage.  
- **Encryption** – Protects backup data at rest.  
- **Concurrency** – Controls how many jobs run in parallel.  
- **Retention policy** – Fine-tunes how many backups to keep.

---

## 4. Restore options

### VM restore
- Restore a VM to the same host/pool or another location  
- Choose full or delta restore depending on backup type

### File restore
- Access individual files within a VM backup  
- Ideal for quick recovery of deleted or corrupted files without a full VM restore

---

## 5. Long-term retention strategy

- Define retention periods based on compliance and operational needs  
- Use tiered storage if possible (fast storage for recent backups, cheaper storage for older ones)  
- Regularly test restore from long-term backups

---

## 6. Putting it all together

When designing your Xen Orchestra backup strategy:
1. Assess criticality and resources.  
2. Choose backup types that match your RPO/RTO goals.  
3. Configure remotes and test them.  
4. Set up schedules to avoid peak loads.  
5. Apply retention policies.  
6. Test restores regularly.

---