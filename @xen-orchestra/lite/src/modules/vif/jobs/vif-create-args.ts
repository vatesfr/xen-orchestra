import type { NewVifPayload } from '@/modules/vif/jobs/vif-create.job.ts'
import { defineJobArg } from '@core/packages/job'

export const newVifPayloadArg = defineJobArg<NewVifPayload>({
  identify: payload => payload.vmRef,
  toArray: true,
})
