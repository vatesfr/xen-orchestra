'use strict'

const { HealthCheckVmBackup } = require('../HealthCheckVmBackup.js')
const { ImportVmBackup } = require('../ImportVmBackup.js')
const { Task } = require('../Task.js')

exports.AbstractWriter = class AbstractWriter {
  constructor({ backup, settings }) {
    this._backup = backup
    this._settings = settings
  }

  beforeBackup() {}

  afterBackup() {}

  healthCheck(sr) {
    return Task.run(
      {
        name: 'health check',
      },
      async () => {
        const xapi = sr.$xapi
        const srUuid = sr.uuid
        const adapter = this._adapter
        const metadata = await adapter.readVmBackupMetadata(this._metadataFileName)
        const { id: restoredId } = await new ImportVmBackup({
          adapter,
          metadata,
          srUuid,
          xapi,
        }).run()
        const restoredVm = xapi.getObject(restoredId)
        try {
          await new HealthCheckVmBackup({
            restoredVm,
            xapi,
          }).run()
        } finally {
          await xapi.VM_destroy(restoredVm.$ref)
        }
      }
    )
  }
}
