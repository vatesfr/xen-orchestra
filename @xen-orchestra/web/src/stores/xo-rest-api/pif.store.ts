import { usePoolStore } from '@/stores/xo-rest-api/pool.store'
import type { XoNetwork } from '@/types/xo/network.type'
import type { XoPif } from '@/types/xo/pif.type'
import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const usePifStore = defineStore('pif', () => {
  const deps = {
    poolStore: usePoolStore(),
  }

  const { context: baseContext, ...configRest } = createXoStoreConfig('pif')

  const poolContext = deps.poolStore.getContext()

  const pifsByHostMaster = computed(() => {
    const pifsByHostMasterMap = new Map<XoNetwork['id'], XoPif[]>()

    baseContext.records.value
      .filter(pif => poolContext.isPoolMaster(pif.$host))
      .forEach(pif => {
        const networkId = pif.$network
        if (!pifsByHostMasterMap.has(networkId)) {
          pifsByHostMasterMap.set(networkId, [])
        }
        pifsByHostMasterMap.get(networkId)?.push(pif)
      })

    return pifsByHostMasterMap
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
    pifsByHostMaster,
  }
  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
