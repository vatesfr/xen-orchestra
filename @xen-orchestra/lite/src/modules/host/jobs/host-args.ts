import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { defineJobArg } from '@core/packages/job'

export const hostArg = defineJobArg({
  identify: (host: XenApiHost) => host?.$ref,
  toArray: false,
})
