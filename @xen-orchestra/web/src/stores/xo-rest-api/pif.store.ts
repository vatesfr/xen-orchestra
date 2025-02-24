import { useHostStore } from '@/stores/xo-rest-api/host.store'
import type { XoHost } from '@/types/xo/host.type'
import type { XoNetwork } from '@/types/xo/network.type'
import type { XoPif } from '@/types/xo/pif.type'
import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import type { ConnectionStatus } from '@core/components/connection-status/VtsConnectionStatus.vue'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const usePifStore = defineStore('pif', () => {
  const deps = {
    hostStore: useHostStore(),
  }

  const { context: baseContext, ...configRest } = createXoStoreConfig('pif')

  const hostContext = deps.hostStore.getContext()

  const hostMasterPifsByNetwork = computed(() => {
    const hostMasterPifsByNetworkMap = new Map<XoNetwork['id'], XoPif[]>()

    baseContext.records.value
      .filter(pif => hostContext.isMasterHost(pif.$host))
      .forEach(pif => {
        const networkId = pif.$network
        if (!hostMasterPifsByNetworkMap.has(networkId)) {
          hostMasterPifsByNetworkMap.set(networkId, [])
        }
        hostMasterPifsByNetworkMap.get(networkId)?.push(pif)
      })

    return hostMasterPifsByNetworkMap
  })

  const getPifsByNetworkId = (networkId: XoNetwork['id']) => {
    return baseContext.records.value.filter(pif => pif.$network === networkId)
  }

  const getPifStatus = (pif: XoPif): ConnectionStatus => {
    if (!pif.attached) {
      return 'disconnected'
    }

    if (!pif.carrier) {
      return 'disconnected-from-physical-device'
    }

    return 'connected'
  }

  const pifsByHost = computed(() => {
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

  const getPifStatus = (pif: XoPif) => {
    if (!pif.attached) {
      return 'disconnected'
    }

    if (!pif.carrier) {
      return 'disconnected-from-physical-device'
    }

    return 'connected'
  }

  const getBondsDevices = (pif: XoPif) => {
    if (!pif.isBondMaster) return []
    return []
    // Todo: replace by this code when the PR #8368 is merged
    //   return pif.bondSlaves
    //     .map(slaveId => baseContext.records.value.find(pif => pif.id === slaveId))
    //     .map(pif => pif!.device)
  }

  const context = {
    ...baseContext,
    hostMasterPifsByNetwork,
    pifsByHost,
    getPifsByNetworkId,
    getPifStatus,
    getBondsDevices,
  }
  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
