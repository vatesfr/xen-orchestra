'use strict'

const assert = require('assert')
const map = require('lodash/map.js')
const mapValues = require('lodash/mapValues.js')
const ignoreErrors = require('promise-toolbox/ignoreErrors')
const { asyncMap } = require('@xen-orchestra/async-map')
const { chainVhd, checkVhdChain, openVhd, VhdAbstract } = require('vhd-lib')
const { dirname } = require('path')

const { formatFilenameDate } = require('../_filenameDate.js')
const { getOldEntries } = require('../_getOldEntries.js')
const { getVmBackupDir } = require('../_getVmBackupDir.js')
const { Task } = require('../Task.js')

const { MixinBackupWriter } = require('./_MixinBackupWriter.js')
const { AbstractDeltaWriter } = require('./_AbstractDeltaWriter.js')
const { checkVhd } = require('./_checkVhd.js')
const { packUuid } = require('./_packUuid.js')
const { Disposable } = require('promise-toolbox')

exports.DeltaBackupWriter = class DeltaBackupWriter extends MixinBackupWriter(AbstractDeltaWriter) {
  async checkBaseVdis(baseUuidToSrcVdi) {
    const { handler } = this._adapter
    const backup = this._backup
    const adapter = this._adapter

    const backupDir = getVmBackupDir(backup.vm.uuid)
    const vdisDir = `${backupDir}/vdis/${backup.job.id}`

    await asyncMap(baseUuidToSrcVdi, async ([baseUuid, srcVdi]) => {
      let found = false
      let foldersEmpty = true
      try {
        const vhds = await handler.list(`${vdisDir}/${srcVdi.uuid}`, {
          filter: _ => _[0] !== '.' && _.endsWith('.vhd'),
          prependDir: true,
        })
        foldersEmpty = foldersEmpty || vhds.length > 0
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
            Task.warning(`Error while checking existing VHD ${vdisDir}/${srcVdi.uuid} : ${error.toString()}`)
            await ignoreErrors.call(VhdAbstract.unlink(handler, path))
          }
        })
      } catch (error) {
        Task.warning(
          `Impossible to open ${vdisDir}/${srcVdi.uuid} folder to list precedent backups: ${error.toString()}`
        )
      }
      if (!found) {
        // don't show warning if it's the first backup
        if (!foldersEmpty) {
          Task.warning(`Impossible to find the base of ${srcVdi.uuid} for a delta : fallback to a full `)
        }
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
    this.cleanup = task.wrapFn(this.cleanup, true)

    return task.run(() => this._prepare())
  }

  async _prepare() {
    const adapter = this._adapter
    const settings = this._settings
    const { scheduleId, vm } = this._backup

    const oldEntries = getOldEntries(
      settings.exportRetention - 1,
      await adapter.listVmBackups(vm.uuid, _ => _.mode === 'delta' && _.scheduleId === scheduleId)
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

  async _transfer({ timestamp, deltaExport, sizeContainers }) {
    const adapter = this._adapter
    const backup = this._backup

    const { job, scheduleId, vm } = backup

    const jobId = job.id
    const handler = adapter.handler
    const backupDir = getVmBackupDir(vm.uuid)

    // TODO: clean VM backup directory

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

    const metadataFilename = `${backupDir}/${basename}.json`
    const metadataContent = {
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
      vmSnapshot: this._backup.exportedVm,
    }

    const { size } = await Task.run({ name: 'transfer' }, async () => {
      await Promise.all(
        map(deltaExport.vdis, async (vdi, id) => {
          const path = `${backupDir}/${vhds[id]}`

          const isDelta = vdi.other_config['xo:base_delta'] !== undefined
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

            assert.notStrictEqual(parentPath, undefined, `missing parent of ${id}`)

            parentPath = parentPath.slice(1) // remove leading slash

            // TODO remove when this has been done before the export
            await checkVhd(handler, parentPath)
          }

          await adapter.writeVhd(path, deltaExport.streams[`${id}.vhd`], {
            // no checksum for VHDs, because they will be invalidated by
            // merges and chainings
            checksum: false,
            validator: tmpPath => checkVhd(handler, tmpPath),
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
        })
      )
      return {
        size: Object.values(sizeContainers).reduce((sum, { size }) => sum + size, 0),
      }
    })
    metadataContent.size = size
    await handler.outputFile(metadataFilename, JSON.stringify(metadataContent), {
      dirMode: backup.config.dirMode,
    })

    // TODO: run cleanup?
  }
}
