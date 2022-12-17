'use strict'

const { formatFilenameDate } = require('../_filenameDate.js')
const { getOldEntries } = require('../_getOldEntries.js')
const { Task } = require('../Task.js')

const { MixinBackupWriter } = require('./_MixinBackupWriter.js')
const { AbstractFullWriter } = require('./_AbstractFullWriter.js')

exports.FullBackupWriter = class FullBackupWriter extends MixinBackupWriter(AbstractFullWriter) {
  constructor(props) {
    super(props)

    this.run = Task.wrapFn(
      {
        name: 'export',
        data: {
          id: props.remoteId,
          type: 'remote',

          // necessary?
          isFull: true,
        },
      },
      this.run
    )
  }

  async _run({ timestamp, sizeContainer, stream }) {
    const backup = this._backup
    const settings = this._settings

    const { job, scheduleId, vm } = backup

    const adapter = this._adapter

    // TODO: clean VM backup directory

    const oldBackups = getOldEntries(
      settings.exportRetention - 1,
      await adapter.listVmBackups(vm.uuid, _ => _.mode === 'full' && _.scheduleId === scheduleId)
    )
    const deleteOldBackups = () => adapter.deleteFullVmBackups(oldBackups)

    const basename = formatFilenameDate(timestamp)

    const dataBasename = basename + '.xva'
    const dataFilename = this._vmBackupDir + '/' + dataBasename

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
      await adapter.outputStream(dataFilename, stream, {
        validator: tmpPath => adapter.isValidXva(tmpPath),
      })
      return { size: sizeContainer.size }
    })
    metadata.size = sizeContainer.size
    this._metadataFileName = await adapter.writeVmBackupMetadata(vm.uuid, metadata)

    if (!deleteFirst) {
      await deleteOldBackups()
    }

    // TODO: run cleanup?
  }
}
