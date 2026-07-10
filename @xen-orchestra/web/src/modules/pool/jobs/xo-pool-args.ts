import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const xoPoolArg = defineJobArg({
  identify: (pool: FrontXoPool | undefined) => pool?.id,
  toArray: false,
})
