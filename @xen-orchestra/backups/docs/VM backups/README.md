- [File structure on remote](#file-structure-on-remote)
- [Attributes](#attributes)
  - [Of created snapshots](#of-created-snapshots)
  - [Of created VMs and snapshots](#of-created-vms-and-snapshots)
  - [Of created VMs](#of-created-vms)
- [Task logs](#task-logs)
  - [During backup](#during-backup)
  - [During restoration](#during-restoration)
- [Writer API](#writer-api)

## File structure on remote

```
<remote>
└─ xo-vm-backups
  ├─ index.json // TODO
  └─ <VM UUID>
     ├─ index.json // TODO
     ├─ vdis
     │  └─ <job UUID>
     │     └─ <VDI UUID>
     │        ├─ index.json // TODO
     │        └─ <YYYYMMDD>T<HHmmss>.vhd
     ├─ <YYYYMMDD>T<HHmmss>.json // backup metadata
     ├─ <YYYYMMDD>T<HHmmss>.xva
     └─ <YYYYMMDD>T<HHmmss>.xva.checksum
```

## Attributes

### Of created snapshots

- `other_config`:
  - `xo:backup:deltaChainLength` = n (number of delta copies/replicated since a full)
  - `xo:backup:exported` = 'true' (added at the end of the backup)

### Of created VMs and snapshots

- `other_config`:
  - `xo:backup:datetime`: format is UTC %Y%m%dT%H:%M:%SZ
    - from snapshots: snapshot.snapshot_time
    - with offline backup: formatDateTime(Date.now())
  - `xo:backup:job` = job.id
  - `xo:backup:schedule` = schedule.id
  - `xo:backup:vm` = vm.uuid

### Of created VMs

- `name_label`: `${original name} - ${job name} - (${safeDateFormat(backup timestamp)})`
- tag:
  - copy in delta mode: `Continuous Replication`
  - copy in full mode: `Disaster Recovery`
  - imported from backup: `restored from backup`
- `blocked_operations.start`: message
- for copies/replications only, added after complete transfer
  - `other_config[xo:backup:sr]` = sr.uuid

## Task logs

### During backup

```
job.start(data: { mode: Mode, reportWhen: ReportWhen })
├─ task.info(message: 'vms', data: { vms: string[] })
├─ task.warning(message: string)
├─ task.start(data: { type: 'VM', id: string })
│  ├─ task.warning(message: string)
│  ├─ task.start(message: 'snapshot')
│  │  └─ task.end
│  ├─ task.start(message: 'export', data: { type: 'SR' | 'remote', id: string })
│  │  ├─ task.warning(message: string)
│  │  ├─ task.start(message: 'transfer')
│  │  │  ├─ task.warning(message: string)
│  │  │  └─ task.end(result: { size: number })
│  │  │
│  │  │  // in case of full backup, DR and CR
│  │  ├─ task.start(message: 'clean')
│  │  │  ├─ task.warning(message: string)
│  │  │  └─ task.end
│  │  │
│  │  │ // in case of delta backup
│  │  ├─ task.start(message: 'merge')
│  │  │  ├─ task.warning(message: string)
│  │  │  └─ task.end(result: { size: number })
│  │  │
│  │  └─ task.end
│  └─ task.end
└─ job.end
```

### During restoration

```
task.start(message: 'restore', data: { jobId: string, srId: string, time: number })
├─ task.start(message: 'transfer')
│  └─ task.end(result: { id: string, size: number })
└─ task.end
```

## Writer API

- `beforeBackup()`
  - **Delta**
    - `checkBaseVdis(baseUuidToSrcVdi, baseVm)`
    - `prepare({ isFull })`
    - `transfer({ timestamp, deltaExport, sizeContainers })`
    - `cleanup()`
  - **Full**
    - `run({ timestamp, sizeContainer, stream })`
- `afterBackup()`
