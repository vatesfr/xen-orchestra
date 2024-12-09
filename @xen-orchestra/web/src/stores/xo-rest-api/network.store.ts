import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import { usePoolStore } from '@/stores/xo-rest-api/pool.store'
import type { XoNetwork } from '@/types/xo/network.type'
import type { XoPif } from '@/types/xo/pif.type'
import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const deps = {
  poolStore: usePoolStore(),
  hostStore: useHostStore(),
  pifStore: usePifStore(),
}

const pifContext = deps.pifStore.getContext()

export const useNetworkStore = defineStore('network', () => {
  const { t } = useI18n()
  const { context: baseContext, ...restConfig } = createXoStoreConfig('network')

  const networksWithVLANs = computed(() => {
    const networksInfoMap = new Map<string, { network: XoNetwork; vlan: string; status: string }>()
    return baseContext.records.value
      .filter(network => network.PIFs.length > 0)
      .map(network => {
        const relatedPifs = pifContext.pifsByNetwork.value.get(network.id) || []
        const vlan =
          relatedPifs.length > 0 ? (relatedPifs[0].vlan === -1 ? t('none') : relatedPifs[0].vlan.toString()) : ''
        const networkWithDetails = {
          network,
          vlan,
          status: determineStatus(relatedPifs),
        }
        if (!networksInfoMap.has(network.id)) {
          networksInfoMap.set(network.id, networkWithDetails)
        }
        networksInfoMap.set(network.id, networkWithDetails)
        return networkWithDetails
      })
  })

  const hostInternalNetworks = computed(() => {
    return baseContext.records.value.filter(network => network.PIFs.length === 0)
  })

  const context = {
    ...baseContext,
    networksWithVLANs,
    hostInternalNetworks,
  }
  return createSubscribableStoreContext({ context, ...restConfig }, deps)
})

function determineStatus(PIFs: XoPif[]): string {
  if (PIFs.length === 0) {
    return 'disconnected'
  }
  let allConnected = true
  let partiallyConnected = false

  for (const PIF of PIFs) {
    const { carrier, attached } = PIF
    if (!(carrier && attached)) {
      allConnected = false
    }
    if (carrier || attached) {
      partiallyConnected = true
    }
  }
  if (allConnected) {
    return 'connected'
  }
  if (partiallyConnected) {
    return 'partially_connected'
  }
  return 'disconnected'
}
