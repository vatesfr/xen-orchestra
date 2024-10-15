import type { BackupIssue } from '@/types/xo/dashboard.type'
import type { Backup as CoreBackup } from '@core/components/backup-item/VtsBackupItem.vue'

export const convertBackupIssueToCore = (backupIssue: BackupIssue): CoreBackup => ({
  label: backupIssue.name,
  states: backupIssue.logs.map(log => (log === 'skipped' || log === 'interrupted' ? 'partial' : log)),
})
