export const BACKUP_DIR = 'xo-vm-backups'

export function getVmBackupDir(uuid) {
  return `${BACKUP_DIR}/${uuid}`
}
