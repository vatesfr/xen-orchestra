import assert from 'assert'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import Vhd, { chainVhd } from 'vhd-lib'
import { dirname } from 'path'
import { formatFilenameDate } from '@xen-orchestra/backups/filenameDate'
import { getOldEntries } from '@xen-orchestra/backups/getOldEntries'

import { checkVhd } from './_checkVhd'
import { getVmBackupDir } from './_getVmBackupDir'
import { packUuid } from './_packUuid'
import { RemoteAdapter } from './_RemoteAdapter'
import { Task } from './_Task'

export class DeltaBackupWriter {
  constructor(backup, remoteId, settings) {
    this._backup = backup
    this._remoteId = remoteId
    this._settings = settings

    this.run = Task.wrapFn(
      {
        name: 'export',
        data: ({ deltaExport }) => ({
          id: remoteId,
          isFull: Object.values(deltaExport.vdis).some(vdi => vdi.other_config['xo:base_delta'] === undefined),
          type: 'remote',
        }),
      },
      this.run
    )
  }

  async run({ timestamp, deltaExport, sizeContainers }) {
    const backup = this._backup
    const remoteId = this._remoteId
    const settings = this._settings

    const handler = backup.remoteHandlers[remoteId]
    const { job, scheduleId, vm } = backup

    const jobId = job.id
    const adapter = new RemoteAdapter(handler)
    const backupDir = getVmBackupDir(vm.uuid)

    // TODO: clean VM backup directory

    const oldBackups = getOldEntries(
      settings.exportRetention - 1,
      await adapter.listVmBackups(vm.uuid, _ => _.mode === 'delta' && _.scheduleId === scheduleId)
    )

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
    if (oldBackups.length > maxMergedDeltasPerRun) {
      oldBackups.length = maxMergedDeltasPerRun
    }

    const deleteOldBackups = () =>
      Task.run({ name: 'merge' }, async () => ({
        size: await adapter.deleteDeltaVmBackups(oldBackups),
      }))

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
        }/${basename}.vhd`
    )

    const metadataFilename = `${backupDir}/${basename}.json`
    const metadataContent = JSON.stringify({
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
    })

    const { deleteFirst } = settings
    if (deleteFirst) {
      await deleteOldBackups()
    }

    await Task.run({ name: 'transfer' }, async () => {
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

          await adapter.outputStream(deltaExport.streams[`${id}.vhd`], path, {
            // no checksum for VHDs, because they will be invalidated by
            // merges and chainings
            checksum: false,
            validator: tmpPath => checkVhd(handler, tmpPath),
          })

          if (isDelta) {
            await chainVhd(handler, parentPath, handler, path)
          }

          // set the correct UUID in the VHD
          const vhd = new Vhd(handler, path)
          await vhd.readHeaderAndFooter()
          vhd.footer.uuid = packUuid(vdi.uuid)
          await vhd.readBlockAllocationTable() // required by writeFooter()
          await vhd.writeFooter()
        })
      )
      return {
        size: Object.values(sizeContainers).reduce((sum, { size }) => sum + size, 0),
      }
    })
    await handler.outputFile(metadataFilename, metadataContent)

    if (!deleteFirst) {
      await deleteOldBackups()
    }

    // TODO: run cleanup?
  }
}
