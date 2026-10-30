import type { BackupJobReportWhen } from '@/modules/backup-job/form/use-backup-job-planning-form.ts'

export const BACKUP_JOB_REPORT_WHEN_LABEL_KEYS: Record<BackupJobReportWhen, string> = {
  always: 'report-when:always',
  failure: 'report-when:skipped-and-failure',
  error: 'report-when:error',
  never: 'report-when:never',
}
