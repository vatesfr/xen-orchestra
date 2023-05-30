'use strict'

const { formatFilenameDate } = require('../../_filenameDate')
const { getVmBackupDir } = require('../../_getVmBackupDir')

exports.AbstractWriter = class AbstractWriter {
  constructor({ config, healthCheckSr, job, vmUuid, scheduleId, settings }) {
    this._config = config
    this._healthCheckSr = healthCheckSr
    this._job = job
    this._scheduleId = scheduleId
    this._settings = settings
    this._vmUuid = vmUuid
  }

  beforeBackup() {}

  afterBackup() {}

  healthCheck(sr) {}

  _isAlreadyTransferred(timestamp) {
    const vmUuid = this._vmUuid
    const adapter = this._adapter
    const backupDir = getVmBackupDir(vmUuid)
    try {
      const actualMetadata = JSON.parse(adapter._handler.readFile(`${backupDir}/${formatFilenameDate(timestamp)}.json`))
      return actualMetadata
    } catch (error) {}
  }
}
