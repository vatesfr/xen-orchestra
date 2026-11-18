import type { NewAuthenticationTokenPayload } from '@/modules/account/jobs/xo-authentication-token-create.job.ts'
import { defineJobArg } from '@core/packages/job'

export const newAuthenticationTokenPayloadArg = defineJobArg<NewAuthenticationTokenPayload>({
  identify: false,
  toArray: false,
})
