import type { EditAuthenticationTokenPayload } from '@/modules/account/jobs/xo-authentication-token-edit.job.ts'
import { defineJobArg } from '@core/packages/job'

export const editAuthenticationTokenPayloadArg = defineJobArg<EditAuthenticationTokenPayload>({
  identify: false,
  toArray: false,
})
