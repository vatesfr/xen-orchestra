import type { XenApiNetwork, XenApiPif } from '@/libs/xen-api/xen-api.types'
import { useBondStore } from '@/stores/xen-api/bond.store'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { usePifMetricsStore } from '@/stores/xen-api/pif-metrics.store'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const usePifStore = defineStore('xen-api-pif', () => {
  const deps = {
    poolStore: usePoolStore(),
    pifMetricsStore: usePifMetricsStore(),
    bondStore: useBondStore(),
  }
  const { context: baseContext, ...configRest } = createXapiStoreConfig('pif')

  const poolContext = deps.poolStore.getContext()
  const pifMetricsContext = deps.pifMetricsStore.getContext()
  const bondContext = deps.bondStore.getContext()

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

  const getPifsByNetworkRef = (networkRef: XenApiNetwork['$ref']) => {
    return baseContext.records.value.filter(pif => pif.network === networkRef)
  }

  const getPifStatus = (pif: XenApiPif) => {
    const carrier = pifMetricsContext.getPifCarrier(pif)
    const isCurrentlyAttached = pif.currently_attached

    if (!isCurrentlyAttached) {
      return 'disconnected'
    }

    if (!carrier) {
      return 'disconnected-from-physical-device'
    }

    return 'connected'
  }

  const getBondsDevices = (pif: XenApiPif) => {
    if (!pif.bond_master_of) return []

    return pif.bond_master_of.flatMap(bondRef => {
      const bond = bondContext.getByOpaqueRef(bondRef)

      return bond?.slaves.map((pifRef: XenApiPif['$ref']) => baseContext.getByOpaqueRef(pifRef)?.device)
    })
  }

  const isBondMaster = (pif: XenApiPif) => pif.bond_master_of.length > 0

  const context = {
    ...baseContext,
    hostMasterPifsByNetwork,
    getPifsByNetworkRef,
    getPifStatus,
    getBondsDevices,
    isBondMaster,
  }

  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
