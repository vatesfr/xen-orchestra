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
        // [CHAIN-DEBUG] temporary logging to diagnose why chaining falls back to full transfers
        warn('[CHAIN-DEBUG] checkBaseVdis: candidate vhds for base', {
          baseUuid,
          srcVdiUuid,
          vhdDir,
          candidateCount: vhds.length,
          candidates: vhds.map(_ => basename(_)),
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
        // [CHAIN-DEBUG] no mergeable parent found → this base is dropped and the disk will be a full transfer
        warn('[CHAIN-DEBUG] checkBaseVdis: NO mergeable parent found, dropping base (=> full transfer)', {
          baseUuid,
          srcVdiUuid,
          vhdDir,
        })
        baseUuidToSrcVdi.delete(baseUuid)
      } else {
        // [CHAIN-DEBUG] mergeable parent found → disk will be a differencing/incremental transfer
        warn('[CHAIN-DEBUG] checkBaseVdis: mergeable parent found', {
          baseUuid,
          srcVdiUuid,
          parentDestPath,
        })
        this.#parentVdiPaths[vhdDir] = parentDestPath
        this.#parentUuids[vhdDir] = parentUuid
      }
    })
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

  async _transfer($defer, { isVhdDifferencing, timestamp, deltaExport, vm, vmSnapshot }) {
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

          // [CHAIN-DEBUG] temporary logging to diagnose why chaining falls back to full transfers
          warn('[CHAIN-DEBUG] _transfer: writing vhd', {
            path: basename(path),
            isDifferencing: !!isVhdDifferencing[diskRef],
            // this uuid must match the base uuid looked up on the NEXT backup
            footerUuid: packUuid(vdi.uuid).toString('hex'),
            parentUuid: parentUuid?.toString('hex'),
            parentPath,
          })

          const transferred = await adapter.writeVhd(path, disk, {
            // no checksum for VHDs, because they will be invalidated by
            // merges and chains
            checksum: false,
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
