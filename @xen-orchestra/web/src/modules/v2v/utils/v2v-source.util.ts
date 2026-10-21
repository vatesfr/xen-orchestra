import type { XoV2vConnection, XoV2vInventory, XoV2vVm } from '@vates/types'

export type V2vSourceKind = 'vcenter' | 'esxi'

export const V2V_DEFAULT_PORT = 443

export function normalizeV2vHost(host: string): string {
  return host.trim().toLowerCase()
}

export function getV2vAddress({ host, port }: Pick<XoV2vConnection, 'host' | 'port'>): `${string}:${number}` {
  return `${normalizeV2vHost(host)}:${port}`
}

export function getV2vSourceKind(product: string | undefined): V2vSourceKind | undefined {
  if (product === undefined) {
    return undefined
  }

  if (/vcenter/i.test(product)) {
    return 'vcenter'
  }

  return /esxi/i.test(product) ? 'esxi' : undefined
}

// A standalone ESXi has no instance UUID: its identity is the address it is reached at (spec, accepted limitation)
export function getV2vSourceId(
  connection: Pick<XoV2vConnection, 'host' | 'port'>,
  instanceUuid: string | undefined
): string {
  if (instanceUuid) {
    return instanceUuid
  }

  return getV2vAddress(connection)
}

export function getV2vVmDatacenterName(
  inventory: Pick<XoV2vInventory, 'hosts' | 'datacenters'>,
  vm: Pick<XoV2vVm, 'hostId'>
): string | undefined {
  const datacenterId = inventory.hosts.find(host => host.id === vm.hostId)?.datacenterId

  return inventory.datacenters.find(datacenter => datacenter.id === datacenterId)?.name
}
