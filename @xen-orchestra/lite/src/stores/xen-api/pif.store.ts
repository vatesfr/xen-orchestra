import type { XenApiHost, XenApiNetwork, XenApiPif } from '@/libs/xen-api/xen-api.types'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store'
import { useHostStore } from '@/stores/xen-api/host.store'
import { usePifMetricsStore } from '@/stores/xen-api/pif-metrics.store'
import type { Status } from '@/types/status'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const usePifStore = defineStore('xen-api-pif', () => {
  const deps = {
    hostStore: useHostStore(),
    hostMetricsStore: useHostMetricsStore(),
    pifMetricsStore: usePifMetricsStore(),
  }
  const { context: baseContext, ...configRest } = createXapiStoreConfig('pif')

  const hostContext = deps.hostStore.getContext()
  const hostMetricsContext = deps.hostMetricsStore.getContext()
  const pifMetricsContext = deps.pifMetricsStore.getContext()

  const pifsInfoByNetwork = computed(() => {
    const pifsInfoMap = new Map<
      string,
      {
        PIF: XenApiPif
        status: Status
        host?: {
          name_label?: string
          status?: boolean
        }
      }[]
    >()

    baseContext.records.value.forEach(PIF => {
      const hostInfo = hostContext.getByOpaqueRef(PIF.host) as XenApiHost
      const hostStatus = hostMetricsContext.getByOpaqueRef(hostInfo.metrics)?.live

      const pifCarrier = pifMetricsContext.getPifCarrier(PIF)
      const pifCurrentlyAttached = PIF.currently_attached

      const status = ((): Status => {
        if (pifCarrier && pifCurrentlyAttached) {
          return 'connected'
        }
        if (!pifCarrier && pifCurrentlyAttached) {
          return 'disconnected-from-physical-device'
        }
        return 'disconnected'
      })()

      const enrichedPIF = {
        PIF,
        status,
        host: {
          name_label: hostInfo?.name_label,
          hostStatus,
        },
      }

      if (!pifsInfoMap.has(PIF.network)) {
        pifsInfoMap.set(PIF.network, [])
      }
      pifsInfoMap.get(PIF.network)?.push(enrichedPIF)
    })

    return pifsInfoMap
  })

  const getPIFsInformationByNetwork = (network: XenApiNetwork) => {
    return pifsInfoByNetwork.value.get(network?.$ref) || []
  }

  const determineStatus = (PIFs: XenApiPif[]): Status => {
    if (PIFs.length === 0) {
      return 'disconnected'
    }
    const currentlyAttached = PIFs.map(PIF => PIF.currently_attached)
    if (currentlyAttached.every(Boolean)) {
      return 'connected'
    }
    if (currentlyAttached.some(Boolean)) {
      return 'partially-connected'
    }
    return 'disconnected'
  }

  const context = { ...baseContext, determineStatus, getPIFsInformationByNetwork }

  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
