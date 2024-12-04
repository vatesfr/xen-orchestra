import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import type { XoHost } from '@/types/xo/host.type'
import type { XoPif } from '@/types/xo/pif.type'
import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const usePifStore = defineStore('pif', () => {
  const { context: baseContext, ...config } = createXoStoreConfig('pif', {})
  const deps = {
    networkStore: useNetworkStore(),
  }

  const networkContext = deps.networkStore.getContext()
  const pifsByHost = computed<Map<string, XoPif[]>>(() => {
    const pifsByHostMap = new Map<XoHost['id'], XoPif[]>()

    baseContext.records.value.forEach(pif => {
      const hostId = pif.$host
      const network = networkContext.records.value.find(network => network.id === pif.$network)
      if (!pifsByHostMap.has(hostId)) {
        pifsByHostMap.set(hostId, [])
      }

      pifsByHostMap.get(hostId)!.push({
        ...pif,
        networkLabel: network?.name_label ?? 'Unknown',
        nbd: network?.nbd ?? false,
        tags: network?.tags ?? [],
        defaultLockingMode: network?.defaultIsLocked ?? false,
        selected: false,
      })
    })
    return pifsByHostMap
  })
  const context = {
    ...baseContext,
    pifsByHost,
  }
  return createSubscribableStoreContext({ context, ...config }, deps)
})
