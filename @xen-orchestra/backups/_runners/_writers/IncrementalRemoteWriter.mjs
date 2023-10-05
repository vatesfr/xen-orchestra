import assert from 'node:assert'
import mapValues from 'lodash/mapValues.js'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import { asyncEach } from '@vates/async-each'
import { asyncMap } from '@xen-orchestra/async-map'
import { chainVhd, checkVhdChain, openVhd, VhdAbstract } from 'vhd-lib'
import { createLogger } from '@xen-orchestra/log'
import { decorateClass } from '@vates/decorate-with'
import { defer } from 'golike-defer'
import { dirname } from 'node:path'

import { formatFilenameDate } from '../../_filenameDate.mjs'
import { getOldEntries } from '../../_getOldEntries.mjs'
import { Task } from '../../Task.mjs'

import { MixinRemoteWriter } from './_MixinRemoteWriter.mjs'
import { AbstractIncrementalWriter } from './_AbstractIncrementalWriter.mjs'
import { checkVhd } from './_checkVhd.mjs'
import { packUuid } from './_packUuid.mjs'
import { Disposable } from 'promise-toolbox'

const { warn } = createLogger('xo:backups:DeltaBackupWriter')

export class IncrementalRemoteWriter extends MixinRemoteWriter(AbstractIncrementalWriter) {
  async checkBaseVdis(baseUuidToSrcVdi) {
    const { handler } = this._adapter
    const adapter = this._adapter

    const vdisDir = `${this._vmBackupDir}/vdis/${this._job.id}`

    await asyncMap(baseUuidToSrcVdi, async ([baseUuid, srcVdi]) => {
      let found = false
      try {
        const vhds = await handler.list(`${vdisDir}/${srcVdi.uuid}`, {
          filter: _ => _[0] !== '.' && _.endsWith('.vhd'),
          ignoreMissing: true,
          prependDir: true,
        })
        const packedBaseUuid = packUuid(baseUuid)
        await asyncMap(vhds, async path => {
          try {
            await checkVhdChain(handler, path)
            // Warning, this should not be written as found = found || await adapter.isMergeableParent(packedBaseUuid, path)
            //
            // since all the checks of a path are done in parallel, found would be containing
            // only the last answer of isMergeableParent which is probably not the right one
            // this led to the support tickets  https://help.vates.fr/#ticket/zoom/4751 , 4729, 4665 and 4300

            const isMergeable = await adapter.isMergeableParent(packedBaseUuid, path)
            found = found || isMergeable
          } catch (error) {
            warn('checkBaseVdis', { error })
            await ignoreErrors.call(VhdAbstract.unlink(handler, path))
          }
        })
      } catch (error) {
        warn('checkBaseVdis', { error })
      }
      if (!found) {
        baseUuidToSrcVdi.delete(baseUuid)
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
      name: 'export',
      data: {
        id: this._remoteId,
        isFull,
        type: 'remote',
      },
    })
    this.transfer = task.wrapFn(this.transfer)
    this.healthCheck = task.wrapFn(this.healthCheck)
    this.cleanup = task.wrapFn(this.cleanup)
    this.afterBackup = task.wrapFn(this.afterBackup, true)

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

  async _deleteOldEntries() {
    const adapter = this._adapter
    const oldEntries = this._oldEntries

    // delete sequentially from newest to oldest to avoid unnecessary merges
    for (let i = oldEntries.length; i-- > 0; ) {
      await adapter.deleteDeltaVmBackups([oldEntries[i]])
    }
  }

  async _transfer($defer, { differentialVhds, timestamp, deltaExport, vm, vmSnapshot }) {
    const adapter = this._adapter
    const job = this._job
    const scheduleId = this._scheduleId
    const settings = this._settings
    const jobId = job.id
    const handler = adapter.handler

    let metadataContent = await this._isAlreadyTransferred(timestamp)
    if (metadataContent !== undefined) {
      // @todo : should skip backup while being vigilant to not stuck the forked stream
      Task.info('This backup has already been transfered')
    }

    const basename = formatFilenameDate(timestamp)
    const vhds = mapValues(
      deltaExport.vdis,
      vdi =>
        `vdis/${jobId}/${
          vdi.type === 'suspend'
            ? // doesn't make sense to group by parent for memory because we
              // don't do delta for it
              vdi.uuid
            : vdi.$snapshot_of$uuid
        }/${adapter.getVhdFileName(basename)}`
    )

    metadataContent = {
      dedup: settings.dedup,
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
    const { size } = await Task.run({ name: 'transfer' }, async () => {
      let transferSize = 0
      await asyncEach(
        Object.entries(deltaExport.vdis),
        async ([id, vdi]) => {
          const path = `${this._vmBackupDir}/${vhds[id]}`

          const isDelta = differentialVhds[`${id}.vhd`]
          let parentPath
          if (isDelta) {
            const vdiDir = dirname(path)
            parentPath = (
              await handler.list(vdiDir, {
                filter: filename => filename[0] !== '.' && filename.endsWith('.vhd'),
                prependDir: true,
              })
            )
              .sort()
              .pop()

            assert.notStrictEqual(
              parentPath,
              undefined,
              `missing parent of ${id} in ${dirname(path)}, looking for ${vdi.other_config['xo:base_delta']}`
            )

            parentPath = parentPath.slice(1) // remove leading slash

            // TODO remove when this has been done before the export
            await checkVhd(handler, parentPath)
          }

          transferSize += await adapter.writeVhd(path, deltaExport.streams[`${id}.vhd`], {
            // no checksum for VHDs, because they will be invalidated by
            // merges and chainings
            checksum: false,
            dedup: settings.dedup,
            validator: tmpPath => checkVhd(handler, tmpPath),
            writeBlockConcurrency: this._config.writeBlockConcurrency,
          })

          if (isDelta) {
            await chainVhd(handler, parentPath, handler, path)
          }

          // set the correct UUID in the VHD
          await Disposable.use(openVhd(handler, path), async vhd => {
            vhd.footer.uuid = packUuid(vdi.uuid)
            await vhd.readBlockAllocationTable() // required by writeFooter()
            await vhd.writeFooter()
          })
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
