import type { XenApiNetwork, XenApiPool } from '@/libs/xen-api/xen-api.types.ts'
import type { RouteLocationAsRelative } from 'vue-router'

export function getPoolNetworkRoute(
  poolId: XenApiPool['uuid'],
  highlightNetworkId?: XenApiNetwork['uuid']
): RouteLocationAsRelative {
  return {
    name: '/pool/[uuid]/network',
    params: { uuid: poolId },
    query: { id: highlightNetworkId },
  }
}
