import { useHostStore } from '@/stores/xo-rest-api/host.store'
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

  const pifsByNetwork = computed(() => {
    const pifsByNetworkMap = new Map<XoNetwork['id'], XoPif[]>()

    baseContext.records.value.forEach(pif => {
      const networkId = pif.$network
      if (!pifsByNetworkMap.has(networkId)) {
        pifsByNetworkMap.set(networkId, [])
      }
      pifsByNetworkMap.get(networkId)?.push(pif)
    })

    return pifsByNetworkMap
  })
  const context = {
    ...baseContext,
    pifsByNetwork,
    hostMasterPifsByNetwork,
  }
  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
