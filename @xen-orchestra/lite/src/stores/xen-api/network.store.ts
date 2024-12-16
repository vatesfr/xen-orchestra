import type { Status } from '@/components/pool/network/PoolNetworksPifStatus.vue'
import type { XenApiPif } from '@/libs/xen-api/xen-api.types'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { useHostStore } from '@/stores/xen-api/host.store'
import { usePifStore } from '@/stores/xen-api/pif.store'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export const useNetworkStore = defineStore('xen-api-network', () => {
  const { t } = useI18n()

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

  const pifsByNetwork = computed(() => {
    const PIFsByNetworkMap = new Map<string, XenApiPif[]>()

    const poolMasterRef = poolContext.pool.value?.master

    const currentHostRef = hostContext.records.value.find(host => host.$ref === poolMasterRef)
    if (currentHostRef) {
      pifContext.records.value
        .filter(pif => pif.host === poolMasterRef)
        .forEach(pif => {
          if (!PIFsByNetworkMap.has(pif.network)) {
            PIFsByNetworkMap.set(pif.network, [])
          }
          PIFsByNetworkMap.get(pif.network)?.push(pif)
        })
    }
    return PIFsByNetworkMap
  })

  const networksWithVLANs = computed(() =>
    baseContext.records.value
      .filter(network => network.PIFs.length > 0)
      .map(network => {
        const relatedPifs = pifsByNetwork.value.get(network.$ref) || []
        const vlan =
          relatedPifs.length > 0 ? (relatedPifs[0].VLAN === -1 ? t('none') : relatedPifs[0].VLAN.toString()) : ''
        const status = determineStatus(relatedPifs)

        return { network, vlan, status }
      })
  )

  const hostInternalNetworks = computed(() => {
    return baseContext.records.value.filter(network => network.PIFs.length === 0) // Only networks without PIFs
  })

  const context = {
    ...baseContext,
    networksWithVLANs,
    hostInternalNetworks,
  }

  return createSubscribableStoreContext({ context, ...configRest }, deps)
})

function determineStatus(PIFs: XenApiPif[]): Status {
  if (PIFs.length === 0) {
    return 'disconnected'
  }
  const currentlyAttached = PIFs.map(PIF => PIF.currently_attached)
  if (currentlyAttached.every(Boolean)) {
    return 'connected'
  }
  if (currentlyAttached.some(Boolean)) {
    return 'partial'
  }
  return 'disconnected'
}
