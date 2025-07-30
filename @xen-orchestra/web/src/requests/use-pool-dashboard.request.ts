import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import { defineRequest } from '@core/packages/request/define-request.ts'
import { merge } from 'lodash-es'
import { ref } from 'vue'

export const usePoolDashboard = defineRequest({
  url: (poolId: string) => `/rest/v0/pools/${poolId}/dashboard?fields=*&ndjson=true`,
  state: () => ({
    dashboard: ref({} as XoPoolDashboard),
  }),
  onUrlChange: ({ dashboard }) => {
    dashboard.value = {} as XoPoolDashboard
  },
  onDataReceived: ({ dashboard }, data) => {
    merge(dashboard.value, data)
  },
})
