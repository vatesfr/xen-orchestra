'use strict'

const { Backup } = require('./Backup.js')

exports.instantiateBackupJob = function instantiateBackupJob({
  config,
  getAdapter,
  getConnectedRecord,
  job,
  schedule,
}) {
  switch (job.type) {
    case 'backup':
      return new Backup({ config, getAdapter, getConnectedRecord, job, schedule })
    case 'metadataBackup':
      return new Backup({ config, getAdapter, getConnectedRecord, job, schedule })
    default:
      throw new Error(`No runner for the backup type ${job.type}`)
  }
}
