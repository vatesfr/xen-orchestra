import { useHostStore } from '@/stores/xo-rest-api/host.store'
import type { XoHost } from '@/types/xo/host.type'
import type { XoNetwork } from '@/types/xo/network.type'
import type { XoPif } from '@/types/xo/pif.type'
import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const usePifStore = defineStore('pif', () => {
  const deps = {
    hostStore: useHostStore(),
  }

  const { context: baseContext, ...configRest } = createXoStoreConfig('pif')

  const hostContext = deps.hostStore.getContext()

  const hostMasterPifsByNetwork = computed(() => {
    const hostMasterPifsByNetworkMap = new Map<XoNetwork['id'], XoPif[]>()

    baseContext.records.value
      .filter(pif => hostContext.isMasterHost(pif.$host))
      .forEach(pif => {
        const networkId = pif.$network
        if (!hostMasterPifsByNetworkMap.has(networkId)) {
          hostMasterPifsByNetworkMap.set(networkId, [])
        }
        hostMasterPifsByNetworkMap.get(networkId)?.push(pif)
      })

    return hostMasterPifsByNetworkMap
  })

  const getPifsByNetworkRef = (networkId: XoNetwork['id']) => {
    return baseContext.records.value.filter(pif => pif.$network === networkId)
  }

  const getPifStatus = (pif: XoPif) => {
    if (!pif.attached) {
      return 'disconnected'
    }

    if (!pif.carrier) {
      return 'disconnected-from-physical-device'
    }

    return 'connected'
  }

  const pifsByHost = computed(() => {
    const pifsByHostMap = new Map<XoHost['id'], XoPif[]>()

    baseContext.records.value.forEach(pif => {
      const hostId = pif.$host
      if (!pifsByHostMap.has(hostId)) {
        pifsByHostMap.set(hostId, [])
      }

      pifsByHostMap.get(hostId)!.push(pif)
    })

    return pifsByHostMap
  })

  const context = {
    ...baseContext,
    hostMasterPifsByNetwork,
    pifsByHost,
    getPifsByNetworkRef,
    getPifStatus,
  }
  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
