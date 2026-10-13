import { NETWORK_DEFAULT_LOCKING_MODE } from '@/libs/xen-api/xen-api.enums.ts'
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

export function compareNetworkMtus(network1: XenApiNetwork, network2: XenApiNetwork) {
  return network1.MTU - network2.MTU
}

function isNetworkLocked(network: XenApiNetwork) {
  return network.default_locking_mode === NETWORK_DEFAULT_LOCKING_MODE.DISABLED
}

export function compareNetworkLockingModes(network1: XenApiNetwork, network2: XenApiNetwork) {
  return Number(isNetworkLocked(network1)) - Number(isNetworkLocked(network2))
}
