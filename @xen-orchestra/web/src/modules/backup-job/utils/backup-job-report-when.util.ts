import type { XoBackupJobReportWhen } from '@/modules/backup-job/types/xo-backup-job.type.ts'

export const BACKUP_JOB_REPORT_WHEN_LABEL_KEYS: Record<XoBackupJobReportWhen, string> = {
  always: 'report-when:always',
  failure: 'report-when:skipped-and-failure',
  error: 'report-when:error',
  never: 'report-when:never',
}
