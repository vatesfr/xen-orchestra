import type { XenApiNetwork, XenApiPif } from '@/libs/xen-api/xen-api.types'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const usePifStore = defineStore('xen-api-pif', () => {
  const deps = {
    poolStore: usePoolStore(),
  }
  const { context: baseContext, ...configRest } = createXapiStoreConfig('pif')

  const poolContext = deps.poolStore.getContext()

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

  const pifsByNetwork = computed(() => {
    const pifsByNetworkMap = new Map<XenApiNetwork['$ref'], XenApiPif[]>()

    baseContext.records.value.forEach(pif => {
      const networkId = pif.network
      if (!pifsByNetworkMap.has(networkId)) {
        pifsByNetworkMap.set(networkId, [])
      }
      pifsByNetworkMap.get(networkId)?.push(pif)
    })

    return pifsByNetworkMap
  })

  const context = { ...baseContext, pifsByNetwork, hostMasterPifsByNetwork }

  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
