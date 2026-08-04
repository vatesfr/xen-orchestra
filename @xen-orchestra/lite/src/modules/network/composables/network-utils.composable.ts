import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types.ts'
import { usePifMetricsStore } from '@/stores/xen-api/pif-metrics.store.ts'
import { usePifStore } from '@/stores/xen-api/pif.store.ts'
import { type IconName, objectIcon } from '@core/icons'
import { CONNECTION_STATUS } from '@core/types/connection.ts'

export function useNetworkUtils() {
  const { records: pifs } = usePifStore().subscribe()
  const { getPifCarrier } = usePifMetricsStore().subscribe()

  function getNetworkStatus(network: XenApiNetwork) {
    const networkPifs = pifs.value.filter(pif => network.PIFs?.includes(pif.$ref))

    if (networkPifs.length === 0) {
      return CONNECTION_STATUS.DISCONNECTED
    }

    const connections = networkPifs.map(pif => pif.currently_attached && getPifCarrier(pif))

    if (connections.every(Boolean)) {
      return CONNECTION_STATUS.CONNECTED
    }

    if (connections.some(Boolean)) {
      return CONNECTION_STATUS.PARTIALLY_CONNECTED
    }

    return CONNECTION_STATUS.DISCONNECTED
  }

  function getNetworkIcon(network: XenApiNetwork): IconName {
    switch (getNetworkStatus(network)) {
      case CONNECTION_STATUS.CONNECTED:
        return objectIcon('network', 'connected')
      case CONNECTION_STATUS.PARTIALLY_CONNECTED:
        return objectIcon('network', 'warning')
      default:
        return objectIcon('network', 'disconnected')
    }
  }

  return { getNetworkStatus, getNetworkIcon }
}
