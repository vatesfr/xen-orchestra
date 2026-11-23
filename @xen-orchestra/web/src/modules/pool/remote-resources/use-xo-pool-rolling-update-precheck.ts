import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { PoolRollingUpdatePrecheck } from '@vates/types'

export const useXoPoolRollingUpdatePrecheck = defineRemoteResource({
  url: (poolId: string) => `${BASE_URL}/pools/${poolId}/rolling_update_precheck`,
  initialData: () => [] as PoolRollingUpdatePrecheck[],
  state: (checks, context) => ({
    checks,
    isPrecheckReady: context.isReady,
    hasPrecheckError: context.hasError,
  }),
})
