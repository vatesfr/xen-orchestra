import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const xoVdisArg = defineJobArg({
  identify: (vdi: FrontXoVdi) => vdi.id,
  toArray: true,
})
