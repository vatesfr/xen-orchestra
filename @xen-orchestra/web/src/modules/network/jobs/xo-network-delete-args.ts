import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { defineJobArg } from '@core/packages/job/define-job-arg.ts'

export const payloadsArg = defineJobArg({
  identify: (network: FrontXoNetwork) => network.id,
  toArray: true,
})
