import type { VdfHostStats } from '@/modules/vdf/types.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { Ref } from 'vue'

// Each host's agent samples twice, a second apart, to compute rates: a poll
// costs about a second of wall time per host, in parallel.
export const useVdfStats = defineRemoteResource({
  url: (poolId: string) => `${BASE_URL}/plugins/vdf/pools/${poolId}/stats`,
  pollingIntervalMs: 4000,
  cacheExpirationMs: false,
  // each answer is the whole document: replace it (the default deep merge
  // would keep what the server removed, and skip reactivity)
  onDataReceived: async (data: Ref<{ hosts: VdfHostStats[] } | undefined>, receivedData: { hosts: VdfHostStats[] }) => {
    data.value = receivedData
  },
  state: (stats: Ref<{ hosts: VdfHostStats[] } | undefined>, context) => ({
    stats,
    areStatsReady: context.isReady,
    hasStatsError: context.hasError,
    statsError: context.lastError,
    reloadStats: context.forceReload,
  }),
})
