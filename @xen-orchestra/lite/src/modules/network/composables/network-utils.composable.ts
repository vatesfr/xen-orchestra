import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types.ts'
import { usePifMetricsStore } from '@/stores/xen-api/pif-metrics.store.ts'
import { usePifStore } from '@/stores/xen-api/pif.store.ts'
import { getConnectionStatus } from '@core/utils/connection.util.ts'

export function useNetworkUtils() {
  const { records: pifs } = usePifStore().subscribe()
  const { getPifCarrier } = usePifMetricsStore().subscribe()

  function getNetworkStatus(network: XenApiNetwork) {
    const networkPifs = pifs.value.filter(pif => network.PIFs.includes(pif.$ref))

    return getConnectionStatus(networkPifs.map(pif => pif.currently_attached && getPifCarrier(pif)))
  }

  return { getNetworkStatus }
}
