import type { XenApiPif } from '@/libs/xen-api/xen-api.types'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { useHostStore } from '@/stores/xen-api/host.store'
import { usePifStore } from '@/stores/xen-api/pif.store'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useNetworkStore = defineStore('xen-api-network', () => {
  const deps = {
    poolStore: usePoolStore(),
    hostStore: useHostStore(),
    pifStore: usePifStore(),
  }

  const { context: baseContext, ...configRest } = createXapiStoreConfig('network', {
    sortBy: sortByNameLabel,
  })

  const poolContext = deps.poolStore.getContext()
  const hostContext = deps.hostStore.getContext()
  const pifContext = deps.pifStore.getContext()

  const PIFsByNetwork = computed(() => {
    const PIFsByNetworkMap = new Map<string, XenApiPif[]>()

    poolContext.records.value.forEach(pool => {
      const masterPoolRef = pool.master
      const currentHostRef = hostContext.records.value.find(host => host.$ref === masterPoolRef)
      if (currentHostRef) {
        pifContext.records.value
          .filter(pif => pif.host === masterPoolRef)
          .forEach(pif => {
            if (!PIFsByNetworkMap.has(pif.network)) {
              PIFsByNetworkMap.set(pif.network, [])
            }
            PIFsByNetworkMap.get(pif.network)?.push(pif)
          })
      }
    })
    return PIFsByNetworkMap
  })

  const determineStatus = (PIFs: XenApiPif[]): string => {
    const currentlyAttached = PIFs.map(PIF => PIF.currently_attached)
    if (currentlyAttached.every(attached => attached)) {
      return 'connected'
    } else if (currentlyAttached.some(attached => attached)) {
      return 'partially connected'
    }
    return 'disconnected'
  }

  const networksWithVLANs = computed(() => {
    return baseContext.records.value
      .filter(network => network.PIFs.length > 0)
      .map(network => {
        const relatedPifs = PIFsByNetwork.value.get(network.$ref) || []
        const vlan = relatedPifs.length > 0 ? (relatedPifs[0].VLAN === -1 ? 'None' : relatedPifs[0].VLAN) : ''
        const status = determineStatus(relatedPifs)

        return {
          ...network,
          selected: false,
          vlan,
          status,
        }
      })
  })

  const hostPrivateNetworks = computed(() => {
    return baseContext.records.value
      .filter(network => network.PIFs.length === 0) // Only networks without PIFs
      .map(network => ({
        ...network,
        selected: false,
      }))
  })

  const context = {
    ...baseContext,
    networksWithVLANs,
    hostPrivateNetworks,
  }

  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
