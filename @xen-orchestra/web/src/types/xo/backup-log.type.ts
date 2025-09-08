import type { XoBackupJob } from '@/remote-resources/use-xo-backup-job-collection.ts'
import type { Branded } from '@core/types/utility.type'

export type XoBackupLog = {
  id: Branded<'backup-log'>
  type: 'backup-log'
  jobId: XoBackupJob['id']
  status: 'success' | 'failure' | 'skipped' | 'interrupted' | 'pending'
  start: number
  end?: number
}
