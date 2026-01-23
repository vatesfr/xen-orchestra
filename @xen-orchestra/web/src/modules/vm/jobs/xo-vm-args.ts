import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const xoVmsArg = defineJobArg({
  identify: (vm: FrontXoVm) => vm.id,
  toArray: true,
})
