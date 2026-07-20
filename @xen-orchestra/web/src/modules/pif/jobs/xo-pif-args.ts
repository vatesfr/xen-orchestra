import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const xoPifArg = defineJobArg({
  identify: (pif: FrontXoPif | undefined) => pif?.id,
  toArray: false,
})
