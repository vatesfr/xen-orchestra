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
  - [Of created snapshots](#of-created-snapshots-vms-and-associated-vdis)
  - [Of created VMs and snapshots](#of-created-vms-their-associated-vdis-and-snapshots)
  - [Of created VMs](#of-created-vms-and-their-associated-vdis)
- [Task logs](#task-logs)
  - [During backup](#during-backup)
  - [Aborted backup](#aborted-backup)
  - [Skipped cleanup](#skipped-cleanup)
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
├─ metadata.json // used to validate the encryption key
├─ immutability.json // only on remotes protected by @xen-orchestra/immutable-backups
├─ xo-vm-backups // VM backups, both full and incremental
├─ xo-config-backups // XO config backups
├─ xo-pool-metadata-backups // pool metadata backups
└─ xo-backup-log // backup journal
```

`encryption.json` and `metadata.json` are handled by `@xen-orchestra/fs` (`abstract.js`), the other directories by this package.

A VM directory holds **both** the full and the incremental backups of that VM: the mode is carried by each metadata's `mode` field, not by the path.

Transient entries, not listed in the trees below:

- `xo-vm-backups/<VM UUID>.lock`, held while a job writes to that VM's folder and while `cleanVm` cleans or merges it (after a job, after a deletion, or in the merge worker on local remotes). It is effective on S3 (an object rewritten every 30 seconds) and Azure (blob lease) too. When listing VMs, entries starting with `.` and entries ending with `.lock` are ignored.
- `xo-vm-backups/.queue/clean-vm/<YYYYMMDD>T<HHmmss>-<random>`, the merge worker queue
- `.<VHD file name>.merge.json`, in a VDI directory, interrupted merge states.

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
- xo-server removes the days older than `backups.journalRetention` from every enabled remote when it starts, then once a day; it always keeps the `fullListingInterval` of the remote, during which it reads the journal back; a day which cannot be removed is skipped, and the next purge tries it again
- the time part has a fixed width, so sorting the names by name sorts them by date
- `event` is `add`, `change` or `del`, and the file content also has a `reason` field
- the name of the file is only there to be read by a human: XO reads every field from the file content

## Attributes

### Of created snapshots (VMs and associated VDIs)

- `other_config`:
  - `xo:backup:deltaChainLength` = n (number of delta copies/replicated since a full)
  - `xo:backup:exported` = 'true' (added at the end of the backup)

### Of created VMs, their associated VDIs and snapshots

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

### Aborted backup

When the backup runs in the xo-server process (`backups.disableWorkers`), it can be aborted from its task. The abort is
always an `AbortError`, and it changes the task log above as follows:

```
job.start(data: { mode: Mode, reportWhen: ReportWhen })
├─ task.info(message: 'abort requested', data: { type: 'abortRequested', userId: string }) // when requested by a user
├─ task.abortionRequested(reason: AbortError)
├─ task.start(data: { type: 'VM', id: string, name_label?: string })            // VM being backed up
│  ├─ task.abortionRequested(reason: AbortError)
│  ├─ task.start(message: 'export', data: { … })
│  │  ├─ task.start(message: 'transfer')
│  │  │  └─ task.end(status: 'failure', result: AbortError)                       // the transfer stops
│  │  └─ task.end(status: 'failure', result: AbortError)
│  ├─ task.start(message: 'clean-vm')                                             // cleanup subtask, still run
│  │  └─ task.end
│  └─ task.end(status: 'failure', result: AbortError)
│  // no task for the VMs not started yet, no retry, no health check
└─ job.end(status: 'failure', result: AbortError)
```

- A step started as a subtask once the run is aborted fails right away, without running (the root task of the run
  is created with `skipSubtasksAfterAbort: true` in `@vates/task`).
- A running VM is not shut down for an offline backup or snapshot once the run is aborted.
- The cleanup still runs: snapshot retention, removal of the snapshot data, restore of the VM's blocked operations,
  and the writers' `afterBackup()`. `clean-vm` (and the merge it runs) is a cleanup subtask (`cleanup: true` in
  `@vates/task`), which the abort does not stop.
- The metadata of an incremental backup is not written, so the aborted backup is never listed as restorable; its disks
  are removed by `clean-vm`.
- In the backup logs and reports, a task that failed after an abort was requested on it (`abortionRequested`) has the
  status `interrupted`, and does not make its parent `failure`.

### Skipped cleanup

The cleanup of an aborted run can itself be stopped (level 2): `app.tasks.abort(id, undefined, { skipCleanup: true })`,
or `POST /rest/v0/tasks/{id}/actions/abort` with the body `{ "skipCleanup": true }`. It can be sent after a first abort,
or alone: it then aborts the run and its cleanup. The reason stays an `AbortError`. The user who requested it is
recorded, after the first abort info:

```
├─ task.info(message: 'abort requested', data: { type: 'abortRequested', userId: string })
├─ task.info(message: 'cleanup skip requested', data: { type: 'cleanupSkipRequested', userId: string })
```

Each request is applied once: repeating one changes nothing.

It stops, between two operations (an operation started completes):

- the snapshot retention (`_removeUnusedSnapshots()`), before its destroys: they all start at once;
- the removal of the snapshot data (`_removeSnapshotData()`), unless it has started;
- the deletion of the old backups and replicas made after the transfer (`deleteFirst` not set) by a full backup or
  replication job, and of the old replicas by a delta replication job. A delta backup job still removes the metadata
  of its old backups: the merge of their disks is part of `clean-vm`;
- `clean-vm` (removal of unused disks, merges, orphan directories), and the merges of VHD files between two blocks. A
  merge writes its state (`.<disk>.merge.json`) before it rejects, so the next clean resumes it. The end of a merge,
  from the write of the merged metadata to the removal of the merged disks and the rename of the result, is not
  interrupted. A merge of VHD directories moves the blocks out of the disk of the oldest backup still listed, which
  cannot be read until the merge completes: it is stopped before it starts only, so the skip waits for a merge of VHD
  directories already running. A
  completed merge has removed its state, so only this clean can update the metadata of its backup: once a merge has
  completed, the other merges are still stopped, but the clean goes on to the update of the metadata instead of
  rejecting. A backup with a disk whose merge is left keeps its metadata until the clean that completes that merge.
  Once `clean-vm` updates the metadata of the backups (removal of incomplete backups, size of the merged ones), it runs
  to its end, so that the cache and the journal record these changes;
- the merge worker is not queued.

It does not stop: the restart of a VM shut down for an offline backup, the restore of the VM's blocked operations,
and the release of the remote lock of the VM.

What is left is cleaned by the next run of the job, or by "reclaim space": old snapshots (retention applies to all the
job's snapshots), old backups and replicas, unused disks, orphan files and the interrupted merge. When the merges of the
disks of a backup complete in different runs, its size only counts the disks merged by the last one, as after a crash.

The `clean-vm` that runs before the transfer (`beforeBackup()`) is stopped by the skip of the cleanup. A first abort
does not stop a merge it is running, but a merge it has not started yet does not start (the clean after the transfer
runs it).

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
