import type { XoNetwork, XoPif } from '@vates/types'

export function getPoolNetworkLink(network: XoNetwork | undefined) {
  return network !== undefined ? `/pool/${network.$pool}/networks?id=${network.id}` : undefined
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
