import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { type IconName, objectIcon } from '@core/icons'
import { getConnectionStatus } from '@core/utils/connection.util.ts'
import type { RouteLocationAsRelative } from 'vue-router'

export const NETWORK_TYPE = {
  BONDED: 'bonded',
  INTERNAL: 'internal',
  PHYSICAL: 'physical',
} as const

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
  return getConnectionStatus(pifs.map(pif => pif.attached && pif.carrier))
}

export function getNetworkIcon(pifs: FrontXoPif[]): IconName {
  return objectIcon('network', getNetworkStatus(pifs))
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
