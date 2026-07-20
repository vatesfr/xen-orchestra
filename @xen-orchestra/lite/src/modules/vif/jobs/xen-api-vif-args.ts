import type { EditVifPayload } from '@/modules/vif/jobs/xen-api-vif-edit.job'
import { defineJobArg } from '@core/packages/job'

export const XenApiVifsArg = defineJobArg({
  identify: (vif: EditVifPayload) => vif.actualVifRef,
  toArray: false,
})
