import type { EditBackupJobPayload } from '@/modules/backup-job/jobs/xo-backup-job-edit.job.ts'
import { defineJobArg } from '@core/packages/job'

export const editPayloadArg = defineJobArg<EditBackupJobPayload>({
  identify: false,
  toArray: false,
})
