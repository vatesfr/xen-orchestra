# Rolling snapshots

:::warning
Snapshots are NOT backups. A snapshot lives on the same storage as the original disk: if you lose that disk or the whole storage repository (SR), you lose every snapshot with it. Rolling snapshots are a convenient way to roll back in time, not a way to survive a storage failure.

Snapshots and backups are not mutually exclusive either: use rolling snapshots for quick rollbacks, and a real backup job (with data stored on a separate backup repository) for actual protection. Never rely on snapshots alone!
:::

A rolling snapshot job takes a snapshot of the VMs you selected, on the schedule you defined, and applies a retention policy: when the number of snapshots created by the job exceeds the limit, the oldest one is deleted automatically. The result is a rotating window of instant restore points that maintains itself, with no manual cleanup and no backup repository (BR) needed.

Because everything stays on the SR, snapshots are created in seconds and reverting a VM to any point in the window is nearly instant. That makes rolling snapshots ideal as a first line of defense against "oops" moments: a bad update, a broken config change, a botched application upgrade.

## How it works

Every time the schedule fires, Xen Orchestra:

1. Takes a snapshot of each VM in the job.
2. Counts the snapshots previously created by this job.
3. Deletes the oldest one(s) if the total exceeds the configured retention.

With a daily schedule and a retention of 7, you always keep the last seven days: each morning a fresh snapshot appears, and the one from eight days ago disappears.

<Schema label="Daily rolling snapshots with a retention of 7" legend={[["#56c288", "new snapshot"], ["#ef6a5f", "oldest, removed"], ["#e0a94a", "rotation"]]} maxWidth="640px">
<svg viewBox="0 0 640 240" role="img" aria-label="A VM on its storage repository with seven daily snapshots; when the new day 8 snapshot is created, the oldest day 1 snapshot is removed">
  <rect x="20" y="28" width="600" height="184" rx="10" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5"/>
  <text x="36" y="52" fontSize="12" fill="#7a8699">Storage repository (SR)</text>
  <rect x="45" y="66" width="96" height="46" rx="5" fill="rgba(86,194,136,0.14)" stroke="#56c288"/>
  <text x="93" y="93" fontSize="12" textAnchor="middle" fill="#c6d2e1">VM</text>
  <line x1="141" y1="92" x2="552" y2="130" stroke="#56c288" strokeWidth="1.5" strokeDasharray="5 4" className="schema-flow"/>
  <polygon points="562,133 550,124 548,135" fill="#56c288"/>
  <rect x="45" y="138" width="62" height="46" rx="5" fill="rgba(239,106,95,0.10)" stroke="#ef6a5f" strokeDasharray="4 3"/>
  <text x="76" y="158" fontSize="10" textAnchor="middle" fill="#ef6a5f">Day 1</text>
  <text x="76" y="172" fontSize="9" textAnchor="middle" fill="#ef6a5f">removed</text>
  <g fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.28)">
    <rect x="115" y="138" width="62" height="46" rx="5"/>
    <rect x="185" y="138" width="62" height="46" rx="5"/>
    <rect x="255" y="138" width="62" height="46" rx="5"/>
    <rect x="325" y="138" width="62" height="46" rx="5"/>
    <rect x="395" y="138" width="62" height="46" rx="5"/>
    <rect x="465" y="138" width="62" height="46" rx="5"/>
  </g>
  <g fontSize="10" textAnchor="middle" fill="#c6d2e1">
    <text x="146" y="165">Day 2</text>
    <text x="216" y="165">Day 3</text>
    <text x="286" y="165">Day 4</text>
    <text x="356" y="165">Day 5</text>
    <text x="426" y="165">Day 6</text>
    <text x="496" y="165">Day 7</text>
  </g>
  <rect x="535" y="138" width="62" height="46" rx="5" fill="rgba(86,194,136,0.14)" stroke="#56c288"/>
  <text x="566" y="158" fontSize="10" textAnchor="middle" fill="#56c288">Day 8</text>
  <text x="566" y="172" fontSize="9" textAnchor="middle" fill="#56c288">new</text>
  <line x1="535" y1="196" x2="94" y2="196" stroke="#e0a94a" strokeDasharray="5 4" className="schema-flow"/>
  <polygon points="82,196 94,192 94,200" fill="#e0a94a"/>
  <text x="320" y="232" fontSize="10.5" textAnchor="middle" fill="#e0a94a">Retention = 7: creating today's snapshot removes the oldest one</text>
</svg>
</Schema>

## Creating a rolling snapshot job

Rolling snapshots are configured like any other backup job:

1. Go to the **Backup** view and create a new backup job.
2. Select **Rolling snapshot** as the job type.
3. Select the VMs to snapshot, either explicitly or with smart mode (dynamic selection based on pools, tags and power state, so new matching VMs are included automatically).
4. Define the schedule (when snapshots are taken) and the snapshot retention (how many to keep).
5. Save the job. It will now run on its own, and you can also trigger it manually at any time.

To roll back, open the VM's **Snapshots** tab and revert to the restore point you want.

## Scheduling examples

- Nightly snapshot, for example at 4:30 AM, with a retention of 7: you can revert any VM in the job to any of the last seven days.
- Weekly snapshot, for example Sunday at 11:00 PM, with a retention of 4: about a month of rollback capability, at a coarser granularity.
- Combine both in two separate jobs if you want short-term granularity and a longer safety net at the same time.

## Caveats

:::tip
On thick-provisioned storage (LVM-based SRs: iSCSI, HBA, local LVM), every snapshot reserves the full virtual size of the disk on the SR. Seven rolling snapshots of a 200 GiB disk can claim more than 1.4 TiB. Avoid rolling snapshots for large VMs on these SRs, or keep the retention very low. Thin-provisioned storage (local ext, NFS, XOSTOR) only consumes space for the actual changes.
:::

- **Coalesce load**: deleting a snapshot triggers coalesce work on the SR to merge the disk chain back together. If snapshots rotate faster than the SR can coalesce (very frequent schedules on slow storage), chains pile up and Xen Orchestra will skip the VM to protect it. See [VDI chain protection](xo5/backup_troubleshooting.md#vdi-chain-protection) for details.
- **Reverting is destructive**: rolling a VM back to a snapshot discards everything that happened after that snapshot was taken. If you are not sure you want to lose the current state, snapshot it first, then revert.

## When to use it

Rolling snapshots shine as a cheap, fast undo button: before risky changes, on dev and test VMs, or as a short-term rollback layer on top of a proper backup policy. They cost nothing to set up, need no backup repository, and restore in seconds.

They are not a protection layer: they will not survive the loss of the SR, a corrupted storage, or a host disaster. Once your rolling snapshots are in place, head over to the [Backup strategy guide](backup_howto.md) to design real protection, with [incremental backups](xo5/incremental_backups.md) as the natural next step: they reuse the same snapshot mechanism, but export the data to a separate backup repository where a storage failure can't reach it.
