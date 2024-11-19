import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import type { XoHost } from '@/types/xo/host.type'
import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export const useNetworkStore = defineStore('network', () => {
  const deps = {
    pifStore: usePifStore(),
  }
  const { context: baseContext, ...configRest } = createXoStoreConfig('network', {
    sortBy: sortByNameLabel,
  })
  const pifContext = deps.pifStore.getContext()

  const currentRoute = useRoute()

  const pifsByHost = computed(() => {
    return pifContext.pifs.value
      .filter(pif => pif.$host === (currentRoute.params.id as XoHost['id']))
      .map(pif => {
        const network = baseContext.records.value.find(network => network.uuid === pif.$network)

        return {
          ...pif,
          selected: false,
          networkLabel: network.name_label,
          allIps: [pif.ip, ...pif.ipv6].filter(ip => ip),
          nbd: network.nbd,
          tags: network.tags,
          defaultLockingMode: network.defaultIsLocked,
        }
      })
  })

  const context = {
    ...pifContext,
    ...baseContext,
    pifsByHost,
  }

  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
