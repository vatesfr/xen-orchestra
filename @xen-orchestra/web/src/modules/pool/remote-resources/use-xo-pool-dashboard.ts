import type { XoPoolDashboard } from '@/modules/pool/types/pool-dashboard.type.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { Ref } from 'vue'

export const useXoPoolDashboard = defineRemoteResource({
  url: (poolId: string) => `${BASE_URL}/pools/${poolId}/dashboard?ndjson=true`,
  stream: true,
  state: (poolDashboard: Ref<XoPoolDashboard | undefined>, context) => ({ poolDashboard, hasError: context.hasError }),
})
