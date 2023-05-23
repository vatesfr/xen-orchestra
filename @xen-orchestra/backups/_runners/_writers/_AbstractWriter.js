'use strict'
exports.AbstractWriter = class AbstractWriter {
  constructor({ config, job, vmUuid, scheduleId, settings }) {
    this._config = config
    this._job = job
    this._scheduleId = scheduleId
    this._settings = settings
    this._vmUuid = vmUuid
  }

  beforeBackup() {}

  afterBackup() {}

  healthCheck(sr) {}
}
