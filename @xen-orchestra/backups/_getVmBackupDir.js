'use strict'

const BACKUP_DIR = 'xo-vm-backups'
exports.BACKUP_DIR = BACKUP_DIR

exports.getVmBackupDir = function getVmBackupDir(uuid) {
  return `${BACKUP_DIR}/${uuid}`
}
