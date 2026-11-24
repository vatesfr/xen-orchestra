import type { PoolAddHostPayload } from '@/modules/pool/jobs/xo-pool-add-host.job.ts'
import { defineJobArg } from '@core/packages/job'

export const addHostPayloadArg = defineJobArg<PoolAddHostPayload>({
  identify: false,
  toArray: false,
})
