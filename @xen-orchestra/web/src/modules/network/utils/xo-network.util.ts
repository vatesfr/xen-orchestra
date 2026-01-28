import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { CONNECTION_STATUS } from '@/shared/constants.ts'

export function getPoolNetworkLink(network: FrontXoNetwork | undefined) {
  return network !== undefined ? `/pool/${network.$pool}/networks?id=${network.id}` : undefined
}

export function getNetworkStatus(pifs: FrontXoPif[]) {
  if (pifs.length === 0) {
    return CONNECTION_STATUS.DISCONNECTED
  }

  const connectedPifs = pifs.map(pif => pif.attached && pif.carrier)

  if (connectedPifs.length === 0) {
    return CONNECTION_STATUS.DISCONNECTED
  }

  if (connectedPifs.every(Boolean)) {
    return CONNECTION_STATUS.CONNECTED
  }

  if (connectedPifs.some(Boolean)) {
    return CONNECTION_STATUS.PARTIALLY_CONNECTED
  }

  return CONNECTION_STATUS.DISCONNECTED
}
