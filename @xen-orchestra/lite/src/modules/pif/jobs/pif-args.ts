import type { XenApiPif } from '@/libs/xen-api/xen-api.types.ts'
import { defineJobArg } from '@core/packages/job'

export const pifsArg = defineJobArg({
  identify: (pif: XenApiPif) => pif.$ref,
  toArray: true,
})
