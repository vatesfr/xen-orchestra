import type { XoBackupJob } from '@/remote-resources/use-xo-backup-job-collection.ts'
import type { Branded } from '@core/types/utility.type'

export type XoSchedule = {
  id: Branded<'schedule'>
  type: 'schedule'
  jobId: XoBackupJob['id']
  name?: string
  enabled: boolean
  cron: string
  timezone?: string
}
