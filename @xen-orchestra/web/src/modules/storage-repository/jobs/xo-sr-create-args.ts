import type { NewSrRestPayload } from '@/modules/storage-repository/jobs/xo-sr-create.job.ts'
import { defineJobArg } from '@core/packages/job'

// `validate` reports a missing payload, but the job identifies its arguments before
export const payloadArg = defineJobArg<NewSrRestPayload>({
  identify: (payload: NewSrRestPayload | undefined) => payload && `${payload.hostId}:${payload.name_label}`,
  toArray: false,
})
