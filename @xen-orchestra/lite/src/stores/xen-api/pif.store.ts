import type { XenApiPif } from '@/libs/xen-api/xen-api.types'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { useHostStore } from '@/stores/xen-api/host.store'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const usePifStore = defineStore('xen-api-pif', () => {
  const deps = {
    hostStore: useHostStore(),
    poolStore: usePoolStore(),
  }
  const { context: baseContext, ...configRest } = createXapiStoreConfig('pif')

  const hostContext = deps.hostStore.getContext()
  const poolContext = deps.poolStore.getContext()

  const pifsByHostMaster = computed(() => {
    const pifsByHostMasterMap = new Map<string, XenApiPif[]>()
    const poolMasterRef = poolContext.pool.value?.master
    const currentHostRef = hostContext.records.value.find(host => host.$ref === poolMasterRef)

    if (currentHostRef) {
      baseContext.records.value
        .filter(pif => pif.host === poolMasterRef)
        .forEach(pif => {
          if (!pifsByHostMasterMap.has(pif.network)) {
            pifsByHostMasterMap.set(pif.network, [])
          }
          pifsByHostMasterMap.get(pif.network)?.push(pif)
        })
    }
    return pifsByHostMasterMap
  })

  const pifsByNetwork = computed(() => {
    const pifsByNetworkMap = new Map<string, XenApiPif[]>()

    baseContext.records.value.forEach(pif => {
      const networkId = pif.network
      if (!pifsByNetworkMap.has(networkId)) {
        pifsByNetworkMap.set(networkId, [])
      }
      pifsByNetworkMap.get(networkId)?.push(pif)
    })
    return pifsByNetworkMap
  })

  const context = { ...baseContext, pifsByNetwork, pifsByHostMaster }

  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
