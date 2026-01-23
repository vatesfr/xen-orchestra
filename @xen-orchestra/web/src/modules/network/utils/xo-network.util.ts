import { CONNECTION_STATUS } from '@/shared/constants.ts'
import type { XoNetwork, XoPif } from '@vates/types'

export function getPoolNetworkLink(network: XoNetwork | undefined) {
  return network !== undefined ? `/pool/${network.$pool}/networks?id=${network.id}` : undefined
}

export function getNetworkStatus(pifs: XoPif[]) {
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
