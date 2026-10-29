import type { NewBackupJobPayload } from '@/modules/backup-job/jobs/xo-backup-job-create.job.ts'
import { defineJobArg } from '@core/packages/job'

export const payloadArg = defineJobArg<NewBackupJobPayload>({
  identify: false,
  toArray: false,
})
