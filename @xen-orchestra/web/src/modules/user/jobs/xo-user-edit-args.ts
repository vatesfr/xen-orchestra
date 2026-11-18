import type { EditXoUserPayload } from '@/modules/user/jobs/xo-user-edit.job.ts'
import { defineJobArg } from '@core/packages/job'

export const editXoUserPayloadArg = defineJobArg<EditXoUserPayload>({
  identify: false,
  toArray: false,
})
