import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { defineJobArg } from '@core/packages/job'

// The job identifies its arguments before validating them: a missing pool must not throw here
export const xoPoolArg = defineJobArg<FrontXoPool>({
  identify: (pool: FrontXoPool | undefined) => pool?.id,
  toArray: false,
})
