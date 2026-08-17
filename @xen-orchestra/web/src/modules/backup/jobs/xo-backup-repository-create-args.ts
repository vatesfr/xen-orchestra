import type { NewBackupRepositoryPayload } from '@/modules/backup/jobs/xo-backup-repository-create.job.ts'
import { defineJobArg } from '@core/packages/job'

export const payloadsArg = defineJobArg<NewBackupRepositoryPayload>({
  identify: payload => `${payload.name}:${payload.url}`,
  toArray: true,
})
