---
slug: backup
---

# Backup overview

Xen Orchestra ships a complete, **agentless** backup engine for your whole infrastructure: nothing to install inside your VMs, everything managed from one place, from quick rolling snapshots to cross-site disaster recovery.

New to backups in XO? Start with these two:

<CardGrid>
<LinkCard title="Backup strategy guide" href="/backup_howto">Which backup type for which need: design your protection plan before clicking anything.</LinkCard>
<LinkCard title="Backups in XO 6" href="/xo6/backups">Follow backup health from the new dashboards: job status, per-VM protection, restore points.</LinkCard>
</CardGrid>

## Pick your backup type

- **[Rolling snapshots](rolling_snapshots.md)**: scheduled snapshots kept on a rotation. No repository needed, instant restore points.
- **[Full backups](full_backups.md)**: a complete export of the VM to a backup repository (BR), every time. Simple and self-contained.
- **[Incremental backups](xo5/incremental_backups.md)**: after an initial full, only the changed blocks are sent. Fast, compact, deduplicable.
- **[Full replication](full_replication.md)** (formerly Disaster Recovery, DR): a ready-to-boot copy of your VMs, kept up to date on another host or SR.
- **[Incremental replication](xo5/incremental_replication.md)** (formerly Continuous Replication, CR): the same standby copy, sending only the deltas.
- **[Mirror backups](mirror_backup.md)**: replicate a whole backup repository to another one, the key to [3-2-1 strategies](backup_howto.md#long-term-retention-strategy).
- **[Metadata backup](xo5/metadata_backup.md)**: the XO configuration and pool metadata themselves, so the orchestrator is never your single point of failure.

:::tip
You don't have to pick VMs one by one: **[smart backup](xo5/backups.md#smart-backup)** selects them dynamically by pool, tag or power state, so new VMs are protected automatically.
:::

## Going further

<CardGrid>
<LinkCard title="Features and settings" href="/xo5/backups">Encryption, schedules, smart backup, backup repositories, restore (including file-level), retention, health checks: the full reference.</LinkCard>
<LinkCard title="Backup proxies" href="/xo5/proxy">Offload backup traffic to proxies, closer to your pools and repositories.</LinkCard>
<LinkCard title="Distributed backups" href="/distributed_backups">Combine proxies and mirrors for multi-site, resilient backup architectures.</LinkCard>
<LinkCard title="Immutability" href="/immutability">Make your backup repositories tamper-proof against ransomware.</LinkCard>
<LinkCard title="Backup reports" href="/xo5/backup_reports">Get notified after each run: email, XMPP and more.</LinkCard>
<LinkCard title="Troubleshooting" href="/xo5/backup_troubleshooting">Interrupted runs, full SRs, slow transfers: the usual suspects and their fixes.</LinkCard>
</CardGrid>

:::tip
Sizing question? The [retention calculator](calculator.md) estimates how much storage a given schedule and retention will consume.
:::

## See it in action

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/FfUqIwT8KzI?si=kTvxIFhPjv-8Iwri" title="Administer and backup your VM infrastructure the easiest way" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
