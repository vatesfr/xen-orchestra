export class AbstractWriter {
  constructor({ config, healthCheckSr, job, vmUuid, schedule, settings }) {
    this._config = config
    this._healthCheckSr = healthCheckSr
    this._job = job
    this._schedule = schedule
    this._settings = settings
    this._vmUuid = vmUuid
  }

  beforeBackup() {}

  afterBackup() {}

  healthCheck(sr) {}
}
