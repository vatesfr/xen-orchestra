import type { XenApiHost, XenApiVm } from '@/libs/xen-api/xen-api.types'
import { defineJobArg } from '@core/packages/job'

export const vmsArg = defineJobArg({
  identify: (vm: XenApiVm) => vm.$ref,
  toArray: true,
})

export const hostArg = defineJobArg({
  identify: (host: XenApiHost) => host.$ref,
  toArray: false,
})
