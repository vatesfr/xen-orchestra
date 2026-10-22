import type { VdfDocument } from '@/modules/vdf/types.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const vdfPoolIdArg = defineJobArg<string>({ identify: true, toArray: false })

export const vdfDocumentArg = defineJobArg<VdfDocument>({ identify: false, toArray: false })

export const vdfVmsArg = defineJobArg({
  identify: (vm: FrontXoVm) => vm.id,
  toArray: true,
})

export const vdfTagArg = defineJobArg<string>({ identify: true, toArray: false })

export const vdfTagPresentArg = defineJobArg<boolean>({ identify: false, toArray: false })
