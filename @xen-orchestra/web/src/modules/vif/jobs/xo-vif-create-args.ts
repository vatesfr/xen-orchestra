import type { NewVifPayload } from '@/modules/vif/jobs/xo-vif-create.job.ts'
import { defineJobArg } from '@core/packages/job'

export const payloadArg = defineJobArg<NewVifPayload>({
  identify: payload => payload.vmId,
  toArray: true,
})
