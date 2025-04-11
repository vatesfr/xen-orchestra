import type { VmState } from '@/types/xo/new-vm.type.ts'
import { defineJobArg } from '@core/packages/job'

export const vmArg = defineJobArg({
  identify: (vm: VmState) => vm.name,
  toArray: false,
})

export const poolArg = defineJobArg({
  identify: (poolId: string) => poolId,
  toArray: false,
})
