import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { defineJobArg } from '@core/packages/job'

export const vmArg = defineJobArg({
  identify: (vm: XenApiVm) => vm.$ref,
  toArray: false,
})
