exports.getMetadataBackupTypeFromId = function getMetadataBackupTypeFromId(backupId) {
  return backupId.split('/')[0]
}
