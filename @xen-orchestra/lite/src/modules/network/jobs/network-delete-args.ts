import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types.ts'
import { defineJobArg } from '@core/packages/job'

export const networksArg = defineJobArg({
  identify: (network: XenApiNetwork) => network.$ref,
  toArray: true,
})
