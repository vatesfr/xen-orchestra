- [File structure on remote](#file-structure-on-remote)
- [Attributes](#attributes)
  - [Of created snapshots](#of-created-snapshots)
  - [Of created VMs and snapshots](#of-created-vms-and-snapshots)
  - [Of created VMs](#of-created-vms)
- [Task logs](#task-logs)
  - [During backup](#during-backup)
  - [During restoration](#during-restoration)
- [API](#api)
  - [Run description object](#run-description-object)
  - [`IdPattern`](#idpattern)
  - [Settings](#settings)
- [Writer API](#writer-api)

## File structure on remote

### with vhd files

```
<remote>
└─ xo-vm-backups
  ├─ index.json // TODO
  └─ <VM UUID>
     ├─ cache.json.gz
     ├─ vdis
     │  └─ <job UUID>
     │     └─ <VDI UUID>
     │        ├─ index.json // TODO
     │        └─ <YYYYMMDD>T<HHmmss>.vhd
     ├─ <YYYYMMDD>T<HHmmss>.json // backup metadata
     ├─ <YYYYMMDD>T<HHmmss>.xva
     └─ <YYYYMMDD>T<HHmmss>.xva.checksum // only on backup before 01/02/2025 or non encrypted
```

### with vhd directories

When `useVhdDirectory` is enabled on the remote, the directory containing the VHDs has a slightly different architecture:

```
<vdis>/<job UUID>/<VDI UUID>
  ├─ <YYYYMMDD>T<HHmmss>.alias.vhd // contains the relative path to a VHD directory
  ├─ <YYYYMMDD>T<HHmmss>.alias.vhd
  └─ data
    ├─ <uuid>.vhd // VHD directory format is described in vhd-lib/Vhd/VhdDirectory.js
    └─ <uuid>.vhd
```

## Cache for a VM

In a VM directory, if the file `cache.json.gz` exists, it contains the metadata for all the backups for this VM.

Add the following file: `xo-vm-backups/<VM UUID>/cache.json.gz`.

This cache is compressed in Gzip and contains an JSON object with the metadata for all the backups of this VM indexed by their absolute path (i.e. `/xo-vm-backups/<VM UUID>/<timestamp>.json`).

This file is generated on demande when listing the backups, and directly updated on backup creation/deletion.

In case any incoherence is detected, the file is deleted so it will be fully generated when required.

## Attributes

### Of created snapshots (VMs and associated VDIs)

- `other_config`:
  - `xo:backup:deltaChainLength` = n (number of delta copies/replicated since a full)
  - `xo:backup:exported` = 'true' (added at the end of the backup)

### Of created VMs , their associated VDIs and snapshots

- `other_config`:
  - `xo:backup:datetime`: format is UTC %Y%m%dT%H:%M:%SZ
    - from snapshots: snapshot.snapshot_time
    - with offline backup: formatDateTime(Date.now())
  - `xo:backup:job` = job.id
  - `xo:backup:schedule` = schedule.id
  - `xo:backup:vm` = vm.uuid

### Of created VMs and their associated VDIs

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
├─ task.start(data: { type: 'VM', id: string, name_label?: string })
│  ├─ task.warning(message: string)
|  ├─ task.start(message: 'clean-vm')
│  │  └─ task.end
│  ├─ task.start(message: 'snapshot')
│  │  └─ task.end
│  ├─ task.start(message: 'export', data: { type: 'SR' | 'remote', id: string, name_label?: string, isFull: boolean })
│  │  ├─ task.warning(message: string)
│  │  ├─ task.start(message: 'transfer')
│  │  │  ├─ task.warning(message: string)
│  │  │  └─ task.end(result: { size: number })
│  │  │
│  │  │  // in case there is a healthcheck scheduled for this vm in this job
│  │  ├─ task.start(message: 'health check')
│  │  │  ├─ task.start(message: 'transfer')
│  │  │  │  └─ task.end(result: { size: number })
│  │  │  ├─ task.start(message: 'vmstart')
│  │  │  │  └─ task.end
│  │  │  └─ task.end
│  │  │
│  │  │  // in case of full backup, DR and CR
│  │  ├─ task.start(message: 'clean')
│  │  │  ├─ task.warning(message: string)
│  │  │  └─ task.end
│  │  └─ task.end
|  ├─ task.start(message: 'clean-vm')
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

## API

### Run description object

This is a JavaScript object containing all the information necessary to run a backup job.

```coffee
# Information about the job itself
job:

  # Unique identifier
  id: string

  # Human readable identifier
  name: string

  # Whether this job is doing Full Backup / Disaster Recovery or
  # Delta Backup / Continuous Replication
  mode: 'full' | 'delta'

  # For backup jobs, indicates which remotes to use
  remotes: IdPattern

  settings:

    # Used for the whole job
    '': Settings

    # Used for a specific schedule
    [ScheduleId]: Settings

    # Used for a specific VM
    [VmId]: Settings

  # For replication jobs, indicates which SRs to use
  srs: IdPattern

  type: 'backup' | 'mirrorBackup'

  # Indicates which VMs to backup/replicate for a xapi to remote backup job
  vms: IdPattern

  # Indicates which remote to read from for a mirror backup job
  sourceRemote: IdPattern

# Indicates which XAPI to use to connect to a specific VM or SR
# for remote to remote backup job,this is only needed if there is healtcheck
recordToXapi:
  [ObjectId]: XapiId

# Information necessary to connect to each remote
remotes:
  [RemoteId]:
    url: string

# Indicates which schedule is used for this run
schedule:
  id: ScheduleId

# Information necessary to connect to each XAPI
xapis:
  [XapiId]:
    allowUnauthorized: boolean
    credentials:
      password: string
      username: string
    url: string
```

### `IdPattern`

For a single object:

```
{ id: string }
```

For multiple objects:

```
{ id: { __or: string[] } }
```

> This syntax is compatible with [`value-matcher`](https://github.com/vatesfr/xen-orchestra/tree/master/packages/value-matcher).

### Settings

Settings are described in [`@xen-orchestra/backups/\_runners/VmsXapi.mjs``](https://github.com/vatesfr/xen-orchestra/blob/master/%40xen-orchestra/backups/_runners/VmsXapi.mjs).

## Writer API

- `beforeBackup()`
  - **Delta**
    - `checkBaseVdis(baseUuidToSrcVdi, baseVm)`
    - `prepare({ isFull })`
    - `transfer({ timestamp, deltaExport, sizeContainers })`
    - `updateUuidAndChain({ isVhdDifferencing, vdis })`
    - `cleanup()`
    - `healthCheck()` // is not executed if no health check sr or tag doesn't match
  - **Full**
    - `run({ timestamp, sizeContainer, stream })`
- `afterBackup()`
