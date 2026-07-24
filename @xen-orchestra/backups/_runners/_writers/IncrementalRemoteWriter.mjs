import assert from 'node:assert'
import mapValues from 'lodash/mapValues.js'
import { asyncEach } from '@vates/async-each'
import { asyncMap } from '@xen-orchestra/async-map'
import { createLogger } from '@xen-orchestra/log'
import { decorateClass } from '@vates/decorate-with'
import { defer } from 'golike-defer'
import { dirname, basename } from 'node:path'
import { relativeFromFile } from '@xen-orchestra/fs/path'
import { Task } from '@vates/task'

import { formatFilenameDate } from '../../_filenameDate.mjs'
import { getOldEntries } from '../../_getOldEntries.mjs'

import { MixinRemoteWriter } from './_MixinRemoteWriter.mjs'
import { AbstractIncrementalWriter } from './_AbstractIncrementalWriter.mjs'
import { checkVhd } from './_checkVhd.mjs'
import { packUuid } from './_packUuid.mjs'
import { openDiskChain } from '@xen-orchestra/backup-archive/disks'
import { VDI_FORMAT_QCOW2 } from '@xen-orchestra/xapi'

const { warn } = createLogger('xo:backups:DeltaBackupWriter')

export class IncrementalRemoteWriter extends MixinRemoteWriter(AbstractIncrementalWriter) {
  #parentVdiPaths
  #parentUuids
  async checkBaseVdis(baseUuidToSrcVdi) {
    this.#parentVdiPaths = {}
    this.#parentUuids = {}
    const { handler } = this._adapter
    const adapter = this._adapter

    const vdisDir = `${this._vmBackupDir}/vdis/${this._job.id}`

    await asyncMap(baseUuidToSrcVdi, async ([baseUuid, srcVdiUuid]) => {
      let parentDestPath
      let parentUuid
      const vhdDir = `${vdisDir}/${srcVdiUuid}`
      try {
        const vhds = await handler.list(vhdDir, {
          filter: _ => _[0] !== '.' && _.endsWith('.vhd'),
          ignoreMissing: true,
          prependDir: true,
        })
        const packedBaseUuid = packUuid(baseUuid)
        // the last one is probably the right one

        for (let i = vhds.length - 1; i >= 0 && parentDestPath === undefined; i--) {
          const path = vhds[i]
          try {
            if (await adapter.isMergeableParent(packedBaseUuid, path)) {
              parentDestPath = path
              parentUuid = packedBaseUuid
            }
          } catch (error) {
            warn('checkBaseVdis', { error })
          }
        }
      } catch (error) {
        warn('checkBaseVdis', { error })
      }
      // no usable parent => the runner will have to decide to fall back to a full or stop backup
      if (parentDestPath === undefined) {
        baseUuidToSrcVdi.delete(baseUuid)
      } else {
        try {
          // A delta is only chained onto a qcow2 base when NBD is enabled; without NBD a qcow2
          // export falls back to a full, so there is no suspect base to worry about.
          if (this._settings.preferNbd && !(await this.#isBaseChainable(parentDestPath))) {
            Task.warning('forcing a full: qcow2 base predates the non-NBD qcow2 fix and looks corrupt', {
              parentDestPath,
            })
            baseUuidToSrcVdi.delete(baseUuid)
            return
          }
          this.#parentVdiPaths[vhdDir] = parentDestPath
          this.#parentUuids[vhdDir] = parentUuid
        } catch (error) {
          warn('checkBaseVdis: unexpected error, forcing a full', { error, parentDestPath })
          baseUuidToSrcVdi.delete(baseUuid)
        }
      }
    })
  }

  // Decide whether it is safe to chain a delta onto `parentDestPath` (the chain tip).
  // A qcow2 full exported before the DiskLargerBlock 20260724 fix can be silently corrupt (block 0
  // valid, following allocated blocks all zero); chaining a delta onto it would extend a
  // broken chain, so we detect that case and let the caller fall back to a full.
  async #isBaseChainable(parentDestPath) {
    // parentDestPath is the chain tip = most-recent backup; its filename is stable under
    // merges (merges rename the OLDER disks), so unlike the root it maps reliably to its
    // metadata json.
    const parentDate = basename(parentDestPath).replace(/\.(alias\.)?vhd$/, '')
    let metadata
    try {
      metadata = await this._adapter.readVmBackupMetadata(`${this._vmBackupDir}/${parentDate}.json`)
    } catch (error) {
      warn('checkBaseVdis: cannot read parent metadata, will probe', { error, parentDestPath })
    }
    if (metadata?.includeNonNbdQcow2Fix === true) {
      // written by code that has the fix and this gate, so its chain was already
      // verified/forced clean — no disk open needed
      // we can't have includeNonNbdQcow2Fix = false since it  would have restarted a clean chain
      return true
    }
    const isQcow2 =
      metadata === undefined ||
      Object.values(metadata.vdis ?? {}).some(vdi => vdi?.sm_config?.['image-format'] === VDI_FORMAT_QCOW2)
    if (!isQcow2) {
      // only qcow2 exports can carry this corruption
      return true
    }
    return this.#baseHasData(parentDestPath)
  }

  // Probe the first data blocks of the chain root for the DiskLargerBlock corruption
  // signature. Returns false only when enough allocated blocks past the first are all zero.
  async #baseHasData(parentDestPath) {
    const { handler } = this._adapter
    // open the chain (with block allocation tables) and probe its root full. This only runs
    // once per chain — afterwards the includeNonNbdQcow2Fix flag on the tip skips it — so
    // reading the deltas' BATs here is negligible and lets us reuse the root disk directly.
    const chain = await openDiskChain({ handler, path: parentDestPath })
    try {
      const root = chain.getRootDisk()
      if (root === undefined) {
        throw new Error(`can't resolve root of chain ${parentDestPath}`)
      }
      const empty = Buffer.alloc(root.getBlockSize(), 0)
      const MAX_EMPTY = 10
      let nbEmpty = 0
      for (let i = 1; i < root.getMaxBlockCount(); i++) {
        if (!root.hasBlock(i)) {
          continue
        }
        const { data } = await root.readBlock(i)
        if (!data.equals(empty)) {
          // real data → not the corruption signature
          return true
        }
        if (++nbEmpty > MAX_EMPTY) {
          // enough allocated-but-zero blocks → looks corrupt
          return false
        }
      }
      // too few allocated blocks past the first to conclude (also covers sparse/tiny disks)
      // a full should not be too costly
      return false
    } finally {
      await chain.close()
    }
  }

  async beforeBackup() {
    await super.beforeBackup()
    return this._cleanVm({ merge: true, remove: true })
  }

  prepare({ isFull }) {
    // create the task related to this export and ensure all methods are called in this context
    const task = new Task({
      properties: {
        id: this._remoteId,
        isFull,
        name: 'export',
        type: 'remote',
      },
    })
    this._prepare = task.wrapInside(this._prepare)
    this.transfer = task.wrapInside(this.transfer)
    this.healthCheck = task.wrapInside(this.healthCheck)
    this.cleanup = task.wrapInside(this.cleanup)
    this.afterBackup = task.wrap(this.afterBackup)

    return this._prepare()
  }

  async _prepare() {
    const adapter = this._adapter
    const settings = this._settings
    const scheduleId = this._schedule.id
    const vmUuid = this._vmUuid

    const oldEntries = getOldEntries(
      settings.exportRetention - 1,
      await adapter.listVmBackups(vmUuid, _ => _.mode === 'delta' && _.scheduleId === scheduleId),
      { longTermRetention: settings.longTermRetention, timezone: settings.timezone }
    )
    this._oldEntries = oldEntries

    // FIXME: implement optimized multiple VHDs merging with synthetic
    // delta
    //
    // For the time being, limit the number of deleted backups by run
    // because it can take a very long time and can lead to
    // interrupted backup with broken VHD chain.
    //
    // The old backups will be eventually merged in future runs of the
    // job.
    const { maxMergedDeltasPerRun } = this._settings
    if (oldEntries.length > maxMergedDeltasPerRun) {
      oldEntries.length = maxMergedDeltasPerRun
    }

    if (settings.deleteFirst && !settings.skipDeleteOldEntries) {
      await this._deleteOldEntries()
    }
  }

  async cleanup() {
    if (!this._settings.deleteFirst && !this._settings.skipDeleteOldEntries) {
      await this._deleteOldEntries()
    }
  }

  async _deleteOldEntries() {
    const adapter = this._adapter
    const oldEntries = this._oldEntries

    // delete sequentially from newest to oldest to avoid unnecessary merges
    for (let i = oldEntries.length; i-- > 0; ) {
      await adapter.deleteDeltaVmBackups([oldEntries[i]])
    }
  }

  async _transfer($defer, { includeNonNbdQcow2Fix, isVhdDifferencing, timestamp, deltaExport, vm, vmSnapshot }) {
    const adapter = this._adapter
    const job = this._job
    const scheduleId = this._schedule.id
    const settings = this._settings
    const jobId = job.id
    const handler = adapter.handler

    const filenameDate = formatFilenameDate(timestamp)
    const vhds = mapValues(
      deltaExport.vdis,
      vdi =>
        `vdis/${jobId}/${
          vdi.type === 'suspend'
            ? // doesn't make sense to group by parent for memory because we
              // don't do delta for it
              vdi.uuid
            : vdi.$snapshot_of$uuid
        }/${adapter.getVhdFileName(filenameDate)}`
    )

    let metadataContent = await this._isAlreadyTransferred(timestamp)
    if (metadataContent !== undefined) {
      // skip backup while being vigilant to not stuck the forked disk
      await Promise.all(Object.values(deltaExport.disks).map(async disk => disk.close()))
      return { size: 0 }
    }

    metadataContent = {
      // marks whether the disk data is known-good w.r.t. the non-NBD qcow2 corruption bug.
      // A fresh XAPI export by fixed code passes `true`; the mirror runner propagates the
      // source backup's value (copying corrupt source data must NOT become "fixed"). Its
      // absence flags a potentially-corrupt older disk (used by cleanVm and the force-full gate).
      includeNonNbdQcow2Fix,
      isVhdDifferencing,
      jobId,
      mode: job.mode,
      scheduleId,
      timestamp,
      vbds: deltaExport.vbds,
      vdis: deltaExport.vdis,
      version: '2.0.0',
      vifs: deltaExport.vifs,
      vhds,
      vm,
      vmSnapshot,
      vtpms: deltaExport.vtpms,
    }
    let size = 0
    await Task.run({ properties: { name: 'transfer' } }, async () => {
      await asyncEach(
        Object.entries(deltaExport.disks),
        async ([diskRef, disk]) => {
          const path = `${this._vmBackupDir}/${vhds[diskRef]}`
          const vdi = deltaExport.vdis[diskRef]

          let parentUuid, parentPath
          if (isVhdDifferencing[diskRef]) {
            const parentDestPath = this.#parentVdiPaths[dirname(path)]
            parentUuid = this.#parentUuids[dirname(path)]
            assert.notStrictEqual(parentDestPath, undefined, 'A differential VHD must have a parent')
            // forbid any kind of loop
            assert.ok(basename(parentDestPath) < basename(path), `vhd must be sorted to be chained`)
            parentPath = relativeFromFile(path, parentDestPath)
          }

          const transferred = await adapter.writeVhd(path, disk, {
            validator: tmpPath => checkVhd(handler, tmpPath),
            writeBlockConcurrency: this._config.writeBlockConcurrency,
            uuid: packUuid(vdi.uuid),
            parentUuid,
            parentPath,
          })
          size += transferred
        },
        {
          concurrency: settings.diskPerVmConcurrency,
        }
      )

      return { size }
    })
    metadataContent.tags = await this.getLongTermRetentionTags(metadataContent)
    metadataContent.size = size // @todo return exactly the size written by this writer
    this._metadataFileName = await adapter.writeVmBackupMetadata(vm.uuid, metadataContent)

    // TODO: run cleanup?
    return { size }
  }
}
decorateClass(IncrementalRemoteWriter, {
  _transfer: defer,
})
