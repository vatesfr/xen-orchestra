import { CONNECTION_STATUS } from '@/shared/constants.ts'
import type { XoNetwork, XoPif, XoPool } from '@vates/types'
import type { RouteLocationAsRelative } from 'vue-router'

export function getPoolNetworkRoute(
  poolId: XoPool['id'],
  highlightNetworkId?: XoNetwork['id']
): RouteLocationAsRelative {
  return {
    name: '/pool/[id]/networks',
    params: { id: poolId },
    query: { id: highlightNetworkId },
  }
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
