export class AbstractWriter {
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
}
