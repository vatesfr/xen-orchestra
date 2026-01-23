import { defineJobArg } from '@core/packages/job'
import type { XoVm } from '@vates/types'

export const xoVmsArg = defineJobArg({
  identify: (vm: XoVm) => vm.id,
  toArray: true,
})
