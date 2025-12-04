import type { XoNetwork, XoPif, XoPool } from '@vates/types'
import type { RouteLocationAsRelative } from 'vue-router'

export function getPoolNetworkRoute(
  poolId: XoPool['id'],
  highlightNetworkId?: XoNetwork['id']
): RouteLocationAsRelative | undefined {
  return {
    name: '/pool/[id]/networks',
    params: { id: poolId },
    query: { id: highlightNetworkId },
  }
}

export function getNetworkStatus(pifs: XoPif[]) {
  if (pifs.length === 0) {
    return 'disconnected'
  }

  const connectedPifs = pifs.map(pif => pif.attached && pif.carrier)

  if (connectedPifs.length === 0) {
    return 'disconnected'
  }

  if (connectedPifs.every(Boolean)) {
    return 'connected'
  }

  if (connectedPifs.some(Boolean)) {
    return 'partially-connected'
  }

  return 'disconnected'
}
