# Incremental Replication (CR) - Target Selection

This document explains how incremental replication (Continuous Replication to a XAPI SR) selects its target VM and VDIs, and the resulting transfer modes.

## Overview

The goal is to maintain a replica VM on a target SR. On each run, the system decides:

1. **Target VM**: should we update an existing replicated VM, or create a new one?
2. **Target VDIs**: for each disk, should we transfer a delta (incremental) or a full copy?

These two decisions are independent: we can create a new VM but still chain disks to existing VDIs from a previous replica, reducing transfer size.

## Key metadata (`other_config`)

Replicated VDI snapshots on the target SR are tagged with:

| Key                  | Purpose                                            |
| -------------------- | -------------------------------------------------- |
| `xo:copy_of`         | UUID of the source VDI this is a copy of           |
| `xo:backup:job`      | Job ID that created it                             |
| `xo:backup:vm`       | Source VM UUID                                     |
| `xo:backup:schedule` | Schedule ID                                        |
| `xo:backup:sr`       | Target SR UUID                                     |
| `xo:base_delta_vdi`  | UUID of the source VDI used as base for this delta |

## Step-by-step flow

### 1. `_selectBaseVm` (runner)

Finds the last successfully exported snapshot VDIs on the source. Builds `baseUuidToSrcVdiUuid`: a map of `snapshotVdiUuid -> currentSrcVdiUuid` for each disk. Then calls `checkBaseVdis` on each writer with a shared copy of this map (`presentBaseVdis`).

Each writer removes entries from `presentBaseVdis` for disks it cannot handle as delta. Since writers are called sequentially on the same map, the result is an **intersection**: only disks that are valid across all writers survive. If any single writer (e.g. a remote writer) lacks a base for a disk, that disk is removed for everyone, and the runner will export it as full.

### 2. `checkBaseVdis` (writer)

Searches the target SR for VDI snapshots that match the source snapshot by `COPY_OF`, scoped to the current `JOB_ID` and `VM_UUID`. For each candidate, it validates:

1. **Active VDI exists**: the snapshot's `$snapshot_of` must resolve to a live VDI.
2. **Single user VM**: the active VDI must be attached to exactly one non-control-domain VM (shared VDIs are skipped).
3. **VM is blocked**: the VM must have `start` in `blocked_operations` (confirms it's a managed replica).
4. **No data written since snapshot**: a diff between the active VDI and the snapshot must be empty (no blocks changed).

This produces two results stored as instance state:

- **`#baseVdisBySourceUuid`**: a `Map<sourceVdiUuid, activeVdi>` of validated disk links, reused later by `#decorateVmMetadata`.
- **`_targetVmRef`**: the ref of the replicated VM to update, set only if **all** disks can chain to the same VM (`canChainToTargetVm`).

Any source VDI UUID not present in `#baseVdisBySourceUuid` is removed from `baseUuidToSrcVdi`, signaling the runner that no valid base exists for that disk.

### 3. `#decorateVmMetadata` (writer, called during transfer)

Sets `vdi.baseVdi` for each disk in the export by looking up `vdi.other_config[BASE_DELTA_VDI]` in `#baseVdisBySourceUuid`. This directly reuses the validated mapping from `checkBaseVdis` instead of re-querying the SR.

**Important**: a disk may arrive as a full export (no `BASE_DELTA_VDI`) even though this writer's `checkBaseVdis` had found a valid candidate for it. This happens when another writer in the job could not handle that disk as delta, causing the runner to remove it from the shared map and export it as full for all writers. In that case `BASE_DELTA_VDI` is absent, `#baseVdisBySourceUuid` is not consulted, and the disk is transferred as full.

### 4. `_transfer` (writer)

Calls `importIncrementalVm` with:

- `targetRef = this._targetVmRef` (may be `undefined` if no valid target VM)
- Each VDI's `baseVdi` set by `#decorateVmMetadata` (may be `undefined` per-disk)

## Decision matrix

### Target VM selection

| All VDI diffs empty    | VM blocked | `_targetVmRef` set | Result                                                   |
| ---------------------- | ---------- | ------------------ | -------------------------------------------------------- |
| Yes                    | Yes        | Yes                | **Update existing VM** (incremental into the same VM)    |
| No (some disk changed) | -          | No                 | **Create new VM** (but may still chain individual disks) |
| -                      | No         | No                 | **Create new VM** (target VM was tampered with)          |
| No candidates found    | -          | No                 | **Create new VM** (first replication or target deleted)  |

### Per-disk transfer mode

| `baseVdi` set | `BASE_DELTA_VDI` present | Result                                                                       |
| ------------- | ------------------------ | ---------------------------------------------------------------------------- |
| Yes           | Yes                      | **Delta transfer**: only changed blocks since the base are sent              |
| No            | Yes                      | **Full transfer for this disk**: base was not found or not valid on target   |
| -             | No                       | **Full transfer**: first replication of this disk (no base exists on source) |

### Combined scenarios

#### Scenario 1: Normal incremental run

All disks have valid bases on the target, diffs are empty. `_targetVmRef` is set. Transfer is fully incremental into the existing VM.

#### Scenario 2: One disk was modified on the target

Disk A's diff is empty, disk B has blocks written. `canChainToTargetVm = false`, so a new VM is created. But disk A still has a valid entry in `#baseVdisBySourceUuid`, so its transfer is incremental (chained to the existing active VDI). Disk B falls back to full.

#### Scenario 3: New disk added to source VM

Existing disks have valid bases. The new disk has no `BASE_DELTA_VDI`. Existing disks transfer as delta; the new disk transfers as full. If the existing disks' VM is valid, `_targetVmRef` is set and the new disk is added to that VM.

#### Scenario 4: Target VM deleted or first run

No snapshot candidates found. `#baseVdisBySourceUuid` is empty. All disks are full. A new VM is created.

#### Scenario 5: Disk valid on one writer but not another

A job replicates to both SR-A (XAPI writer) and Remote-B (remote writer). Disk X has a valid base on SR-A but the VHD chain is broken on Remote-B. Remote-B removes disk X from the shared `presentBaseVdis` map. The runner exports disk X as full. SR-A's `#decorateVmMetadata` receives a full disk (no `BASE_DELTA_VDI`), so `baseVdi` is `undefined` despite SR-A having a valid candidate locally. Both writers get a full transfer for that disk.

#### Scenario 6: Multiple jobs replicate the same VM to the same SR

`checkBaseVdis` scopes candidates by `JOB_ID` + `VM_UUID`, so each job only sees its own VDI snapshots. `#decorateVmMetadata` reuses this scoped mapping, avoiding cross-job conflicts.

## After transfer

Once the transfer completes:

1. `other_config` is updated on the target VM with the final timestamp.
2. A snapshot of the target VM is taken (to serve as the base for the next delta).
3. `other_config` is reset on the target VM (the snapshot retains the metadata).
4. Old entries beyond `copyRetention` are destroyed during cleanup.
