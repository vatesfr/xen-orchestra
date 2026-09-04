# Full backups

A full backup exports the complete VM, all of its disks and its configuration, to a backup repository (BR) on every run. Each run produces a single, self-contained XVA archive: no chain, no dependencies between runs. The mental model is simple, and so is the restore, since any one archive is enough to bring the whole VM back.

:::note
In the XO 5 interface, backup repositories are still labeled **Remotes**. A BR can be local to XOA, or an NFS or SMB share.
:::

<Schema label="Full backup: snapshot the VM, export it as an XVA archive to the BR, rotate out the oldest archive" legend={[["#56c288", "VM"], ["#e0a94a", "XVA archive"], ["#ef6a5f", "Deleted by retention"]]} maxWidth="640px">
<svg viewBox="0 0 640 240" role="img" aria-label="A VM on an XCP-ng host is snapshotted, exported as an XVA archive to the backup repository, then the snapshot is deleted; on the backup repository, dated archives accumulate and the oldest one is deleted by retention">
  <text x="32" y="38" fill="#8e83fe" fontSize="12">XCP-ng host</text>
  <rect x="24" y="46" width="216" height="130" rx="10" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5" />
  <rect x="44" y="70" width="80" height="42" rx="6" fill="rgba(255,255,255,0.04)" stroke="#56c288" />
  <text x="84" y="95" fill="#c6d2e1" fontSize="12" textAnchor="middle">VM</text>
  <line x1="124" y1="91" x2="148" y2="91" stroke="rgba(255,255,255,0.28)" />
  <polygon points="152,91 145,87 145,95" fill="rgba(255,255,255,0.28)" />
  <rect x="152" y="70" width="74" height="42" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.28)" />
  <text x="189" y="95" fill="#c6d2e1" fontSize="12" textAnchor="middle">Snapshot</text>
  <text x="189" y="130" fill="#7a8699" fontSize="10" textAnchor="middle">deleted after export</text>
  <line x1="226" y1="91" x2="336" y2="91" stroke="#e0a94a" strokeWidth="1.5" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="344,91 335,86 335,96" fill="#e0a94a" />
  <text x="285" y="80" fill="#e0a94a" fontSize="11" textAnchor="middle">XVA export</text>
  <text x="356" y="52" fill="#c6d2e1" fontSize="12">Backup repository (BR)</text>
  <rect x="344" y="60" width="280" height="150" rx="10" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5" />
  <g opacity="0.45">
    <rect x="364" y="100" width="54" height="56" rx="6" fill="rgba(255,255,255,0.04)" stroke="#ef6a5f" />
    <text x="391" y="125" fill="#c6d2e1" fontSize="11" textAnchor="middle">.xva</text>
    <text x="391" y="142" fill="#7a8699" fontSize="10" textAnchor="middle">day 1</text>
  </g>
  <text x="391" y="176" fill="#ef6a5f" fontSize="10" textAnchor="middle">rotated out</text>
  <rect x="430" y="100" width="54" height="56" rx="6" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="457" y="125" fill="#c6d2e1" fontSize="11" textAnchor="middle">.xva</text>
  <text x="457" y="142" fill="#7a8699" fontSize="10" textAnchor="middle">day 2</text>
  <rect x="496" y="100" width="54" height="56" rx="6" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="523" y="125" fill="#c6d2e1" fontSize="11" textAnchor="middle">.xva</text>
  <text x="523" y="142" fill="#7a8699" fontSize="10" textAnchor="middle">day 3</text>
  <rect x="562" y="100" width="54" height="56" rx="6" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="589" y="125" fill="#c6d2e1" fontSize="11" textAnchor="middle">.xva</text>
  <text x="589" y="142" fill="#7a8699" fontSize="10" textAnchor="middle">day 4</text>
</svg>
</Schema>

## How it works

1. **Snapshot first.** Xen Orchestra takes a snapshot of the VM, so the VM keeps running during the whole backup.
2. **Export as XVA.** The snapshot is exported to the BR as an XVA archive. Only allocated blocks are transferred, not the full virtual size of the disks.
3. **Snapshot cleanup.** Once the export is complete, the snapshot is deleted from the host.
4. **Retention.** Each schedule has a retention setting: when the number of archives on the BR exceeds it, the oldest export is deleted.

### Compression

You can optionally compress the export in the backup job settings:

- **gzip**: works everywhere, slower.
- **Zstd**: faster and more efficient, available when the host supports it (XCP-ng 8.1 and later).

Compression reduces the size of each archive on the BR at the cost of some CPU time on the host during the export.

## Restore

Every archive is self-contained, so any backup restores on its own: there is no chain to rebuild and no dependency on other backups. Pick the archive you want in the Restore view and import it on the pool and SR of your choice.

Since the result is a plain XVA file, it can also be imported anywhere, even without the backup job: download the file from the BR and use the **Import** menu in Xen Orchestra (or any other XVA import method) to recreate the VM.

## Backup without snapshot

In some cases you need to back up a VM without taking a snapshot first. The most common use case is a large VM stored on a small or thickly provisioned SR, where there simply isn't enough free space to hold a snapshot.

For this, open the advanced settings of your backup job and enable the **Offline backup** checkbox. The VM is then exported directly, without a snapshot.

:::warning
With offline backup enabled, the VM is shut down for the whole duration of the export, then started again once it completes. Plan for this downtime when scheduling the job.
:::

:::tip
Full backups are storage and bandwidth hungry: each run transfers and stores a complete copy of the VM, with no deduplication between runs. In exchange, you get the simplest possible restore. To use less space and transfer less data, look at [incremental backups](xo5/incremental_backups.md), and see the [backup strategy guide](./backup_howto.md) to choose the right approach for your infrastructure.
:::
