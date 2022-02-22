'use strict'

const { DIR_XO_CONFIG_BACKUPS, DIR_XO_POOL_METADATA_BACKUPS } = require('./RemoteAdapter.js')

exports.parseMetadataBackupId = function parseMetadataBackupId(backupId) {
  const [dir, ...rest] = backupId.split('/')
  if (dir === DIR_XO_CONFIG_BACKUPS) {
    const [scheduleId, timestamp] = rest
    return {
      type: 'xoConfig',
      scheduleId,
      timestamp,
    }
  } else if (dir === DIR_XO_POOL_METADATA_BACKUPS) {
    const [scheduleId, poolUuid, timestamp] = rest
    return {
      type: 'pool',
      poolUuid,
      scheduleId,
      timestamp,
    }
  }

  throw new Error(`not supported backup dir (${dir})`)
}
