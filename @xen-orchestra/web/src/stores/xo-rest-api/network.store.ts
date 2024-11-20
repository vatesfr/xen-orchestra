import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import type { XoHost } from '@/types/xo/host.type'
import type { XoPif } from '@/types/xo/pif.type'
import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useNetworkStore = defineStore('network', () => {
  const deps = {
    pifStore: usePifStore(),
    hostStore: useHostStore(),
  }
  const { context: baseContext, ...configRest } = createXoStoreConfig('network', {
    sortBy: sortByNameLabel,
  })
  const pifContext = deps.pifStore.getContext()

  const pifsByHost = computed<Map<string, XoPif[]>>(() => {
    const pifsByHostMap = new Map<XoHost['id'], XoPif[]>()

    pifContext.records.value.forEach(pif => {
      const hostId = pif.$host

      if (!pifsByHostMap.has(hostId)) {
        pifsByHostMap.set(hostId, [])
      }

      pifsByHostMap.get(hostId)!.push({
        ...pif,
        selected: false,
        networkLabel: (() => {
          const network = baseContext.records.value.find(network => network.uuid === pif.$network)
          return network?.name_label ?? 'Unknown'
        })(),
        allIps: [pif.ip, ...pif.ipv6].filter(ip => ip),
        nbd: (() => {
          const network = baseContext.records.value.find(network => network.uuid === pif.$network)
          return network?.nbd ?? null
        })(),
        tags: (() => {
          const network = baseContext.records.value.find(network => network.uuid === pif.$network)
          return network?.tags ?? []
        })(),
        defaultLockingMode: (() => {
          const network = baseContext.records.value.find(network => network.uuid === pif.$network)
          return network?.defaultIsLocked ?? false
        })(),
      })
    })
    return pifsByHostMap
  })

  const context = {
    ...pifContext,
    ...baseContext,
    pifsByHost,
  }

  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
