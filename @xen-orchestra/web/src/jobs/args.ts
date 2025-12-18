import { defineJobArg } from '@core/packages/job'
import type { XoHost, XoVm } from '@vates/types'

export const vmsArg = defineJobArg({
  identify: (vm: XoVm) => vm.id,
  toArray: true,
})

export const hostArg = defineJobArg({
  identify: (host: XoHost) => host.id,
  toArray: false,
})
