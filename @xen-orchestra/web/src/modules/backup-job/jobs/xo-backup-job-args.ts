import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const xoBackupJobsArg = defineJobArg({
  identify: (backupJob: FrontAnyXoBackupJob) => backupJob.id,
  toArray: true,
})

export const xoBackupJobEnabledArg = defineJobArg<boolean>({
  identify: false,
  toArray: false,
})
