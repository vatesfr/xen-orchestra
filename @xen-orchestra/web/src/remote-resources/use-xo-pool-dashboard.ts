import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { Ref } from 'vue'

export const useXoPoolDashboard = defineRemoteResource({
  url: (poolId: string) => `/rest/v0/pools/${poolId}/dashboard?ndjson=true`,
  stream: true,
  state: (poolDashboard: Ref<XoPoolDashboard | undefined>) => ({ poolDashboard }),
})
