import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { VdfDocument } from '@/modules/vdf/types.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const vdfPoolIdArg = defineJobArg<string>({ identify: true, toArray: false })

// revision of the global configuration an edit started from
export const vdfRevisionArg = defineJobArg<number>({ identify: false, toArray: false })

export const vdfDocumentArg = defineJobArg<VdfDocument>({ identify: false, toArray: false })

// id of the published document an edit started from ('' for none)
export const vdfExpectedDocIdArg = defineJobArg<string>({ identify: false, toArray: false })

// pools to publish to even though some hosts' agent lacks what the
// document needs (vdf#2): "Publish anyway"
export const vdfForcePoolsArg = defineJobArg<string[]>({ identify: false, toArray: false })

export const vdfVmsArg = defineJobArg({
  identify: (vm: FrontXoVm) => vm.id,
  toArray: true,
})

export const vdfTagArg = defineJobArg<string>({ identify: true, toArray: false })

export const vdfTagPresentArg = defineJobArg<boolean>({ identify: false, toArray: false })

export const vdfNetworksArg = defineJobArg({
  identify: (network: FrontXoNetwork) => network.id,
  toArray: true,
})
