import { formatFilenameDate } from '@xen-orchestra/backups/filenameDate'
import { isValidXva } from '@xen-orchestra/backups/isValidXva'
import { getOldEntries } from '@xen-orchestra/backups/getOldEntries'

import { getVmBackupDir } from './_getVmBackupDir'
import { RemoteAdapter } from './_RemoteAdapter'

export class FullBackupWriter {
  constructor(backup, remoteId, settings) {
    this._backup = backup
    this._remoteId = remoteId
    this._settings = settings
  }

  async run({ timestamp, stream }) {
    const backup = this._backup
    const remoteId = this._remoteId
    const settings = this._settings

    const handler = backup.remoteHandlers[remoteId]
    const { job, scheduleId, vm } = backup

    const adapter = new RemoteAdapter(handler)
    const backupDir = getVmBackupDir(vm.uuid)

    // TODO: clean VM backup directory

    const oldBackups = getOldEntries(
      settings.exportRetention - 1,
      await adapter.listVmBackups(
        backupDir,
        _ => _.mode === 'full' && _.scheduleId === scheduleId
      )
    )
    const deleteOldBackups = () => adapter.deleteFullVmBackups(oldBackups)

    const basename = formatFilenameDate(timestamp)

    const dataBasename = basename + '.xva'
    const dataFilename = backupDir + '/' + dataBasename

    const metadataFilename = `${backupDir}/${basename}.json`
    const metadataContent = JSON.stringify({
      jobId: job.id,
      mode: job.mode,
      scheduleId,
      timestamp,
      version: '2.0.0',
      vm,
      vmSnapshot: this.sourceVm,
      xva: './' + dataBasename,
    })

    const { deleteFirst } = settings
    if (deleteFirst) {
      await deleteOldBackups()
    }

    await adapter.outputStream(stream, dataFilename, {
      validator: tmpPath => {
        if (handler._getFilePath !== undefined) {
          return isValidXva(handler._getFilePath('/' + tmpPath))
        }
      },
    })
    await handler.outputFile(metadataFilename, metadataContent)

    if (!deleteFirst) {
      await deleteOldBackups()
    }

    // TODO: run cleanup?
  }
}
