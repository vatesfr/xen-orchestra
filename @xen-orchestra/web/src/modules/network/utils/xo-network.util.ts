import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { type IconName, objectIcon } from '@core/icons'
import { getConnectionStatus } from '@core/utils/connection.util.ts'
import {
  SDN_CONTROLLER_ENCAPSULATION_KEY,
  SDN_CONTROLLER_ENCRYPTED_KEY,
  SDN_CONTROLLER_PRIVATE_NETWORK_UUID_KEY,
  TUNNEL_PROTOCOL,
} from '@vates/types'
import type { RouteLocationAsRelative } from 'vue-router'

export const NETWORK_TYPE = {
  BONDED: 'bonded',
  INTERNAL: 'internal',
  PHYSICAL: 'physical',
  PRIVATE: 'private',
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

export function getNetworkRoute(networkId: FrontXoNetwork['id']): RouteLocationAsRelative {
  return {
    name: '/network/[id]',
    params: { id: networkId },
  }
}

export function getNetworkStatus(pifs: FrontXoPif[]) {
  return getConnectionStatus(pifs.map(pif => pif.attached && pif.carrier))
}

export function getNetworkIcon(pifs: FrontXoPif[]): IconName {
  return objectIcon('network', getNetworkStatus(pifs))
}

export function getNetworkType(network: FrontXoNetwork): NetworkType {
  if (isPrivateNetwork(network)) {
    return NETWORK_TYPE.PRIVATE
  }

  if (network.isBonded) {
    return NETWORK_TYPE.BONDED
  }

  if (network.PIFs.length === 0) {
    return NETWORK_TYPE.INTERNAL
  }

  return NETWORK_TYPE.PHYSICAL
}

export function isPrivateNetwork(network: FrontXoNetwork) {
  return network.other_config[SDN_CONTROLLER_PRIVATE_NETWORK_UUID_KEY] !== undefined
}

export const ENCAPSULATION_LABELS: Record<TUNNEL_PROTOCOL, string> = {
  gre: 'GRE',
  vxlan: 'VxLAN',
}

export function isEncryptedNetwork(network: FrontXoNetwork) {
  return network.other_config[SDN_CONTROLLER_ENCRYPTED_KEY] === 'true'
}

export function getNetworkEncapsulation(network: FrontXoNetwork): TUNNEL_PROTOCOL {
  if (network.other_config[SDN_CONTROLLER_ENCAPSULATION_KEY] === TUNNEL_PROTOCOL.VXLAN) {
    return TUNNEL_PROTOCOL.VXLAN
  }

  return TUNNEL_PROTOCOL.GRE
}

export function getEncryptedEncapsulationsByPool(networks: FrontXoNetwork[]) {
  const encryptedEncapsulationsByPool = new Map<FrontXoNetwork['$pool'], Set<TUNNEL_PROTOCOL>>()

  networks.forEach(network => {
    if (!isPrivateNetwork(network) || !isEncryptedNetwork(network)) {
      return
    }

    const encapsulation = getNetworkEncapsulation(network)

    const poolEncapsulations = encryptedEncapsulationsByPool.get(network.$pool) ?? new Set<TUNNEL_PROTOCOL>()

    poolEncapsulations.add(encapsulation)
    encryptedEncapsulationsByPool.set(network.$pool, poolEncapsulations)
  })

  return encryptedEncapsulationsByPool
}
