import { formatFilenameDate } from '@xen-orchestra/backups/filenameDate'
import { isValidXva } from '@xen-orchestra/backups/isValidXva'
import { getOldEntries } from '@xen-orchestra/backups/getOldEntries'

import { getVmBackupDir } from './_getVmBackupDir'
import { Task } from './_Task'

export class FullBackupWriter {
  constructor(backup, remoteId, settings) {
    this._backup = backup
    this._remoteId = remoteId
    this._settings = settings

    this.run = Task.wrapFn(
      {
        name: 'export',
        data: {
          id: remoteId,
          type: 'remote',

          // necessary?
          isFull: true,
        },
      },
      this.run
    )
  }

  async run({ timestamp, sizeContainer, stream }) {
    const backup = this._backup
    const remoteId = this._remoteId
    const settings = this._settings

    const { job, scheduleId, vm } = backup

    const adapter = backup.remoteAdapters[remoteId]
    const handler = adapter.handler
    const backupDir = getVmBackupDir(vm.uuid)

    // TODO: clean VM backup directory

    const oldBackups = getOldEntries(
      settings.exportRetention - 1,
      await adapter.listVmBackups(vm.uuid, _ => _.mode === 'full' && _.scheduleId === scheduleId)
    )
    const deleteOldBackups = () => adapter.deleteFullVmBackups(oldBackups)

    const basename = formatFilenameDate(timestamp)

    const dataBasename = basename + '.xva'
    const dataFilename = backupDir + '/' + dataBasename

    const metadataFilename = `${backupDir}/${basename}.json`
    const metadata = {
      jobId: job.id,
      mode: job.mode,
      scheduleId,
      timestamp,
      version: '2.0.0',
      vm,
      vmSnapshot: this._backup.exportedVm,
      xva: './' + dataBasename,
    }

    const { deleteFirst } = settings
    if (deleteFirst) {
      await deleteOldBackups()
    }

    await Task.run({ name: 'transfer' }, async () => {
      await adapter.outputStream(stream, dataFilename, {
        validator: tmpPath => {
          if (handler._getFilePath !== undefined) {
            return isValidXva(handler._getFilePath('/' + tmpPath))
          }
        },
      })
      return { size: sizeContainer.size }
    })
    metadata.size = sizeContainer.size
    await handler.outputFile(metadataFilename, JSON.stringify(metadata))

    if (!deleteFirst) {
      await deleteOldBackups()
    }

    // TODO: run cleanup?
  }
}
