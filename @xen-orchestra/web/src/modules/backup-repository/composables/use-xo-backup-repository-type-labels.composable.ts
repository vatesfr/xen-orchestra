import { useXoBackupRepositoryTypeLabel } from '@/modules/backup-repository/composables/use-xo-backup-repository-type-label.composable.ts'
import { BACKUP_REPOSITORY_TYPE, type BackupRepositoryType } from 'xo-remote-parser'

export function useXoBackupRepositoryTypeLabels(): Record<BackupRepositoryType, string> {
  return Object.fromEntries(
    Object.values(BACKUP_REPOSITORY_TYPE).map(type => [type, useXoBackupRepositoryTypeLabel(type).value])
  ) as Record<BackupRepositoryType, string>
}
