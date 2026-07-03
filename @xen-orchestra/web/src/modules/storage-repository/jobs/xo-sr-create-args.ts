import type { NewSrRestPayload } from '@/modules/storage-repository/jobs/xo-sr-create.job.ts'
import { defineJobArg } from '@core/packages/job'

export const payloadsArg = defineJobArg<NewSrRestPayload>({
  identify: payload => `${payload.host}:${payload.name_label}`,
  toArray: true,
})
