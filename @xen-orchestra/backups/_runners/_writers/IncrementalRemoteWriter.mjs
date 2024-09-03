import assert from 'node:assert'
import mapValues from 'lodash/mapValues.js'
import { asyncEach } from '@vates/async-each'
import { asyncMap } from '@xen-orchestra/async-map'
import { chainVhd, openVhd } from 'vhd-lib'
import { createLogger } from '@xen-orchestra/log'
import { decorateClass } from '@vates/decorate-with'
import { defer } from 'golike-defer'
import { dirname, basename } from 'node:path'
import { Task } from '@vates/task'

import { formatFilenameDate } from '../../_filenameDate.mjs'
import { getOldEntries } from '../../_getOldEntries.mjs'

import { MixinRemoteWriter } from './_MixinRemoteWriter.mjs'
import { AbstractIncrementalWriter } from './_AbstractIncrementalWriter.mjs'
import { checkVhd } from './_checkVhd.mjs'
import { packUuid } from './_packUuid.mjs'
import { Disposable } from 'promise-toolbox'

const { warn } = createLogger('xo:backups:DeltaBackupWriter')

export class IncrementalRemoteWriter extends MixinRemoteWriter(AbstractIncrementalWriter) {
  #parentVdiPaths
  #vhds
  async checkBaseVdis(baseUuidToSrcVdi) {
    this.#parentVdiPaths = {}
    const { handler } = this._adapter
    const adapter = this._adapter

    const vdisDir = `${this._vmBackupDir}/vdis/${this._job.id}`

    await asyncMap(baseUuidToSrcVdi, async ([baseUuid, srcVdiUuid]) => {
      let parentDestPath
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
        this.#parentVdiPaths[vhdDir] = parentDestPath
      }
    })
  }

  async beforeBackup() {
    await super.beforeBackup()
    return this._cleanVm({ merge: true })
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
    this.transfer = task.wrapInside(this.transfer)
    this.healthCheck = task.wrapInside(this.healthCheck)
    this.cleanup = task.wrapInside(this.cleanup)
    this.afterBackup = task.wrap(this.afterBackup)

    return task.run(() => this._prepare())
  }

  async _prepare() {
    const adapter = this._adapter
    const settings = this._settings
    const scheduleId = this._scheduleId
    const vmUuid = this._vmUuid

    const oldEntries = getOldEntries(
      settings.exportRetention - 1,
      await adapter.listVmBackups(vmUuid, _ => _.mode === 'delta' && _.scheduleId === scheduleId)
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

    if (settings.deleteFirst) {
      await this._deleteOldEntries()
    }
  }

  async cleanup() {
    if (!this._settings.deleteFirst) {
      await this._deleteOldEntries()
    }
  }

  async updateUuidAndChain({ isVhdDifferencing, vdis }) {
    assert.notStrictEqual(
      this.#vhds,
      undefined,
      '_transfer must be called before updateUuidAndChain for incremental backups'
    )

    const parentVdiPaths = this.#parentVdiPaths
    const { handler } = this._adapter
    const vhds = this.#vhds
    await asyncEach(Object.entries(vdis), async ([id, vdi]) => {
      const isDifferencing = isVhdDifferencing[`${id}.vhd`]
      const path = `${this._vmBackupDir}/${vhds[id]}`
      if (isDifferencing) {
        assert.notStrictEqual(
          parentVdiPaths,
          undefined,
          'checkbasevdi must be called before updateUuidAndChain for incremental backups'
        )
        const parentPath = parentVdiPaths[dirname(path)]
        // we are in a incremental backup
        // we already computed the chain in checkBaseVdis
        assert.notStrictEqual(parentPath, undefined, 'A differential VHD must have a parent')
        // forbid any kind of loop
        assert.ok(basename(parentPath) < basename(path), `vhd must be sorted to be chained`)
        await chainVhd(handler, parentPath, handler, path)
      }

      // set the correct UUID in the VHD if needed
      await Disposable.use(openVhd(handler, path), async vhd => {
        if (!vhd.footer.uuid.equals(packUuid(vdi.uuid))) {
          vhd.footer.uuid = packUuid(vdi.uuid)
          await vhd.readBlockAllocationTable() // required by writeFooter()
          await vhd.writeFooter()
        }
      })
    })
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
    const scheduleId = this._scheduleId
    const settings = this._settings
    const jobId = job.id
    const handler = adapter.handler

    const basename = formatFilenameDate(timestamp)
    // update this.#vhds before eventually skipping transfer, so that
    // updateUuidAndChain has all the mandatory data
    const vhds = (this.#vhds = mapValues(
      deltaExport.vdis,
      vdi =>
        `vdis/${jobId}/${
          vdi.type === 'suspend'
            ? // doesn't make sense to group by parent for memory because we
              // don't do delta for it
              vdi.uuid
            : vdi.$snapshot_of$uuid
        }/${adapter.getVhdFileName(basename)}`
    ))

    let metadataContent = await this._isAlreadyTransferred(timestamp)
    if (metadataContent !== undefined) {
      // skip backup while being vigilant to not stuck the forked stream
      Task.info('This backup has already been transfered')
      Object.values(deltaExport.streams).forEach(stream => stream.destroy())
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
    }

    const { size } = await Task.run({ properties: { name: 'transfer' } }, async () => {
      let transferSize = 0
      await asyncEach(
        Object.keys(deltaExport.vdis),
        async id => {
          const path = `${this._vmBackupDir}/${vhds[id]}`
          // don't write it as transferSize += await async function
          // since i += await asyncFun lead to race condition
          // as explained : https://eslint.org/docs/latest/rules/require-atomic-updates
          const transferSizeOneDisk = await adapter.writeVhd(path, deltaExport.streams[`${id}.vhd`], {
            // no checksum for VHDs, because they will be invalidated by
            // merges and chainings
            checksum: false,
            validator: tmpPath => checkVhd(handler, tmpPath),
            writeBlockConcurrency: this._config.writeBlockConcurrency,
          })
          transferSize += transferSizeOneDisk
        },
        {
          concurrency: settings.diskPerVmConcurrency,
        }
      )

      return { size: transferSize }
    })
    metadataContent.size = size
    this._metadataFileName = await adapter.writeVmBackupMetadata(vm.uuid, metadataContent)

    // TODO: run cleanup?
  }
}
decorateClass(IncrementalRemoteWriter, {
  _transfer: defer,
})
