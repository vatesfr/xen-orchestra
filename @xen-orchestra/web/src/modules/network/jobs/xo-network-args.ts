import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const xoNetworkArg = defineJobArg({
  identify: (network: FrontXoNetwork | undefined) => network?.id,
  toArray: false,
})
