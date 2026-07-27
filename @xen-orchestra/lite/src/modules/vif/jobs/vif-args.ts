import type { XenApiVif } from '@/libs/xen-api/xen-api.types.ts'
import { defineJobArg } from '@core/packages/job'

export const vifsArg = defineJobArg({
  identify: (vif: XenApiVif) => vif.$ref,
  toArray: true,
})
