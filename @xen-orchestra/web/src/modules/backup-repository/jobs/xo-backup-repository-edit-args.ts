import type { EditBackupRepositoryPayload } from '@/modules/backup-repository/jobs/xo-backup-repository-edit.job.ts'
import { defineJobArg } from '@core/packages/job'

export const editPayloadArg = defineJobArg<EditBackupRepositoryPayload>({
  identify: false,
  toArray: false,
})
