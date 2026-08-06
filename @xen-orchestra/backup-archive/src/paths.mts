export const BACKUP_DIR = 'xo-vm-backups'

export function getVmBackupDir(uuid: string): string {
  return `${BACKUP_DIR}/${uuid}`
}
