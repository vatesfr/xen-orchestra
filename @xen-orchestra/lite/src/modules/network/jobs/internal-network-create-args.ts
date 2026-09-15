import type { NewInternalNetworkPayload } from '@/modules/network/jobs/internal-network-create.job.ts'
import { defineJobArg } from '@core/packages/job'

export const payloadArg = defineJobArg<NewInternalNetworkPayload>({
  identify: payload => payload.name,
  toArray: false,
})
