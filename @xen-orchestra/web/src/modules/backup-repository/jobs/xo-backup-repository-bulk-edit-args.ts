import type { BulkEditBackupRepositoryPayloads } from '@/modules/backup-repository/jobs/xo-backup-repository-bulk-edit.job.ts'
import { defineJobArg } from '@core/packages/job'

export const bulkEditPayloadsArg = defineJobArg<BulkEditBackupRepositoryPayloads>({
  identify: false,
  toArray: false,
})
