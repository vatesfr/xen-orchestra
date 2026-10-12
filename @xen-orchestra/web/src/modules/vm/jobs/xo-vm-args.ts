import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const xoVmsArg = defineJobArg({
  identify: (vm: FrontXoVm) => vm.id,
  toArray: true,
})

// Some jobs (VDI/VBD) accept a missing VM, identify must not throw on it
export const xoVmArg = defineJobArg<FrontXoVm>({
  identify: (vm?: FrontXoVm) => vm?.id,
  toArray: false,
})

export const xoVmHostArg = defineJobArg({
  identify: (host: FrontXoHost | undefined) => host?.id,
  toArray: false,
})
