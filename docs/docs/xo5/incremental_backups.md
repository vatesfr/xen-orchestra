---
sidebar_label: Incremental backups
---

# Incremental backups

> **_NOTE:_** Formerly known as Continuous Delta backups

Incremental backups export only the blocks that changed since the previous backup, instead of exporting the whole VM every time. After the first complete export (the _key_ backup), every run compares the current VM disks to the previous snapshot (the _reference_) and only transfers the difference (the _delta_) to the backup repository (BR).

## Introduction

A full backup job exports the complete VM disks at every run, which means large archives and long transfer windows. An incremental backup exports the complete disks once, then only the difference from the previous run:

<Schema label="Same schedule, very different footprint: full backups re-export everything every day, incremental backups export one key backup then small deltas" legend={[["#56c288", "full (key) backup"], ["#6aabf0", "delta"]]} maxWidth="640px">
<svg viewBox="0 0 640 230" role="img" aria-label="Two lanes over the same five days: the full backups lane holds five equally large archives, the incremental lane holds one large key backup on day 1 followed by four small deltas">
  <text x="168" y="24" fill="#7a8699" fontSize="11" textAnchor="middle">day 1</text>
  <text x="264" y="24" fill="#7a8699" fontSize="11" textAnchor="middle">day 2</text>
  <text x="360" y="24" fill="#7a8699" fontSize="11" textAnchor="middle">day 3</text>
  <text x="456" y="24" fill="#7a8699" fontSize="11" textAnchor="middle">day 4</text>
  <text x="552" y="24" fill="#7a8699" fontSize="11" textAnchor="middle">day 5</text>
  <text x="16" y="70" fill="#c6d2e1" fontSize="12">Full</text>
  <text x="16" y="86" fill="#c6d2e1" fontSize="12">backups</text>
  <rect x="132" y="36" width="72" height="60" rx="6" fill="rgba(255,255,255,0.04)" stroke="#56c288" />
  <text x="168" y="70" fill="#c6d2e1" fontSize="12" textAnchor="middle">full</text>
  <rect x="228" y="36" width="72" height="60" rx="6" fill="rgba(255,255,255,0.04)" stroke="#56c288" />
  <text x="264" y="70" fill="#c6d2e1" fontSize="12" textAnchor="middle">full</text>
  <rect x="324" y="36" width="72" height="60" rx="6" fill="rgba(255,255,255,0.04)" stroke="#56c288" />
  <text x="360" y="70" fill="#c6d2e1" fontSize="12" textAnchor="middle">full</text>
  <rect x="420" y="36" width="72" height="60" rx="6" fill="rgba(255,255,255,0.04)" stroke="#56c288" />
  <text x="456" y="70" fill="#c6d2e1" fontSize="12" textAnchor="middle">full</text>
  <rect x="516" y="36" width="72" height="60" rx="6" fill="rgba(255,255,255,0.04)" stroke="#56c288" />
  <text x="552" y="70" fill="#c6d2e1" fontSize="12" textAnchor="middle">full</text>
  <text x="16" y="162" fill="#c6d2e1" fontSize="12">Incremental</text>
  <rect x="132" y="126" width="72" height="60" rx="6" fill="rgba(255,255,255,0.04)" stroke="#56c288" />
  <text x="168" y="160" fill="#c6d2e1" fontSize="12" textAnchor="middle">full</text>
  <rect x="242" y="166" width="44" height="20" rx="4" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="264" y="180" fill="#c6d2e1" fontSize="9" textAnchor="middle">delta</text>
  <rect x="338" y="166" width="44" height="20" rx="4" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="360" y="180" fill="#c6d2e1" fontSize="9" textAnchor="middle">delta</text>
  <rect x="434" y="166" width="44" height="20" rx="4" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="456" y="180" fill="#c6d2e1" fontSize="9" textAnchor="middle">delta</text>
  <rect x="530" y="166" width="44" height="20" rx="4" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="552" y="180" fill="#c6d2e1" fontSize="9" textAnchor="middle">delta</text>
</svg>
</Schema>

You can, for example, run the initial key backup during a weekend, then only delta backups every night. This combines the flexibility of snapshots with the safety of full backups:

- deltas are stored on a backup repository (BR), away from the VM storage
- they are small and quick to create
- restores are simple: XO reads the whole chain and rebuilds the VM automatically

If you want to roll back a VM to a previous state, the cost is only one snapshot on your SR (far less than the [rolling snapshot](../rolling_snapshots.md) mechanism). And even if you lose your whole SR or VM, XOA will restore the VM entirely and automatically, at any backup date.

You can even use this to back up more often: deltas stay small, and they will **always be deltas**.

### Continuous

Incremental backups in XO are called continuous because after the initial key backup, **a full export is never needed again** (unless you configure a [key backup interval](#key-backup-interval)). When the retention is exceeded, instead of exporting a new full, XO merges the oldest delta into the full, directly on the BR:

<Schema label="Rolling merge: when retention is exceeded, the oldest delta is merged into the full on the BR and the chain window slides forward, without ever re-exporting a full" legend={[["#56c288", "full (key) backup"], ["#6aabf0", "delta"], ["#e0a94a", "merge"]]} maxWidth="640px">
<svg viewBox="0 0 640 250" role="img" aria-label="Top row: a chain made of a full backup and three deltas exceeds a retention of 3, and an animated arrow merges the oldest delta d1 into the full; bottom row: the resulting chain holds the merged full plus d2 and d3, with a dashed d4 slot showing the next run">
  <text x="24" y="26" fill="#7a8699" fontSize="11">Retention 3 exceeded: the chain holds 4 restore points</text>
  <rect x="24" y="36" width="104" height="42" rx="6" fill="rgba(255,255,255,0.04)" stroke="#56c288" />
  <text x="76" y="61" fill="#c6d2e1" fontSize="12" textAnchor="middle">full</text>
  <line x1="128" y1="57" x2="144" y2="57" stroke="rgba(255,255,255,0.28)" />
  <rect x="144" y="36" width="64" height="42" rx="6" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="176" y="61" fill="#c6d2e1" fontSize="12" textAnchor="middle">d1</text>
  <line x1="208" y1="57" x2="224" y2="57" stroke="rgba(255,255,255,0.28)" />
  <rect x="224" y="36" width="64" height="42" rx="6" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="256" y="61" fill="#c6d2e1" fontSize="12" textAnchor="middle">d2</text>
  <line x1="288" y1="57" x2="304" y2="57" stroke="rgba(255,255,255,0.28)" />
  <rect x="304" y="36" width="64" height="42" rx="6" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="336" y="61" fill="#c6d2e1" fontSize="12" textAnchor="middle">d3</text>
  <path d="M 176 84 C 176 120, 76 120, 76 94" fill="none" stroke="#e0a94a" strokeWidth="1.5" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="76,82 70,94 82,94" fill="#e0a94a" />
  <text x="126" y="136" fill="#e0a94a" fontSize="11" textAnchor="middle">merge d1 into the full</text>
  <text x="24" y="168" fill="#7a8699" fontSize="11">After the merge: 3 restore points, no new full export</text>
  <rect x="24" y="178" width="104" height="42" rx="6" fill="rgba(255,255,255,0.04)" stroke="#56c288" />
  <text x="76" y="203" fill="#c6d2e1" fontSize="11" textAnchor="middle">full + d1</text>
  <line x1="128" y1="199" x2="144" y2="199" stroke="rgba(255,255,255,0.28)" />
  <rect x="144" y="178" width="64" height="42" rx="6" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="176" y="203" fill="#c6d2e1" fontSize="12" textAnchor="middle">d2</text>
  <line x1="208" y1="199" x2="224" y2="199" stroke="rgba(255,255,255,0.28)" />
  <rect x="224" y="178" width="64" height="42" rx="6" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="256" y="203" fill="#c6d2e1" fontSize="12" textAnchor="middle">d3</text>
  <line x1="288" y1="199" x2="304" y2="199" stroke="rgba(255,255,255,0.28)" />
  <rect x="304" y="178" width="64" height="42" rx="6" fill="rgba(255,255,255,0.02)" stroke="#6aabf0" strokeDasharray="6 5" />
  <text x="336" y="203" fill="#7a8699" fontSize="12" textAnchor="middle">d4</text>
  <text x="336" y="238" fill="#7a8699" fontSize="10" textAnchor="middle">next run</text>
</svg>
</Schema>

The merge is performed on the files stored on the BR: the hosts are not involved and no data is re-exported from the pool.

## Create an incremental backup {#create-delta-backup}

In the Backup view, create a new VM backup job and enable the **Delta Backup** mode: this is the incremental mode (the XO 5 interface still uses the historical Delta Backup name for this toggle). Everything else (VM selection, schedules, retention, choice of backup repository) works like a normal backup job.

## Snapshots

Incremental backups rely on a reference snapshot kept on the VM. Unlike other job types, which delete their snapshot once the export is done, an incremental job always keeps the latest snapshot of every VM in the job and uses it as the reference for the next delta. Do not delete these snapshots!

If keeping the snapshot data on the SR is a problem for you, see [Purge snapshot data (CBT)](#purge-snapshot-data-cbt).

## Incremental backup initial seed

If you don't want to do an initial full directly toward the destination, you can create a local delta backup first, then transfer the files to your destination.

Then, only the diff will be sent.

1. create an incremental backup job to the first backup repository (BR)
1. run the backup (full)
1. edit the job to target the other repository
1. copy files from the first repository to the other one
1. run the backup (incremental)

## Key backup interval

This advanced setting defines the number of backups after which a key backup is triggered, ie the maximum length of a delta chain.

For example, with a value of 2, the first two backups will be a key and a delta, and the third will start a new chain with a full backup.

This is important because on rare occasions a backup can be corrupted, and in the case of incremental backups, this corruption might impact all the following backups in the chain. Occasionally performing a full backup limits how far a corrupted delta backup can propagate.

The value to use depends on your storage constraints and the frequency of your backups, but a value of 20 is a good start.

:::tip
Migrating the VDIs of a VM to another SR will trigger a full export at the next backup run.
:::

## NBD-enabled Backups

You have the option to use the NBD network protocol for data transfer instead of the VHD export handler exposed by the XAPI. NBD-enabled backups are generally faster, as the load on the Dom0 is reduced.

NBD must first be enabled on the network used to transfer the backups: select the relevant pool, and navigate to the Network tab to modify the parameter. Data is then transferred from the host to XOA over an encrypted (TLS) NBD connection.

<UiDetail src="/img/xo5/nbd-connection.png" alt="Enable NBD on the transfer network, in the pool's Network tab" width={700} />

When creating or editing an incremental backup or replication job for this pool, you can then enable **Use NBD to transfer disk** in the Advanced settings, and raise the number of NBD connections per disk to parallelize the transfer:

<UiDetail src="/img/xo5/nbd-backup-settings.png" alt="The job's Advanced settings: enable NBD and set the number of connections per disk" width={620} />

After the job has run, always verify in the backup log that NBD was actually used for the transfer:

<UiDetail src="/img/xo5/nbd-backup-log.png" alt="The backup log confirms the run with 'Transfer data using NBD'" width={620} />

:::warning
**Incremental backups of qcow2 disks require NBD.** qcow2 disks are used for VDIs larger than 2 TiB and on storage repositories that store their disks in the qcow2 format.

Enabling **Use NBD to transfer disk** in the job's Advanced settings is not sufficient on its own. NBD must also be enabled on at least one network of **every** pool involved, and XOA (or the proxy running the backup) must be able to reach those networks. If a default backup network is set, NBD must be enabled on it. If these conditions are not met, the job **falls back with a warning** to a non-NBD transfer: no qcow2 delta can be produced, so each run transfers a full backup instead. Always confirm NBD was actually used in the backup log after the first run.
:::

To learn more about the evolution of this feature across various XO releases, check out our blog posts for versions [5.76](https://xen-orchestra.com/blog/xen-orchestra-5-76/), [5.81](https://xen-orchestra.com/blog/xen-orchestra-5-81/), [5.82](https://xen-orchestra.com/blog/xen-orchestra-5-82/), and [5.86](https://xen-orchestra.com/blog/xen-orchestra-5-86/).

## Purge snapshot data (CBT) {#purge-snapshot-data-cbt}

By default, the reference snapshot kept for an incremental backup stores its data on the SR. XO can instead use the Changed Block Tracking (CBT) feature of XCP-ng and XenServer to discard that data: enable **Purge snapshot data when using CBT** in the Advanced settings of the backup job.

When this setting is enabled:

- XO automatically enables CBT on all the disks of the VM.
- After each successful transfer, the data of the reference snapshot is destroyed: only a small CBT metadata VDI remains on the SR.
- On the next run, XO uses this metadata to know exactly which blocks changed, and reads them from the active disk over NBD.

The benefit: the reference snapshot no longer uses any notable space on the SR, which is especially valuable on thick-provisioned storage where a snapshot can reserve the full size of the disk.

Requirements and limitations:

- NBD is required: **Use NBD to transfer disk** must be enabled in the job, and NBD must be [enabled on the network](#nbd-enabled-backups).
- It is not compatible with rolling snapshots: the job's snapshot retention must be 0.
- Since the purged snapshot only keeps metadata, it is not shown in the UI and can't be used for a rollback or a differential restore.
- Reverting to an XO version without CBT support will trigger a full backup on the next run.

:::warning
When using the **purge snapshot data** function, you might occasionally run into an issue where full backups are transferred on each run.

To prevent this:

1. Migrate the disk to another storage. This will reset the disk state.
2. Disable **purge snapshot data** on the backup.

Neither step helps if NBD was never enabled on the transfer network. The purge is gated on the job's **Use NBD to transfer disk** preference, not on whether the transfer actually used NBD, so the snapshot data is destroyed even when the export falls back to the regular path, and every later run is full. Confirm in the backup log which path the run took.

:::

## Understanding large deltas

Sometimes, you might notice that incremental backups are surprisingly large, almost as big as a full backup. This usually happens because of how block-level backups work: even small changes at the block level are included, even if the files themselves haven't changed much.

### Common causes

- **Log rotation**: Small but frequent writes happening in different places.
- **System daemons or temp files**: Background processes that write data regularly.
- **Random disk writes**: Applications or databases writing data across the disk.
- **Filesystem maintenance**: Some filesystems move blocks internally, for instance during defragmentation.
- **Memory pressure and paging**: When a VM is low on RAM, it may write heavily to disk (a process known as [memory paging](https://en.wikipedia.org/wiki/Memory_paging)), which increases block-level changes.

### Tips to keep deltas small

- Use tools like `iotop` or `dstat` to monitor disk write activity inside the VM.
- Look out for cron jobs, log rotations, or background tasks that might be active during backup times.
- Ensure your VM has enough memory to prevent excessive paging.
- Create a separated disk with `[NOBAK]` in its name to handle temporary files. This disk won't be transferred.
  To know more on excluding disks from backup jobs, check out the [Exclude disks](./backups.md#exclude-disks) section.
- For disks larger than **2 TB**, store backups on a backup repository in **block mode**.
- For **qcow2** disks, [enable NBD](#nbd-enabled-backups): without it, each incremental run falls back to a full backup.
