import type { XenApiNetwork, XenApiPif } from '@/libs/xen-api/xen-api.types'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { usePifMetricsStore } from '@/stores/xen-api/pif-metrics.store'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const usePifStore = defineStore('xen-api-pif', () => {
  const deps = {
    poolStore: usePoolStore(),
    pifMetricsStore: usePifMetricsStore(),
  }
  const { context: baseContext, ...configRest } = createXapiStoreConfig('pif')

  const poolContext = deps.poolStore.getContext()
  const pifMetricsContext = deps.pifMetricsStore.getContext()

  const hostMasterPifsByNetwork = computed(() => {
    const hostMasterPifsByNetworkMap = new Map<XenApiNetwork['$ref'], XenApiPif[]>()

    baseContext.records.value
      .filter(pif => poolContext.isMasterHost(pif.host))
      .forEach(pif => {
        const networkId = pif.network
        if (!hostMasterPifsByNetworkMap.has(networkId)) {
          hostMasterPifsByNetworkMap.set(networkId, [])
        }
        hostMasterPifsByNetworkMap.get(networkId)?.push(pif)
      })

    return hostMasterPifsByNetworkMap
  })

  const getPifsByNetworkRef = (networkRef: XenApiNetwork['$ref']) => {
    return baseContext.records.value.filter(pif => pif.network === networkRef)
  }

  const getPifStatus = (pif: XenApiPif) => {
    const carrier = pifMetricsContext.getPifCarrier(pif)
    const isCurrentlyAttached = pif.currently_attached

    if (!isCurrentlyAttached) {
      return 'disconnected'
    }

    if (!carrier) {
      return 'disconnected-from-physical-device'
    }

    return 'connected'
  }

  const context = {
    ...baseContext,
    hostMasterPifsByNetwork,
    getPifsByNetworkRef,
    getPifStatus,
  }

  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
