const BACKUP_DIR = 'xo-vm-backups'

const getVmBackupDir = uuid => `${BACKUP_DIR}/${uuid}`

exports.BACKUP_DIR = BACKUP_DIR
exports.getVmBackupDir = getVmBackupDir
