import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { CONNECTION_STATUS } from '@/shared/constants.ts'
import type { RouteLocationAsRelative } from 'vue-router'

export const NETWORK_TYPE = {
  BONDED: 'bonded',
  INTERNAL: 'internal',
  PHYSICAL: 'physical',
}

export type NetworkType = (typeof NETWORK_TYPE)[keyof typeof NETWORK_TYPE]

export function getPoolNetworkRoute(
  poolId: FrontXoPool['id'],
  highlightNetworkId?: FrontXoNetwork['id']
): RouteLocationAsRelative {
  return {
    name: '/pool/[id]/networks',
    params: { id: poolId },
    query: { id: highlightNetworkId },
  }
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

export function getNetworkType(network: FrontXoNetwork): NetworkType {
  if (network.isBonded) {
    return NETWORK_TYPE.BONDED
  }

  if (network.PIFs.length === 0) {
    return NETWORK_TYPE.INTERNAL
  }

  return NETWORK_TYPE.PHYSICAL
}
