import type { VdfMonitorReport } from '@/modules/vdf/types.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { Ref } from 'vue'

// What the pool's monitored policies would drop (vdf#13): the hosts write
// their report every 30 s, polled at that pace
export const useVdfMonitor = defineRemoteResource({
  url: (poolId: string) => `${BASE_URL}/plugins/vdf/pools/${poolId}/monitor?lines=5000`,
  pollingIntervalMs: 30_000,
  cacheExpirationMs: false,
  // each answer is the whole report: replace it
  onDataReceived: async (data: Ref<VdfMonitorReport | undefined>, receivedData: VdfMonitorReport) => {
    data.value = receivedData
  },
  state: (monitor: Ref<VdfMonitorReport | undefined>, context) => ({
    monitor,
    isMonitorReady: context.isReady,
    hasMonitorError: context.hasError,
    monitorError: context.lastError,
    reloadMonitor: context.forceReload,
  }),
})
