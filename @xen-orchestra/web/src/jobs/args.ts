import type { XoNewVmData } from '@/types/xo/new-vm.type.ts'
import { defineJobArg } from '@core/packages/job'

export const vmArg = defineJobArg({
  identify: (vm: XoNewVmData) => vm.name_label,
  toArray: false,
})

export const poolArg = defineJobArg({
  identify: (poolId: string) => poolId,
  toArray: false,
})
