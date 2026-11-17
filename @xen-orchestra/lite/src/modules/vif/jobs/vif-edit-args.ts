import type { EditVifPayload } from '@/modules/vif/jobs/vif-edit.job.ts'
import { defineJobArg } from '@core/packages/job'

export const editVifPayloadArg = defineJobArg<EditVifPayload>({
  identify: false,
  toArray: false,
})
