import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const xoVifsArg = defineJobArg({
  identify: (vif: FrontXoVif) => vif.id,
  toArray: true,
})
