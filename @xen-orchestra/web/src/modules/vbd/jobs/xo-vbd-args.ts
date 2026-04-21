import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const xoVbdsArg = defineJobArg({
  identify: (vbd: FrontXoVbd) => vbd.id,
  toArray: true,
})
