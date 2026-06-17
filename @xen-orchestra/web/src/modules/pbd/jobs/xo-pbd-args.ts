import type { FrontXoPbd } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const xoPbdsArg = defineJobArg({
  identify: (pbd: FrontXoPbd) => pbd.id,
  toArray: true,
})
