import type { ChangeXoUserPasswordPayload } from '@/modules/account/jobs/xo-user-password-change.job.ts'
import { defineJobArg } from '@core/packages/job'

export const changeXoUserPasswordPayloadArg = defineJobArg<ChangeXoUserPasswordPayload>({
  identify: false,
  toArray: false,
})
