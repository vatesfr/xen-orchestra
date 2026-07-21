import type { NewNetworkPayload } from '@/modules/network/jobs/network-create.job.ts'
import { defineJobArg } from '@core/packages/job'

export const payloadsArg = defineJobArg<NewNetworkPayload>({
  identify: payload => payload.name,
  toArray: true,
})
