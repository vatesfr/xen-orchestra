import { defineJobArg } from '@core/packages/job'
import type { XenApiHost, XenApiVm } from '@vates/types'

export const vmsArg = defineJobArg({
  identify: (vm: XenApiVm) => vm.$ref,
  toArray: true,
})

export const hostArg = defineJobArg({
  identify: (host: XenApiHost) => host.$ref,
  toArray: false,
})
