'use strict'

const { MetadatasBackupJob } = require('./_backupJob/MetadatasBackupJob.js')
const { XapiVmBackupJob } = require('./_backupJob/XapiVmBackupJob.js')

exports.instantiateBackupJob = function instantiateBackupJob({
  config,
  getAdapter,
  getConnectedRecord,
  job,
  schedule,
}) {
  switch (job.type) {
    case 'backup':
      return new XapiVmBackupJob({ config, getAdapter, getConnectedRecord, job, schedule })
    case 'metadataBackup':
      return new MetadatasBackupJob({ config, getAdapter, getConnectedRecord, job, schedule })
    default:
      throw new Error(`No runner for the backup type ${job.type}`)
  }
}
