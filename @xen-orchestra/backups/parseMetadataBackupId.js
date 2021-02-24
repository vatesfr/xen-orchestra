const POOL_METADATA_BACKUP_TYPE = 'xo-pool-metadata-backups'
exports.POOL_METADATA_BACKUP_TYPE = POOL_METADATA_BACKUP_TYPE

const XO_METADATA_BACKUP_TYPE = 'xo-config-backups'
exports.XO_METADATA_BACKUP_TYPE = XO_METADATA_BACKUP_TYPE

exports.parseMetadataBackupId = function parseMetadataBackupId(backupId) {
  const [type, ...rest] = backupId.split('/')
  if (type === XO_METADATA_BACKUP_TYPE) {
    const [scheduleId, timestamp] = rest
    return {
      scheduleId,
      timestamp,
      type,
    }
  } else if (type === POOL_METADATA_BACKUP_TYPE) {
    const [scheduleId, poolUuid, timestamp] = rest
    return {
      poolUuid,
      scheduleId,
      timestamp,
      type,
    }
  }

  throw new Error(`not supported backup type (${type})`)
}
