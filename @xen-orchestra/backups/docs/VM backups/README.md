- [File structure on remote](#file-structure-on-remote)
  - [Remote root](#remote-root)
  - [with vhd files](#with-vhd-files)
  - [with vhd directories](#with-vhd-directories)
  - [Full backups](#full-backups)
  - [Incremental backups](#incremental-backups)
- [Cache for a VM](#cache-for-a-vm)
- [Metadata backups](#metadata-backups)
- [Backup journal](#backup-journal)
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

All the dates in paths are formatted by `formatFilenameDate()`, i.e. UTC `%Y%m%dT%H%M%SZ`, written `<YYYYMMDD>T<HHmmss>` below.

### Remote root

```
<remote>
├─ encryption.json // encryption algorithm descriptor, always written unencrypted
├─ metadata.json // used to validate the encryption key, only used by @xen-orchestra/fs
├─ immutability.json // only on remotes protected by @xen-orchestra/immutable-backups
├─ xo-vm-backups // VM backups, both full and incremental
├─ xo-config-backups // XO config backups
├─ xo-pool-metadata-backups // pool metadata backups
└─ xo-backup-log // backup journal
```

`encryption.json` and `metadata.json` are handled by `@xen-orchestra/fs` (`abstract.js`), the other directories by this package.

A VM directory holds **both** the full and the incremental backups of that VM: the mode is carried by each metadata's `mode` field, not by the path.

Transient entries, not listed in the trees below:

- `xo-vm-backups/<VM UUID>.lock`, held for the duration of a job run on that VM. When listing VMs, entries starting with `.` and entries ending with `.lock` are ignored.
- `xo-vm-backups/.queue/clean-vm/<YYYYMMDD>T<HHmmss>-<random>`, the merge worker queue, see [Orphans and merge](#orphans-and-merge).
- `.<VHD file name>.merge.json`, in a VDI directory, see [Interrupted merges](#interrupted-merges).

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
    ├─ <YYYYMMDD>T<HHmmss>.vhd // VHD directory format is described in vhd-lib/Vhd/VhdDirectory.js
    └─ <YYYYMMDD>T<HHmmss>.vhd
```

- the data directory is named after the alias pointing to it
- an alias holds the path of its data, relative to itself
- so a merge only rewrites an alias: the data is never moved

### Full backups

- metadata + XVA, flat in the VM directory
- no `vdis`, no chain, never merged
- `xva` in the metadata is relative to the metadata file
- a corrupted-looking XVA is warned about, never deleted: the check is not reliable enough
- only a _missing_ XVA makes a backup removable

### Incremental backups

Grouping:

- `<job UUID>`: two jobs backing up the same VM do not share a chain
- `<VDI UUID>` is the **original** VDI (`$snapshot_of$uuid`), not the snapshot, so that successive runs chain together
- a `suspend` VDI uses its own UUID instead: memory is never delta'ed
- one VDI directory = one chain, linear, a disk has at most one child

Chains:

- `vhds` in the metadata is relative to the VM directory
- the metadata only says which disks a backup uses
- **the parent/child links are not in the metadata, they live in the VHD headers**
- a disk with a missing or unreadable parent is unusable, and so is the rest of the chain after it

Lifecycle:

- a backup is usable only if all of its disks are
- the metadata of an incomplete backup is deleted, its disks are not: another backup may need them
- a disk no backup references is merged into the referenced descendant, or deleted when there is none

## Cache for a VM

In a VM directory, if the file `cache.json.gz` exists, it contains the metadata for all the backups for this VM.

Add the following file: `xo-vm-backups/<VM UUID>/cache.json.gz`.

This cache is compressed in Gzip and contains an JSON object with the metadata for all the backups of this VM indexed by their absolute path (i.e. `/xo-vm-backups/<VM UUID>/<timestamp>.json`).

This file is generated on demand when listing the backups, and directly updated on backup creation/deletion.

In case any incoherence is detected, the file is deleted so it will be fully generated when required.

- it is a cache, never a source of truth: the `.json` files are
- a clean run also regenerates it when its number of entries does not match the metadata found on disk
- on an immutable remote it is never created nor regenerated, and a leftover one is deleted

## Metadata backups

XO config:

```
<remote>/xo-config-backups
└─ <schedule UUID>
   └─ <YYYYMMDD>T<HHmmss>
      ├─ metadata.json
      └─ data.json // named `data` instead when the payload is binary
```

Pool metadata:

```
<remote>/xo-pool-metadata-backups
└─ <schedule UUID>
   └─ <pool UUID>
      └─ <YYYYMMDD>T<HHmmss>
         ├─ metadata.json
         └─ data
```

- `metadata.data` holds the name of the data file, relative to its directory
- deletion refuses any id that does not match this layout: it is an `rmtree()`

## Backup journal

Append-only log of what happened to the VM backup metadata.

```
<remote>/xo-backup-log
└─ <YYYYMMDD> // one directory per UTC day
   └─ <HHmmss.sss>Z-<random>-<event>-<VM UUID>-<metadata file name>
```

- entries are never modified nor overwritten, so it works on an immutable remote
- written unencrypted, so it stays readable without the encryption key
- one directory per day: a reader lists only the days it misses, a purge drops whole directories
- the time part has a fixed width, so sorting the names by name sorts them by date
- `event` is `add`, `change` or `del`, and the file content also has a `reason` field
- the name of the file is only there to be read by a human: XO reads every field from the file content

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
# for remote to remote backup job,this is only needed if there is healthcheck
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
    - `cleanup()`
    - `healthCheck()` // is not executed if no health check sr or tag doesn't match
  - **Full**
    - `run({ timestamp, sizeContainer, stream })`
- `afterBackup()`
