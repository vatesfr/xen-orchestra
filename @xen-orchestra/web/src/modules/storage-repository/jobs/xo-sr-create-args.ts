import type { NewSrRestPayload } from '@/modules/storage-repository/jobs/xo-sr-create.job.ts'
import { defineJobArg } from '@core/packages/job'

export const payloadArg = defineJobArg<NewSrRestPayload>({
  identify: payload => `${payload.hostId}:${payload.name_label}`,
  toArray: false,
})
