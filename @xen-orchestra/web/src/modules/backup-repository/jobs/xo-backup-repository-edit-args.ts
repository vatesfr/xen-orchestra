import type { BulkEditBackupRepositoryPayloads } from '@/modules/backup-repository/jobs/xo-backup-repository-bulk-edit.job.ts'
import type { EditBackupRepositoryPayload } from '@/modules/backup-repository/jobs/xo-backup-repository-edit.job.ts'
import { defineJobArg } from '@core/packages/job'

export const editPayloadArg = defineJobArg({
  identify: (payload: EditBackupRepositoryPayload) => `${payload.name}:${payload.url}`,
  toArray: false,
})

export const editPayloadsArg = defineJobArg<BulkEditBackupRepositoryPayloads>({
  identify: false,
  toArray: false,
})
