import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { usePoolStore } from '@/stores/xo-rest-api/pool.store'
import type { XoHost } from '@/types/xo/host.type'
import type { XoNetwork } from '@/types/xo/network.type'
import type { XoPif } from '@/types/xo/pif.type'
import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

const deps = {
  poolStore: usePoolStore(),
  hostStore: useHostStore(),
}

const poolContext = deps.poolStore.getContext()
const hostContext = deps.hostStore.getContext()

export const usePifStore = defineStore('pif', () => {
  const { context: baseContext, ...configRest } = createXoStoreConfig('pif')
  const pifsByHost = computed<Map<string, XoPif[]>>(() => {
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

  const pifsByNetwork = computed<Map<string, XoPif[]>>(() => {
    const pifsByNetworkMap = new Map<XoNetwork['id'], XoPif[]>()
    const poolMasterRef = poolContext.records.value[0].master
    const currentHostRef = hostContext.records.value.find(host => host.id === poolMasterRef)
    if (currentHostRef) {
      baseContext.records.value.forEach(pif => {
        const NetworkId = pif.$network
        if (!pifsByNetworkMap.has(NetworkId)) {
          pifsByNetworkMap.set(NetworkId, [])
        }

        pifsByNetworkMap.get(NetworkId)!.push(pif)
      })
    }

    return pifsByNetworkMap
  })
  const context = {
    ...baseContext,
    pifsByHost,
    pifsByNetwork,
  }
  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
