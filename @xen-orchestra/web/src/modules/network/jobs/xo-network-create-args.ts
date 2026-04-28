import type { NewNetworkPayload } from '@/modules/network/jobs/xo-network-create.job.ts'
import { defineJobArg } from '@core/packages/job/define-job-arg.ts'

export const payloadsArg = defineJobArg<NewNetworkPayload>({
  identify: payload => payload.poolId,
  toArray: true,
})
