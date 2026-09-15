import type { NewBondedNetworkPayload } from '@/modules/network/jobs/bonded-network-create.job.ts'
import { defineJobArg } from '@core/packages/job'

export const payloadArg = defineJobArg<NewBondedNetworkPayload>({
  identify: payload => payload.name,
  toArray: false,
})
