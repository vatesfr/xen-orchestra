import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const xoPoolArg = defineJobArg({
  identify: (pool: FrontXoPool) => pool.id,
  toArray: false,
})

// vCPU maximum given to new VMs, null turns live vCPU scaling off
export const liveVcpuScalingMaxArg = defineJobArg<number | null>({
  identify: false,
  toArray: false,
})
