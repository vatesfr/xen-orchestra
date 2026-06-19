import type { XenApiHost, XenApiPbd, XenApiSr, XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { defineJobArg } from '@core/packages/job'

export const vmsArg = defineJobArg({
  identify: (vm: XenApiVm) => vm.$ref,
  toArray: true,
})

export const hostArg = defineJobArg({
  identify: (host: XenApiHost) => host.$ref,
  toArray: false,
})

export const srsArg = defineJobArg({
  identify: (sr: XenApiSr) => sr.$ref,
  toArray: true,
})

export const pbdsArg = defineJobArg({
  identify: (pbd: XenApiPbd) => pbd.$ref,
  toArray: true,
})
